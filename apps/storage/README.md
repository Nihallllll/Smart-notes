# Storage Layer - Smart Notes

**Production-grade local-first storage for markdown notes with conflict detection, file watching, and SQLite metadata indexing.**

## 🎯 Architecture Overview

### DB-First Approach
- **Note IDs**: Stored ONLY in SQLite database (not in files)
- **User Files**: Clean markdown with optional user frontmatter (no system IDs)
- **Source of Truth**: Filesystem for content, Database for metadata
- **Conflict Detection**: Hash-based comparison prevents data loss

### Key Features
✅ Offline-first with SQLite metadata index  
✅ File watcher detects external edits (VS Code, etc.)  
✅ Conflict detection with safe recovery  
✅ Soft deletes (moves to `.trash/`)  
✅ Event-driven architecture for integrations  
✅ Atomic writes (no partial saves)  
✅ Fast queries (indexed by folder, title, date)  

---

## 📦 Installation

```bash
cd apps/storage
bun install
```

### Dependencies
- `gray-matter` - Parse YAML frontmatter
- `chokidar` - File system watcher
- `eventemitter3` - Event emitter
- `uuid` - Generate unique IDs
- `bun:sqlite` - Built-in SQLite (Bun)

---

## 🚀 Quick Start

```typescript
import VaultManager from "storage"

// 1. Create instance
const vault = new VaultManager()

// 2. Initialize vault (scans folder, builds DB)
await vault.initializeVault("/path/to/notes")

// 3. Start watching for external changes
vault.startWatcher()

// 4. Listen to events
vault.on("noteCreated", (payload) => {
  console.log("New note:", payload.display_name)
})

// 5. Create a note
const note = await vault.createNote("projects", "My Idea", "Content here")

// 6. Read note
const { content, meta } = await vault.readNote(note.note_id)

// 7. Update note (with conflict detection)
await vault.updateNote(note.note_id, "Updated content")

// 8. Delete note (soft delete to .trash/)
await vault.deleteNote(note.note_id)
```

---

## 📖 API Reference

### Initialization

#### `initializeVault(vaultPath: string): Promise<void>`
Scans folder, creates `.grimoire/` DB, indexes all `.md` files.

**What it does:**
1. Validates path is a directory
2. Creates system folders (`.grimoire`, `.conflicts`, `.trash`)
3. Opens SQLite database
4. Walks directory tree
5. Parses frontmatter from each `.md` file
6. Generates UUIDs in database (does NOT modify files)
7. Emits `vaultReady` event

**Example:**
```typescript
try {
  await vault.initializeVault("D:/MyNotes")
  console.log("Vault ready!")
} catch (err) {
  console.error("Init failed:", err)
}
```

---

### Watcher Control

#### `startWatcher(): void`
Starts file watcher (detects external edits in VS Code, etc.).

**Features:**
- Debounces rapid changes (300ms)
- Suppresses internal write echoes (500ms window)
- Ignores system folders (`.grimoire`, `.git`, etc.)
- Emits events: `noteCreated`, `noteUpdated`, `noteDeleted`

#### `stopWatcher(): Promise<void>`
Stops file watcher.

---

### CRUD Operations

#### `createNote(folderPath: string, title: string, content?: string): Promise<NoteMeta>`
Creates a new note.

**Parameters:**
- `folderPath` - Relative to vault root (e.g., `"projects/ideas"`)
- `title` - Human-readable title (becomes filename)
- `content` - Markdown content (optional)

**Returns:** `NoteMeta` with generated `note_id`

**File created:**
```markdown
---
title: My Idea
created_at: 1708387200000
---

Content here...
```

**Example:**
```typescript
const note = await vault.createNote("work", "Meeting Notes", "# Agenda")
console.log(note.note_id) // UUID in DB only
```

---

#### `readNote(noteId: string): Promise<NoteWithContent>`
Reads note content + metadata.

**Returns:**
```typescript
{
  meta: NoteMeta,           // DB metadata
  content: string,          // Markdown body
  userFrontmatter: object   // User's YAML frontmatter
}
```

**Example:**
```typescript
const { content, meta, userFrontmatter } = await vault.readNote(noteId)
console.log(content)      // "# Agenda..."
console.log(meta.path)    // "work/meeting-notes.md"
```

---

#### `updateNote(noteId: string, newContent: string): Promise<void>`
Updates note content with conflict detection.

**Conflict Detection:**
1. Reads current file hash from disk
2. Compares with DB hash
3. If different → **CONFLICT** (file changed externally)
4. Saves your version to `.conflicts/` folder
5. Does NOT overwrite

**Example:**
```typescript
try {
  await vault.updateNote(noteId, "Updated content")
} catch (err) {
  console.error(err.message) 
  // "Conflict detected: file changed externally. Check .conflicts/..."
}
```

---

#### `deleteNote(noteId: string, permanent?: boolean): Promise<void>`
Deletes note (soft delete by default).

**Parameters:**
- `permanent` - `false` (default) = move to `.trash/`, `true` = delete forever

**Example:**
```typescript
// Soft delete (recoverable)
await vault.deleteNote(noteId)

// Hard delete (permanent)
await vault.deleteNote(noteId, true)
```

---

### Query Operations

#### `listNotes(folderPath?: string): Promise<NoteMeta[]>`
Lists all notes (optionally filtered by folder).

**Example:**
```typescript
// All notes
const allNotes = await vault.listNotes()

// Notes in folder
const workNotes = await vault.listNotes("work")
```

---

#### `searchNotes(query: string): Promise<NoteMeta[]>`
Searches notes by title (SQL `LIKE` query).

**Example:**
```typescript
const results = await vault.searchNotes("meeting")
// Returns notes with "meeting" in display_name
```

---

#### `getVaultStats(): Promise<VaultStats>`
Get vault statistics.

**Returns:**
```typescript
{
  totalNotes: number,
  totalFolders: number,
  vaultPath: string,
  lastScan: number,
  storageVersion: string
}
```

---

## 🔔 Events

VaultManager extends `EventEmitter3`. Subscribe to events:

### `vaultReady`
Emitted after `initializeVault()` completes.

**Payload:**
```typescript
{
  vaultPath: string,
  totalNotes: number,
  totalFolders: number,
  scanTimeMs: number
}
```

---

### `noteCreated`
Emitted when a note is created (internal or external).

**Payload:**
```typescript
{
  note_id: string,
  path: string,
  folder_path: string,
  display_name: string,
  created_at: number,
  source: "internal" | "external"
}
```

**Example:**
```typescript
vault.on("noteCreated", (payload) => {
  if (payload.source === "external") {
    console.log(`New note added in VS Code: ${payload.display_name}`)
  }
})
```

---

### `noteUpdated`
Emitted when a note is updated.

**Payload:**
```typescript
{
  note_id: string,
  path: string,
  updated_at: number,
  content_hash: string,
  source: "internal" | "external"
}
```

---

### `noteDeleted`
Emitted when a note is deleted.

**Payload:**
```typescript
{
  note_id: string,
  path: string,
  trashed: boolean,  // true if soft delete
  source: "internal" | "external"
}
```

---

### `conflictDetected`
Emitted when a save conflict is detected.

**Payload:**
```typescript
{
  note_id: string,
  path: string,
  dbHash: string,
  diskHash: string,
  conflictPath: string,  // Where your version was saved
  timestamp: number
}
```

**Example:**
```typescript
vault.on("conflictDetected", (payload) => {
  // Show UI notification
  alert(`Conflict! Check ${payload.conflictPath}`)
})
```

---

## 🗂️ Folder Structure

```
my-vault/
├── projects/
│   ├── idea1.md
│   └── idea2.md
├── work/
│   └── meeting.md
├── .grimoire/
│   ├── meta.db          ← SQLite database (note IDs, metadata)
│   ├── conflicts.json   ← Conflict audit log
│   └── logs/
│       └── storage.log
├── .conflicts/
│   └── idea1_abc123_1708387200000.md  ← Conflict backups
└── .trash/
    └── deleted-note_1708387200000.md  ← Soft deletes
```

---

## 🛡️ Conflict Resolution

### What's a Conflict?
You're editing a note in Smart Notes, but someone (or you in VS Code) saves it externally.

### How Storage Handles It:
1. **Detect**: Compare DB hash vs disk hash
2. **Protect**: Don't overwrite (prevents data loss)
3. **Save**: Your version goes to `.conflicts/`
4. **Notify**: Emits `conflictDetected` event
5. **Manual**: User merges changes

### Conflict File Format:
```markdown
<!--
CONFLICT DETECTED
Original file: work/meeting.md
Note ID: abc-123-uuid
Timestamp: 2026-02-19T10:30:00Z
DB Hash: sha256...
Disk Hash: sha256...

Your attempted changes are below.
Merge them with the original file manually.
-->

Your content here...
```

---

## 🧪 Testing

### Manual Test
```typescript
// test.ts
import VaultManager from "./src/index"

const vault = new VaultManager()

// Test init
await vault.initializeVault("./test-vault")

// Test create
const note = await vault.createNote("", "Test Note", "Hello world")
console.log("Created:", note.note_id)

// Test read
const { content } = await vault.readNote(note.note_id)
console.log("Content:", content)

// Test update
await vault.updateNote(note.note_id, "Updated!")

// Test list
const notes = await vault.listNotes()
console.log("Total notes:", notes.length)

// Cleanup
await vault.close()
```

Run: `bun test.ts`

---

## ⚠️ Important Notes

### ID Storage (DB-First)
- ✅ **System IDs**: Stored ONLY in `.grimoire/meta.db`
- ✅ **User Files**: Clean markdown (no system pollution)
- ✅ **Portability**: User can copy `.md` files anywhere
- ⚠️ **DB Required**: If DB corrupts, re-initialize vault (IDs regenerate)

### File Modifications
- ✅ **Never injects system IDs** into frontmatter
- ✅ **Preserves user frontmatter** (tags, title, etc.)
- ✅ **Atomic writes** (temp file → rename)

### Performance
- 📊 **Fast init**: ~500 notes in <2 seconds
- 📊 **Queries**: Indexed (O(log n))
- 📊 **Watcher**: Debounced (300ms)

---

## 🔄 Integration with Other Layers

### Indexer/RAG Integration
```typescript
// In your indexer service
vault.on("noteCreated", async (payload) => {
  const { content } = await vault.readNote(payload.note_id)
  
  // Chunk content
  const chunks = chunker.chunk(content)
  
  // Embed chunks
  const embeddings = await embedder.embed(chunks)
  
  // Store in vector DB
  await vectorDB.insert(payload.note_id, embeddings)
})

vault.on("noteUpdated", async (payload) => {
  // Re-index updated note
  await reindexNote(payload.note_id)
})

vault.on("noteDeleted", async (payload) => {
  // Remove from vector DB
  await vectorDB.delete(payload.note_id)
})
```

---

## 📝 License

Part of Smart Notes project (see root LICENSE).

---

## 🤝 Contributing

See main project README for contribution guidelines.
