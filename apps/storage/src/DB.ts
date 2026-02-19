import path from "path"
import { Database } from "bun:sqlite"
import { ensureDir } from "./fsutils"
import type { NoteMeta } from "./types"

export default class DB {
  dbPath: string
  db: Database

  constructor(vaultPath: string) {
    const grimoireDir = path.join(vaultPath, ".grimoire")
    this.dbPath = path.join(grimoireDir, "meta.db")

    ensureDir(grimoireDir)

    this.db = new Database(this.dbPath)
    this.initializeSchema()
  }

  initializeSchema() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        note_id TEXT PRIMARY KEY,
        path TEXT UNIQUE,
        display_name TEXT,
        folder_path TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        content_hash TEXT,
        source TEXT
      );
    `)
  }

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
          n.source ?? null
        )
      }
    })

    transaction(notes)
  }

  countNotes(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM notes")
      .get() as any

    return row.count
  }
}