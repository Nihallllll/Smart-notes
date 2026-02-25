/**
 * Smart Notes â€“ Storage Layer: Full Scenario Test
 *
 * Run with:  bun run demo.ts
 *
 * Covers every scenario:
 *  1.  Vault initialization
 *  2.  Create / read / update / delete notes
 *  3.  Re-open vault (UUID stability)
 *  4.  Rename & move notes
 *  5.  Tags (create, update, filter)
 *  6.  Folder operations (create, rename, delete)
 *  7.  Trash & restore
 *  8.  Conflict detection
 *  9.  External file watcher
 * 10.  RAG pipeline methods (modified-since, needs-reindex, status update)
 * 11.  Pagination & sorting
 * 12.  Vault stats
 */

import { VaultManager, EVENTS } from "./src/index"
import type {
  VaultReadyPayload,
  NoteCreatedPayload,
  NoteUpdatedPayload,
  NoteDeletedPayload,
  NoteRenamedPayload,
  NoteMovedPayload,
  ConflictDetectedPayload,
  FolderCreatedPayload,
  FolderRenamedPayload,
  FolderDeletedPayload,
} from "./src/types"
import path from "path"
import fs from "fs/promises"

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Helpers
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  âœ… ${label}`)
    passed++
  } else {
    console.error(`  âŒ FAIL: ${label}`)
    failed++
  }
}

async function section(title: string, fn: () => Promise<void>) {
  console.log(`\n${"â”€".repeat(60)}`)
  console.log(`  SCENARIO: ${title}`)
  console.log("â”€".repeat(60))
  try {
    await fn()
  } catch (err: any) {
    console.error(`  ðŸ’¥ Uncaught error: ${err.message}`)
    failed++
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main() {
  // Clean test vault before each run
  const vaultPath = path.join(import.meta.dir, "test-vault")
  await fs.rm(vaultPath, { recursive: true, force: true })
  await fs.mkdir(vaultPath, { recursive: true })

  console.log(`\nðŸ—„ï¸  Smart Notes â€“ Storage Layer Test`)
  console.log(`   Vault: ${vaultPath}\n`)

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("1. Vault Initialization", async () => {
    const vault = new VaultManager()

    let readyFired = false
    vault.on(EVENTS.VAULT_READY, (p: VaultReadyPayload) => {
      readyFired = true
      console.log(`  â†’ VAULT_READY: ${p.totalNotes} notes, scan took ${p.scanTimeMs}ms`)
    })

    await vault.initializeVault(vaultPath)

    assert(readyFired, "VAULT_READY event fired")
    const stats = await vault.getVaultStats()
    assert(stats.totalNotes === 0, "Empty vault has 0 notes")
    assert(stats.storageVersion === "2.1.0", "DB schema version is 2.1.0")

    // Idempotent â€“ calling init again should not throw
    await vault.initializeVault(vaultPath)
    assert(true, "initializeVault is idempotent (no crash on second call)")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("2. Note CRUD", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    // Create
    const created: string[] = []
    vault.on(EVENTS.NOTE_CREATED, (p: NoteCreatedPayload) => {
      created.push(p.note_id)
      console.log(`  â†’ NOTE_CREATED: "${p.display_name}" at ${p.path}`)
    })

    const note = await vault.createNote("work", "Meeting Notes", "# Meeting\n\nDiscussed Q1 goals.", ["meetings", "work"])
    assert(!!note.note_id, "Note has a UUID")
    assert(note.path.startsWith("work/"), "Note placed in 'work' folder")
    assert(note.display_name === "Meeting Notes", "display_name matches title")
    assert(note.embedding_status === "pending", "New note starts as pending for RAG")
    assert(created.length === 1, "NOTE_CREATED event emitted")

    // Duplicate title in same folder â†’ error
    let collisionThrew = false
    try {
      await vault.createNote("work", "Meeting Notes", "duplicate")
    } catch {
      collisionThrew = true
    }
    assert(collisionThrew, "Creating duplicate path throws error")

    // Empty title â†’ error
    let emptyTitleThrew = false
    try { await vault.createNote("", "", "") } catch { emptyTitleThrew = true }
    assert(emptyTitleThrew, "Empty title throws validation error")

    // Read
    const { content, meta, userFrontmatter } = await vault.readNote(note.note_id)
    assert(content.includes("Q1 goals"), "readNote returns correct content")
    assert(userFrontmatter?.title === "Meeting Notes", "Frontmatter title preserved")
    assert(Array.isArray(userFrontmatter?.tags), "Tags in frontmatter")

    // Update
    const updated: string[] = []
    vault.on(EVENTS.NOTE_UPDATED, (p: NoteUpdatedPayload) => {
      updated.push(p.note_id)
      console.log(`  â†’ NOTE_UPDATED: ${p.path}, source=${p.source}`)
    })

    await vault.updateNote(note.note_id, "# Meeting\n\nDiscussed Q1 goals.\n\nAction items added.")
    const after = await vault.readNote(note.note_id)
    assert(after.content.includes("Action items"), "Content updated on disk")
    assert(updated.length === 1, "NOTE_UPDATED event emitted")

    // DB marks note as stale after update (RAG needs to re-index)
    const updatedMeta = (await vault.listNotes())[0]
    assert(updatedMeta!.embedding_status === "stale", "Embedding status set to stale after content change")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("3. UUID Stability (Re-open vault)", async () => {
    // Open vault fresh, create a note, close
    const v1 = new VaultManager()
    await v1.initializeVault(vaultPath)
    const note = await v1.createNote("", "Stability Test", "hello")
    const originalId = note.note_id
    await v1.close()

    // Re-open the same vault â€“ note must have the SAME UUID
    const v2 = new VaultManager()
    await v2.initializeVault(vaultPath)
    const notes = await v2.listNotes()
    const found = notes.find((n) => n.path === note.path)

    assert(!!found, "Note found after vault re-open")
    assert(found?.note_id === originalId, `UUID preserved across re-open (${originalId})`)

    // Third open for good measure
    await v2.close()
    const v3 = new VaultManager()
    await v3.initializeVault(vaultPath)
    const found3 = (await v3.listNotes()).find((n) => n.path === note.path)
    assert(found3?.note_id === originalId, "UUID stable on third open")
    await v3.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("4. Rename & Move Notes", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const note = await vault.createNote("projects", "Old Title", "Some content")

    // Rename
    const renames: NoteRenamedPayload[] = []
    vault.on(EVENTS.NOTE_RENAMED, (p: NoteRenamedPayload) => {
      renames.push(p)
      console.log(`  â†’ NOTE_RENAMED: "${p.oldDisplayName}" â†’ "${p.newDisplayName}"`)
      console.log(`     path: ${p.oldPath} â†’ ${p.newPath}`)
    })

    const renamed = await vault.renameNote(note.note_id, "New Shiny Title")
    assert(renamed.display_name === "New Shiny Title", "display_name updated in DB")
    assert(renamed.path.includes("new-shiny-title"), "File path updated to match new name")
    assert(renames.length === 1, "NOTE_RENAMED event fired")

    // Frontmatter title updated in the file
    const { userFrontmatter } = await vault.readNote(note.note_id)
    assert(userFrontmatter?.title === "New Shiny Title", "Frontmatter title updated in file")

    // Move to a different folder
    const moves: NoteMovedPayload[] = []
    vault.on(EVENTS.NOTE_MOVED, (p: NoteMovedPayload) => {
      moves.push(p)
      console.log(`  â†’ NOTE_MOVED: ${p.oldFolderPath} â†’ ${p.newFolderPath}`)
    })

    const moved = await vault.moveNote(note.note_id, "archive")
    assert(moved.folder_path === "archive", "folder_path updated in DB")
    assert(moved.path.startsWith("archive/"), "Physical path is under archive/")
    assert(moves.length === 1, "NOTE_MOVED event fired")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("5. Tags", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const note = await vault.createNote("knowledge", "Tagged Note", "content", ["ai", "research", "ideas"])

    // Tags in DB
    const tags = vault["db"]!.getNoteTags(note.note_id)
    assert(tags.includes("ai"), "Tag 'ai' stored in DB")
    assert(tags.includes("research"), "Tag 'research' stored in DB")
    assert(tags.length === 3, "All 3 tags stored")

    // Search by tag
    const found = await vault.searchByTags(["ai"])
    assert(found.some((n) => n.note_id === note.note_id), "searchByTags returns matching note")

    // Update tags (replaces old set)
    await vault.updateNoteTags(note.note_id, ["ai", "llm"])
    const updatedTags = vault["db"]!.getNoteTags(note.note_id)
    assert(updatedTags.length === 2, "Tags replaced correctly")
    assert(!updatedTags.includes("research"), "Old tag 'research' removed")

    // Tags persisted to frontmatter on disk
    const { userFrontmatter } = await vault.readNote(note.note_id)
    assert(
      JSON.stringify(userFrontmatter?.tags?.sort()) === JSON.stringify(["ai", "llm"]),
      "Updated tags persisted to frontmatter on disk"
    )

    // getAllTags
    const allTags = await vault.getAllTags()
    assert(allTags.length > 0, "getAllTags returns at least one tag")
    const aiEntry = allTags.find((t) => t.tag === "ai")
    assert(!!aiEntry && aiEntry.count >= 1, "Tag 'ai' appears in getAllTags with count")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("6. Folder Operations", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const folderCreated: FolderCreatedPayload[] = []
    const folderRenamed: FolderRenamedPayload[] = []
    const folderDeleted: FolderDeletedPayload[] = []

    vault.on(EVENTS.FOLDER_CREATED, (p: FolderCreatedPayload) => {
      folderCreated.push(p)
      console.log(`  â†’ FOLDER_CREATED: "${p.name}" at ${p.path}`)
    })
    vault.on(EVENTS.FOLDER_RENAMED, (p: FolderRenamedPayload) => {
      folderRenamed.push(p)
      console.log(`  â†’ FOLDER_RENAMED: "${p.oldName}" â†’ "${p.newName}", affected ${p.affectedNotes} notes`)
    })
    vault.on(EVENTS.FOLDER_DELETED, (p: FolderDeletedPayload) => {
      folderDeleted.push(p)
      console.log(`  â†’ FOLDER_DELETED: ${p.path}, trashed ${p.affectedNotes} notes`)
    })

    // Create folder
    const folder = await vault.createFolder("design", { icon: "ðŸŽ¨", pinned: true })
    assert(folder.name === "design", "Folder created with correct name")
    assert(folder.pinned === true, "pinned flag stored")
    assert(folderCreated.length === 1, "FOLDER_CREATED event fired")

    // Create idempotent â€“ second call returns existing folder, no duplicate
    await vault.createFolder("design")
    assert(folderCreated.length === 1, "createFolder is idempotent for existing path")

    // Add a note into the folder
    const noteInFolder = await vault.createNote("design", "Logo Work", "## Redesign logo")

    // Rename folder â€“ cascades to note paths
    const renamedFolder = await vault.renameFolder(folder.folder_id, "design-v2")
    assert(renamedFolder.name === "design-v2", "Folder renamed in DB")
    assert(folderRenamed.length === 1, "FOLDER_RENAMED event fired")
    assert(folderRenamed[0]!.affectedNotes >= 1, "Affected note count reported")

    const movedNote = vault["db"]!.getNoteById(noteInFolder.note_id)
    assert(movedNote?.folder_path === "design-v2", "Note's folder_path updated after folder rename")
    assert(movedNote!.path.startsWith("design-v2/"), "Note's path updated after folder rename")

    // Delete folder (with notes) â€“ force required
    let threwWithoutForce = false
    try { await vault.deleteFolder(renamedFolder.folder_id, false) } catch { threwWithoutForce = true }
    assert(threwWithoutForce, "deleteFolder without force throws when folder has notes")

    await vault.deleteFolder(renamedFolder.folder_id, true)
    assert(folderDeleted.length === 1, "FOLDER_DELETED event fired")
    const trashedAfterFolderDelete = await vault.listTrashedNotes()
    assert(trashedAfterFolderDelete.some((n) => n.note_id === noteInFolder.note_id), "Notes in deleted folder were soft-trashed")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("7. Trash & Restore", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const note = await vault.createNote("inbox", "Temp Note", "delete me later")
    const noteId = note.note_id

    // Soft delete
    const deleted: NoteDeletedPayload[] = []
    vault.on(EVENTS.NOTE_DELETED, (p: NoteDeletedPayload) => {
      deleted.push(p)
      console.log(`  â†’ NOTE_DELETED: ${p.path}, trashed=${p.trashed}`)
    })

    await vault.deleteNote(noteId)
    assert(deleted.length === 1 && deleted[0]!.trashed === true, "NOTE_DELETED with trashed=true")

    // Note no longer in active list
    const active = await vault.listNotes()
    assert(!active.some((n) => n.note_id === noteId), "Trashed note not in listNotes()")

    // Appears in trash list
    const trashed = await vault.listTrashedNotes()
    assert(trashed.some((n) => n.note_id === noteId), "Note appears in listTrashedNotes()")

    // Restore
    const restored = await vault.restoreFromTrash(noteId)
    assert(restored.note_id === noteId, "Restored note has same UUID")
    assert(!restored.deleted_at, "restored note has no deleted_at")
    assert(restored.folder_path === "inbox", "Restored to original folder")

    // Back in active notes
    const afterRestore = await vault.listNotes()
    assert(afterRestore.some((n) => n.note_id === noteId), "Restored note visible in listNotes()")

    // Permanent delete
    await vault.deleteNote(noteId, true)
    const afterPermanent = await vault.listNotes()
    assert(!afterPermanent.some((n) => n.note_id === noteId), "Permanently deleted note gone")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("8. Conflict Detection", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const note = await vault.createNote("", "Conflict Test", "original content")
    const absPath = path.join(vaultPath, note.path)

    // Simulate external edit: write directly to the file, bypassing vaultManager
    // This makes the disk hash differ from the DB hash
    await fs.writeFile(absPath, "---\ntitle: Conflict Test\n---\nexternally modified", "utf8")

    const conflicts: ConflictDetectedPayload[] = []
    vault.on(EVENTS.CONFLICT_DETECTED, (p: ConflictDetectedPayload) => {
      conflicts.push(p)
      console.log(`  â†’ CONFLICT_DETECTED: ${p.path}`)
      console.log(`     DB hash:   ${p.dbHash.slice(0, 12)}...`)
      console.log(`     Disk hash: ${p.diskHash.slice(0, 12)}...`)
      console.log(`     Saved to:  ${p.conflictPath}`)
    })

    // Try to update while the file was externally changed â€“ should throw
    let threw = false
    try {
      await vault.updateNote(note.note_id, "my attempted change")
    } catch {
      threw = true
    }

    assert(threw, "updateNote throws on conflict")
    assert(conflicts.length === 1, "CONFLICT_DETECTED event emitted")

    // The conflict file should exist on disk
    const conflictExists = await fs.access(conflicts[0]!.conflictPath).then(() => true).catch(() => false)
    assert(conflictExists, "Conflict file saved to .conflicts/ directory")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("9. External Watcher (External file edits)", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)
    vault.startWatcher()

    const note = await vault.createNote("watch-test", "Watched Note", "initial content")

    // Wait for watcher to settle after the internal create
    await sleep(600)

    const externalUpdates: NoteUpdatedPayload[] = []
    vault.on(EVENTS.NOTE_UPDATED, (p: NoteUpdatedPayload) => {
      if (p.source === "external") externalUpdates.push(p)
      console.log(`  â†’ NOTE_UPDATED source=${p.source}: ${p.path}`)
    })

    // External edit: write directly to file (simulates editing in VS Code, etc.)
    const absPath = path.join(vaultPath, note.path)
    await fs.writeFile(absPath, "---\ntitle: Watched Note\n---\nexternal change!", "utf8")

    // Wait for watcher debounce (300ms) + processing
    await sleep(1000)

    assert(externalUpdates.length >= 1, "Watcher detected external file change")

    // DB hash and display_name should be refreshed
    const afterExternalEdit = vault["db"]!.getNoteById(note.note_id)
    assert(!!afterExternalEdit?.content_hash, "DB hash updated after external edit")
    assert(afterExternalEdit?.embedding_status === "stale", "Embedding status set to stale by watcher")

    await vault.stopWatcher()
    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("10. RAG Pipeline Methods", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    // Create some notes at different times
    const n1 = await vault.createNote("rag", "Note Alpha", "content about machine learning")
    const n2 = await vault.createNote("rag", "Note Beta", "content about neural networks")
    await sleep(50)
    const checkpoint = Date.now()
    await sleep(50)
    const n3 = await vault.createNote("rag", "Note Gamma", "content about transformers")

    // â”€â”€ getNotesNeedingReindex (all pending) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pending = await vault.getNotesNeedingReindex()
    assert(pending.some((r) => r.meta.note_id === n1.note_id), "n1 is pending reindex")
    assert(pending.some((r) => r.meta.note_id === n2.note_id), "n2 is pending reindex")
    assert(pending.some((r) => r.meta.note_id === n3.note_id), "n3 is pending reindex")
    assert(pending[0]!.content !== undefined, "RAGNoteInfo includes content string")
    console.log(`  â†’ getNotesNeedingReindex returned ${pending.length} notes`)

    // â”€â”€ Simulate RAG pipeline indexing n1 and n2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await vault.updateEmbeddingStatus(n1.note_id, "indexed")
    await vault.updateEmbeddingStatus(n2.note_id, "indexed")

    const pendingAfterIndex = await vault.getNotesNeedingReindex()
    assert(!pendingAfterIndex.some((r) => r.meta.note_id === n1.note_id), "n1 no longer pending after indexing")
    assert(!pendingAfterIndex.some((r) => r.meta.note_id === n2.note_id), "n2 no longer pending after indexing")
    assert(pendingAfterIndex.some((r) => r.meta.note_id === n3.note_id), "n3 still needs indexing")

    // â”€â”€ getNotesModifiedSince (incremental run) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const modifiedSince = await vault.getNotesModifiedSince(checkpoint)
    assert(modifiedSince.some((r) => r.meta.note_id === n3.note_id), "getNotesModifiedSince returns n3 (created after checkpoint)")
    assert(!modifiedSince.some((r) => r.meta.note_id === n1.note_id), "n1 not in modifiedSince (created before checkpoint)")
    console.log(`  â†’ getNotesModifiedSince returned ${modifiedSince.length} notes`)

    // â”€â”€ Updating an indexed note marks it stale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await vault.updateNote(n1.note_id, "updated content about deep learning")
    const n1After = vault["db"]!.getNoteById(n1.note_id)
    assert(n1After?.embedding_status === "stale", "Updated indexed note becomes stale")
    const staleList = await vault.getNotesNeedingReindex()
    assert(staleList.some((r) => r.meta.note_id === n1.note_id), "Stale note reappears in reindex queue")

    // â”€â”€ getAllNotesWithContent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const all = await vault.getAllNotesWithContent()
    assert(all.length >= 3, "getAllNotesWithContent returns all active notes")
    assert(all.every((r) => typeof r.content === "string"), "Every item includes content")
    console.log(`  â†’ getAllNotesWithContent returned ${all.length} notes`)

    // â”€â”€ Error status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await vault.updateEmbeddingStatus(n3.note_id, "error")
    const withError = await vault.getNotesNeedingReindex()
    assert(withError.some((r) => r.meta.note_id === n3.note_id), "Error-status note is in reindex queue")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("11. Pagination & Sorting", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    // Create a batch of notes
    for (let i = 1; i <= 5; i++) {
      await vault.createNote("paging", `Note ${i.toString().padStart(2, "0")}`, `content ${i}`)
      await sleep(5) // ensure unique updated_at
    }

    // Default: all notes, newest first
    const all = await vault.listNotes({ folderPath: "paging", orderBy: "display_name", direction: "asc" })
    assert(all.length === 5, "5 paging notes returned")
    assert(all[0]!.display_name < all[4]!.display_name, "Sorted ascending by display_name")

    // Pagination: first page
    const page1 = await vault.listNotes({ folderPath: "paging", limit: 3, offset: 0, orderBy: "display_name", direction: "asc" })
    assert(page1.length === 3, "Page 1 has 3 items")

    // Pagination: second page
    const page2 = await vault.listNotes({ folderPath: "paging", limit: 3, offset: 3, orderBy: "display_name", direction: "asc" })
    assert(page2.length === 2, "Page 2 has 2 items")
    assert(!page1.some((n) => page2.some((m) => m.note_id === n.note_id)), "Pages don't overlap")

    console.log(`  â†’ page1: ${page1.map((n) => n.display_name).join(", ")}`)
    console.log(`  â†’ page2: ${page2.map((n) => n.display_name).join(", ")}`)

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  await section("12. Vault Stats", async () => {
    const vault = new VaultManager()
    await vault.initializeVault(vaultPath)

    const stats = await vault.getVaultStats()
    console.log(`  â†’ totalNotes:  ${stats.totalNotes}`)
    console.log(`  â†’ totalFolders: ${stats.totalFolders}`)
    console.log(`  â†’ storageVersion: ${stats.storageVersion}`)

    assert(stats.totalNotes > 0, "Has notes from previous scenarios")
    assert(typeof stats.totalFolders === "number", "totalFolders is a number")
    assert(stats.storageVersion === "2.1.0", "Storage version correct")

    await vault.close()
  })

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  console.log(`\n${"â•".repeat(60)}`)
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log("â•".repeat(60))

  if (failed > 0) {
    process.exit(1)
  }
}
main().catch((err) => {
  console.error("\n💥 Fatal error:", err)
  process.exit(1)
})
