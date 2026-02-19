import path from "path"
import { Database } from "bun:sqlite"
import { ensureDir } from "./fsutils"
import type { NoteMeta, NoteID } from "./types"

const STORAGE_VERSION = "1.0.0"

export default class DB {
  dbPath: string
  db: Database

  constructor(vaultPath: string) {
    const grimoireDir = path.join(vaultPath, ".grimoire")
    this.dbPath = path.join(grimoireDir, "meta.db")

    ensureDir(grimoireDir)

    this.db = new Database(this.dbPath)
    this.initializeSchema()
    this.runMigrations()
  }

  /**
   * Create tables if they don't exist
   */
  initializeSchema() {
    // Notes table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        note_id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        display_name TEXT,
        folder_path TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        content_hash TEXT,
        source TEXT DEFAULT 'md',
        deleted_at INTEGER DEFAULT NULL
      );
    `)

    // Indexes for performance
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_folder 
      ON notes(folder_path);
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_updated 
      ON notes(updated_at);
    `)

    // Config table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `)
  }

  /**
   * Run version migrations
   */
  runMigrations() {
    const currentVersion = this.getConfig("storage_version")

    if (!currentVersion) {
      // First time setup
      this.setConfig("storage_version", STORAGE_VERSION)
      this.setConfig("initialized_at", Date.now().toString())
      console.log(`[DB] Initialized storage version ${STORAGE_VERSION}`)
    } else if (currentVersion !== STORAGE_VERSION) {
      console.log(
        `[DB] Migration from ${currentVersion} to ${STORAGE_VERSION}`
      )
      // Future migrations go here
    }
  }

  // ==================== CONFIG METHODS ====================

  getConfig(key: string): string | null {
    const row = this.db
      .prepare("SELECT value FROM config WHERE key = ?")
      .get(key) as any
    return row ? row.value : null
  }

  setConfig(key: string, value: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)")
      .run(key, value)
  }

  // ==================== NOTE CRUD ====================

  /**
   * Bulk insert notes (for initial vault scan)
   */
  bulkInsertNotes(notes: NoteMeta[]) {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO notes
      (note_id, path, display_name, folder_path, created_at, updated_at, content_hash, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const transaction = this.db.transaction((notes: NoteMeta[]) => {
      for (const n of notes) {
        insert.run(
          n.note_id,
          n.path,
          n.display_name,
          n.folder_path,
          n.created_at,
          n.updated_at,
          n.content_hash ?? null,
          n.source ?? "md"
        )
      }
    })

    transaction(notes)
  }

  /**
   * Insert a single note
   */
  insertNote(note: NoteMeta): void {
    this.db
      .prepare(
        `
      INSERT INTO notes
      (note_id, path, display_name, folder_path, created_at, updated_at, content_hash, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        note.note_id,
        note.path,
        note.display_name,
        note.folder_path,
        note.created_at,
        note.updated_at,
        note.content_hash ?? null,
        note.source ?? "md"
      )
  }

  /**
   * Get note by ID
   */
  getNoteById(noteId: NoteID): NoteMeta | null {
    const row = this.db
      .prepare("SELECT * FROM notes WHERE note_id = ? AND deleted_at IS NULL")
      .get(noteId) as any

    return row ? this.rowToNoteMeta(row) : null
  }

  /**
   * Get note by path
   */
  getNoteByPath(notePath: string): NoteMeta | null {
    const row = this.db
      .prepare("SELECT * FROM notes WHERE path = ? AND deleted_at IS NULL")
      .get(notePath) as any

    return row ? this.rowToNoteMeta(row) : null
  }

  /**
   * Update note metadata
   */
  updateNote(
    noteId: NoteID,
    updates: Partial<Omit<NoteMeta, "note_id">>
  ): void {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ")
    const values = Object.values(updates)

    this.db
      .prepare(`UPDATE notes SET ${fields} WHERE note_id = ?`)
      .run(...values, noteId)
  }

  /**
   * Update note hash and timestamp (common operation after edit)
   */
  updateNoteHashAndTime(
    noteId: NoteID,
    contentHash: string,
    updatedAt: number
  ): void {
    this.db
      .prepare(
        `
      UPDATE notes 
      SET content_hash = ?, updated_at = ? 
      WHERE note_id = ?
    `
      )
      .run(contentHash, updatedAt, noteId)
  }

  /**
   * Soft delete a note
   */
  softDeleteNote(noteId: NoteID): void {
    this.db
      .prepare("UPDATE notes SET deleted_at = ? WHERE note_id = ?")
      .run(Date.now(), noteId)
  }

  /**
   * Hard delete a note (permanent)
   */
  deleteNote(noteId: NoteID): void {
    this.db.prepare("DELETE FROM notes WHERE note_id = ?").run(noteId)
  }

  /**
   * List all notes (optionally filter by folder)
   */
  listNotes(folderPath?: string): NoteMeta[] {
    let query = "SELECT * FROM notes WHERE deleted_at IS NULL"
    const params: any[] = []

    if (folderPath !== undefined) {
      query += " AND folder_path = ?"
      params.push(folderPath)
    }

    query += " ORDER BY updated_at DESC"

    const rows = this.db.prepare(query).all(...params) as any[]
    return rows.map(this.rowToNoteMeta)
  }

  /**
   * Search notes by display name
   */
  searchNotes(searchTerm: string): NoteMeta[] {
    const rows = this.db
      .prepare(
        `
      SELECT * FROM notes 
      WHERE deleted_at IS NULL 
      AND display_name LIKE ? 
      ORDER BY updated_at DESC
    `
      )
      .all(`%${searchTerm}%`) as any[]

    return rows.map(this.rowToNoteMeta)
  }

  /**
   * Count all notes
   */
  countNotes(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL")
      .get() as any

    return row.count
  }

  /**
   * Get unique folder paths
   */
  getFolders(): string[] {
    const rows = this.db
      .prepare(
        `
      SELECT DISTINCT folder_path 
      FROM notes 
      WHERE deleted_at IS NULL 
      ORDER BY folder_path
    `
      )
      .all() as any[]

    return rows.map((r) => r.folder_path)
  }

  // ==================== HELPERS ====================

  private rowToNoteMeta(row: any): NoteMeta {
    return {
      note_id: row.note_id,
      path: row.path,
      display_name: row.display_name,
      folder_path: row.folder_path,
      created_at: row.created_at,
      updated_at: row.updated_at,
      content_hash: row.content_hash,
      source: row.source,
      deleted_at: row.deleted_at,
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}