import EventEmitter from "eventemitter3"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import DB from "./DB" 
import Watcher from "./Watcher"
import { parseFrontmatter, stringifyFrontmatter } from "./frontmatter"
import { atomicWrite, computeHash, toPosix, ensureDir } from "./fsutils"
import { detectConflict, saveConflict } from "./conflicts"
import { EVENTS } from "./events"
import type {
  NoteMeta,
  NoteID,
  NoteWithContent,
  VaultStats,
  VaultReadyPayload,
  NoteCreatedPayload,
  NoteUpdatedPayload,
  NoteDeletedPayload,
  ConflictDetectedPayload,
} from "./types"

/**
 * VaultManager - Main API for storage operations
 *
 * DB-First Architecture:
 * - Note IDs stored ONLY in database
 * - User files contain only user content (no system IDs)
 * - File system is source of truth for content
 * - Database is source of truth for metadata
 */
export default class VaultManager extends EventEmitter {
  vaultPath: string | null = null
  db: DB | null = null
  watcher: Watcher | null = null
  private isWatcherActive = false

  constructor() {
    super()
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize vault: scan files, build database, prepare for operations
   */
  async initializeVault(vaultPath: string): Promise<void> {
    const start = Date.now()

    // Validate path
    const stat = await fs.stat(vaultPath)
    if (!stat.isDirectory()) {
      throw new Error("Vault path must be a directory")
    }

    this.vaultPath = vaultPath

    // Create system directories
    await ensureDir(path.join(vaultPath, ".grimoire"))
    await ensureDir(path.join(vaultPath, ".conflicts"))
    await ensureDir(path.join(vaultPath, ".trash"))

    // Initialize database
    this.db = new DB(vaultPath)

    // Scan vault and build metadata
    console.log("[VaultManager] Scanning vault...")
    const files = await this.walk(vaultPath)
    const notes: NoteMeta[] = []

    for (const file of files) {
      if (!file.endsWith(".md")) continue

      try {
        const noteMeta = await this.processFile(file)
        notes.push(noteMeta)
      } catch (err) {
        console.error(`[VaultManager] Error processing ${file}:`, err)
      }
    }

    // Bulk insert into database
    if (notes.length > 0) {
      this.db.bulkInsertNotes(notes)
    }

    const end = Date.now()

    console.log(
      `[VaultManager] Initialized ${notes.length} notes in ${end - start}ms`
    )

    // Emit ready event
    this.emit(EVENTS.VAULT_READY, {
      vaultPath,
      totalNotes: notes.length,
      totalFolders: this.db.getFolders().length,
      scanTimeMs: end - start,
    } as VaultReadyPayload)
  }

  /**
   * Process a single file: extract metadata, generate ID, compute hash
   * Does NOT modify the file (DB-first approach)
   */
  private async processFile(absolutePath: string): Promise<NoteMeta> {
    const raw = await fs.readFile(absolutePath, "utf8")
    const parsed = parseFrontmatter(raw)
    const stat = await fs.stat(absolutePath)

    const relative = path.relative(this.vaultPath!, absolutePath)
    const posixPath = toPosix(relative)
    const folderPath = toPosix(path.dirname(relative))

    // Generate system ID (stored ONLY in DB)
    const noteId = uuidv4()

    // Use title from frontmatter if available, otherwise filename
    const displayName = parsed.title || path.basename(absolutePath, ".md")

    // User-provided created_at or file birth time
    const createdAt = parsed.created_at || stat.birthtimeMs || Date.now()

    return {
      note_id: noteId,
      path: posixPath,
      display_name: displayName,
      folder_path: folderPath === "." ? "" : folderPath,
      created_at: createdAt,
      updated_at: stat.mtimeMs,
      content_hash: computeHash(raw),
      source: "md",
    }
  }

  /**
   * Recursively walk directory tree
   */
  private async walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip system directories
        if (
          entry.name === ".grimoire" ||
          entry.name === ".conflicts" ||
          entry.name === ".trash" ||
          entry.name === ".git" ||
          entry.name === ".derived" ||
          entry.name === "node_modules"
        ) {
          continue
        }

        const sub = await this.walk(fullPath)
        files.push(...sub)
      } else {
        files.push(fullPath)
      }
    }

    return files
  }

  // ==================== WATCHER CONTROL ====================

  /**
   * Start watching for external file changes
   */
  startWatcher(): void {
    if (!this.vaultPath) {
      throw new Error("Vault not initialized")
    }

    if (this.isWatcherActive) {
      console.warn("[VaultManager] Watcher already active")
      return
    }

    this.watcher = new Watcher(this.vaultPath)
    this.watcher.start(async (event) => {
      await this.handleWatcherEvent(event)
    })

    this.isWatcherActive = true
    console.log("[VaultManager] Watcher started")
  }

  /**
   * Stop watching
   */
  async stopWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.stop()
      this.watcher = null
      this.isWatcherActive = false
      console.log("[VaultManager] Watcher stopped")
    }
  }

  /**
   * Handle file system events from watcher
   */
  private async handleWatcherEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case "add":
          await this.handleExternalAdd(event.relativePath)
          break
        case "change":
          await this.handleExternalChange(event.relativePath)
          break
        case "unlink":
          await this.handleExternalDelete(event.relativePath)
          break
      }
    } catch (err) {
      console.error("[VaultManager] Watcher event error:", err)
    }
  }

  private async handleExternalAdd(relativePath: string): Promise<void> {
    const absolutePath = path.join(this.vaultPath!, relativePath)
    const noteMeta = await this.processFile(absolutePath)

    this.db!.insertNote(noteMeta)

    this.emit(EVENTS.NOTE_CREATED, {
      note_id: noteMeta.note_id,
      path: noteMeta.path,
      folder_path: noteMeta.folder_path,
      display_name: noteMeta.display_name,
      created_at: noteMeta.created_at,
      source: "external",
    } as NoteCreatedPayload)

    console.log(`[VaultManager] External add: ${relativePath}`)
  }

  private async handleExternalChange(relativePath: string): Promise<void> {
    const existing = this.db!.getNoteByPath(relativePath)
    if (!existing) {
      console.warn(`[VaultManager] Change event for unknown note: ${relativePath}`)
      return
    }

    const absolutePath = path.join(this.vaultPath!, relativePath)
    const raw = await fs.readFile(absolutePath, "utf8")
    const newHash = computeHash(raw)

    this.db!.updateNoteHashAndTime(existing.note_id, newHash, Date.now())

    this.emit(EVENTS.NOTE_UPDATED, {
      note_id: existing.note_id,
      path: relativePath,
      updated_at: Date.now(),
      content_hash: newHash,
      source: "external",
    } as NoteUpdatedPayload)

    console.log(`[VaultManager] External change: ${relativePath}`)
  }

  private async handleExternalDelete(relativePath: string): Promise<void> {
    const existing = this.db!.getNoteByPath(relativePath)
    if (!existing) {
      return
    }

    this.db!.softDeleteNote(existing.note_id)

    this.emit(EVENTS.NOTE_DELETED, {
      note_id: existing.note_id,
      path: relativePath,
      trashed: false,
      source: "external",
    } as NoteDeletedPayload)

    console.log(`[VaultManager] External delete: ${relativePath}`)
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new note
   */
  async createNote(
    folderPath: string,
    title: string,
    content: string = ""
  ): Promise<NoteMeta> {
    if (!this.vaultPath || !this.db) {
      throw new Error("Vault not initialized")
    }

    // Generate system ID
    const noteId = uuidv4()
    const createdAt = Date.now()

    // Create filename from title (sanitize)
    const filename = this.sanitizeFilename(title) + ".md"
    const fullFolderPath = path.join(this.vaultPath, folderPath)
    await ensureDir(fullFolderPath)

    const absolutePath = path.join(fullFolderPath, filename)
    const relativePath = toPosix(path.relative(this.vaultPath, absolutePath))

    // Create file with user frontmatter only (no system ID)
    const frontmatter = {
      title,
      created_at: createdAt,
    }

    const fileContent = stringifyFrontmatter(content, frontmatter)
    await atomicWrite(absolutePath, fileContent)

    // Mark as internal write (suppress watcher echo)
    if (this.watcher) {
      this.watcher.markInternalWrite(relativePath)
    }

    // Create DB entry
    const noteMeta: NoteMeta = {
      note_id: noteId,
      path: relativePath,
      display_name: title,
      folder_path: folderPath === "." ? "" : folderPath,
      created_at: createdAt,
      updated_at: createdAt,
      content_hash: computeHash(fileContent),
      source: "md",
    }

    this.db.insertNote(noteMeta)

    // Emit event
    this.emit(EVENTS.NOTE_CREATED, {
      note_id: noteId,
      path: relativePath,
      folder_path: noteMeta.folder_path,
      display_name: title,
      created_at: createdAt,
      source: "internal",
    } as NoteCreatedPayload)

    return noteMeta
  }

  /**
   * Read note content + metadata
   */
  async readNote(noteId: NoteID): Promise<NoteWithContent> {
    if (!this.vaultPath || !this.db) {
      throw new Error("Vault not initialized")
    }

    const meta = this.db.getNoteById(noteId)
    if (!meta) {
      throw new Error(`Note not found: ${noteId}`)
    }

    const absolutePath = path.join(this.vaultPath, meta.path)
    const raw = await fs.readFile(absolutePath, "utf8")
    const parsed = parseFrontmatter(raw)

    return {
      meta,
      content: parsed.content,
      userFrontmatter: parsed.userFrontmatter,
    }
  }

  /**
   * Update note content (with conflict detection)
   */
  async updateNote(noteId: NoteID, newContent: string): Promise<void> {
    if (!this.vaultPath || !this.db) {
      throw new Error("Vault not initialized")
    }

    const meta = this.db.getNoteById(noteId)
    if (!meta) {
      throw new Error(`Note not found: ${noteId}`)
    }

    const absolutePath = path.join(this.vaultPath, meta.path)

    // Read current disk content
    const diskContent = await fs.readFile(absolutePath, "utf8")
    const diskHash = computeHash(diskContent)

    // Conflict detection: check if disk changed since last DB update
    if (meta.content_hash && detectConflict(meta.content_hash, diskHash)) {
      // CONFLICT! Don't overwrite
      const conflictPath = await saveConflict(
        this.vaultPath,
        noteId,
        meta.path,
        newContent,
        meta.content_hash,
        diskHash
      )

      this.emit(EVENTS.CONFLICT_DETECTED, {
        note_id: noteId,
        path: meta.path,
        dbHash: meta.content_hash,
        diskHash,
        conflictPath,
        timestamp: Date.now(),
      } as ConflictDetectedPayload)

      throw new Error(
        `Conflict detected: file changed externally. Check ${conflictPath}`
      )
    }

    // Safe to write
    const parsed = parseFrontmatter(diskContent)
    const updatedContent = stringifyFrontmatter(
      newContent,
      parsed.userFrontmatter
    )

    await atomicWrite(absolutePath, updatedContent)

    // Mark as internal write
    if (this.watcher) {
      this.watcher.markInternalWrite(meta.path)
    }

    // Update DB
    const newHash = computeHash(updatedContent)
    this.db.updateNoteHashAndTime(noteId, newHash, Date.now())

    // Emit event
    this.emit(EVENTS.NOTE_UPDATED, {
      note_id: noteId,
      path: meta.path,
      updated_at: Date.now(),
      content_hash: newHash,
      source: "internal",
    } as NoteUpdatedPayload)
  }

  /**
   * Delete note (soft delete by default, moves to .trash)
   */
  async deleteNote(noteId: NoteID, permanent: boolean = false): Promise<void> {
    if (!this.vaultPath || !this.db) {
      throw new Error("Vault not initialized")
    }

    const meta = this.db.getNoteById(noteId)
    if (!meta) {
      throw new Error(`Note not found: ${noteId}`)
    }

    const absolutePath = path.join(this.vaultPath, meta.path)

    if (permanent) {
      // Hard delete
      await fs.unlink(absolutePath)
      this.db.deleteNote(noteId)
    } else {
      // Soft delete: move to .trash
      const trashDir = path.join(this.vaultPath, ".trash")
      const timestamp = Date.now()
      const trashFilename = `${path.basename(meta.path, ".md")}_${timestamp}.md`
      const trashPath = path.join(trashDir, trashFilename)

      await fs.rename(absolutePath, trashPath)
      this.db.softDeleteNote(noteId)
    }

    // Mark as internal write
    if (this.watcher) {
      this.watcher.markInternalWrite(meta.path)
    }

    // Emit event
    this.emit(EVENTS.NOTE_DELETED, {
      note_id: noteId,
      path: meta.path,
      trashed: !permanent,
      source: "internal",
    } as NoteDeletedPayload)
  }

  // ==================== QUERY OPERATIONS ====================

  /**
   * List all notes (optionally filter by folder)
   */
  async listNotes(folderPath?: string): Promise<NoteMeta[]> {
    if (!this.db) {
      throw new Error("Vault not initialized")
    }

    return this.db.listNotes(folderPath)
  }

  /**
   * Search notes by title
   */
  async searchNotes(query: string): Promise<NoteMeta[]> {
    if (!this.db) {
      throw new Error("Vault not initialized")
    }

    return this.db.searchNotes(query)
  }

  /**
   * Get vault statistics
   */
  async getVaultStats(): Promise<VaultStats> {
    if (!this.vaultPath || !this.db) {
      throw new Error("Vault not initialized")
    }

    return {
      totalNotes: this.db.countNotes(),
      totalFolders: this.db.getFolders().length,
      vaultPath: this.vaultPath,
      lastScan: Date.now(),
      storageVersion: this.db.getConfig("storage_version") || "unknown",
    }
  }

  // ==================== HELPERS ====================

  /**
   * Sanitize filename (remove invalid characters)
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid chars
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .toLowerCase()
      .slice(0, 100) // Limit length
  }

  /**
   * Close database and cleanup
   */
  async close(): Promise<void> {
    await this.stopWatcher()
    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.vaultPath = null
  }
}
