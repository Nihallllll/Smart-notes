import EventEmitter from "eventemitter3"
import fs from "fs/promises"
import path from "path"
import DB from "./DB"
import { parseFrontmatter } from "./frontmatter"
import { atomicWrite, computeHash, toPosix, ensureDir } from "./fsutils"
import type { NoteMeta } from "./types"
import { EVENTS } from "./events"

export default class VaultManager extends EventEmitter {
  vaultPath: string | null = null
  db: DB | null = null

  constructor() {
    super()
  }

  async initializeVault(vaultPath: string) {
    const start = Date.now()
    this.vaultPath = vaultPath

    const stat = await fs.stat(vaultPath)
    if (!stat.isDirectory()) {
      throw new Error("Vault path must be a directory")
    }

    await ensureDir(path.join(vaultPath, ".grimoire"))

    this.db = new DB(vaultPath)

    const files = await this.walk(vaultPath)

    const notes: NoteMeta[] = []

    for (const file of files) {
      if (!file.endsWith(".md")) continue

      const absPath = file
      const raw = await fs.readFile(absPath, "utf8")

      const parsed = parseFrontmatter(raw)

      if (parsed.injected) {
        await atomicWrite(absPath, parsed.newRaw)
      }

      const stat = await fs.stat(absPath)
      const relative = path.relative(vaultPath, absPath)

      notes.push({
        note_id: parsed.id,
        path: toPosix(relative),
        display_name: path.basename(absPath, ".md"),
        folder_path: toPosix(path.dirname(relative)),
        created_at: parsed.created_at,
        updated_at: stat.mtimeMs,
        content_hash: computeHash(parsed.newRaw),
        source: "md",
      })
    }

    this.db.bulkInsertNotes(notes)

    const end = Date.now()

    this.emit(EVENTS.VAULT_READY, {
      vaultPath,
      totalNotes: notes.length,
      totalFolders: 0,
      scanTimeMs: end - start,
    })
  }

  async walk(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        if (entry.name === ".grimoire") continue
        const sub = await this.walk(fullPath)
        files.push(...sub)
      } else {
        files.push(fullPath)
      }
    }

    return files
  }
}