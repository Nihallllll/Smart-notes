/**
 * DEMO: How to use Storage Layer
 * 
 * This file shows you the complete flow of using VaultManager
 */

import { VaultManager } from "./src/index"
import type { VaultReadyPayload, NoteCreatedPayload, NoteUpdatedPayload, NoteDeletedPayload, ConflictDetectedPayload, NoteMeta } from "./src/types"
import path from "path"

async function demo() {
  console.log("=== Storage Layer Demo ===\n")

  // 1. Create VaultManager instance
  const vault = new VaultManager()

  // 2. Initialize vault (point to your notes folder)
  const vaultPath = path.join(import.meta.dir, "demo-vault")
  
  console.log(`📂 Initializing vault: ${vaultPath}`)
  
  vault.on("vaultReady", (payload: VaultReadyPayload) => {
    console.log(`✅ Vault ready! Scanned ${payload.totalNotes} notes in ${payload.scanTimeMs}ms`)
  })

  await vault.initializeVault(vaultPath)

  // 3. Listen to events
  vault.on("noteCreated", (payload: NoteCreatedPayload) => {
    console.log(`📝 Note created: ${payload.display_name} (${payload.source})`)
  })

  vault.on("noteUpdated", (payload: NoteUpdatedPayload) => {
    console.log(`✏️  Note updated: ${payload.path} (${payload.source})`)
  })

  vault.on("noteDeleted", (payload: NoteDeletedPayload) => {
    console.log(`🗑️  Note deleted: ${payload.path}`)
  })

  vault.on("conflictDetected", (payload: ConflictDetectedPayload) => {
    console.error(`⚠️  CONFLICT: ${payload.path} → saved to ${payload.conflictPath}`)
  })

  // 4. Start watcher (detects external edits)
  console.log("\n👀 Starting file watcher...")
  vault.startWatcher()

  // 5. Create a note
  console.log("\n📝 Creating a new note...")
  const note = await vault.createNote(
    "demo",
    "My First Note",
    "This is my first note using the storage layer!\n\n## Features\n- DB-First architecture\n- Conflict detection\n- File watching"
  )
  console.log(`   Note ID: ${note.note_id}`)
  console.log(`   Path: ${note.path}`)

  // 6. Read the note
  console.log("\n📖 Reading note...")
  const { content, meta, userFrontmatter } = await vault.readNote(note.note_id)
  console.log(`   Title: ${meta.display_name}`)
  console.log(`   Content preview: ${content.substring(0, 50)}...`)
  console.log(`   Frontmatter:`, userFrontmatter)

  // 7. Update the note
  console.log("\n✏️  Updating note...")
  await vault.updateNote(note.note_id, content + "\n\n✅ This line was added!")
  console.log("   Update successful")

  // 8. List all notes
  console.log("\n📋 Listing all notes...")
  const allNotes = await vault.listNotes()
  allNotes.forEach((n: NoteMeta) => {
    console.log(`   - ${n.display_name} (${n.path})`)
  })

  // 9. Search notes
  console.log("\n🔍 Searching for 'first'...")
  const results = await vault.searchNotes("first")
  console.log(`   Found ${results.length} notes`)

  // 10. Get stats
  console.log("\n📊 Vault stats:")
  const stats = await vault.getVaultStats()
  console.log(`   Total notes: ${stats.totalNotes}`)
  console.log(`   Total folders: ${stats.totalFolders}`)
  console.log(`   Storage version: ${stats.storageVersion}`)

  // 11. Delete note (soft delete)
  console.log("\n🗑️  Deleting note (soft delete)...")
  await vault.deleteNote(note.note_id)
  console.log("   Moved to .trash/")

  // 12. Cleanup
  console.log("\n🧹 Cleaning up...")
  await vault.stopWatcher()
  await vault.close()

  console.log("\n✅ Demo complete!")
}

// Run demo
demo().catch(console.error)
