// src/types.ts
// Simple types to keep the code clear.

export type NoteID = string

export interface NoteMeta {
  note_id: NoteID
  path: string        // vault-relative POSIX path, e.g. "notes/todo.md"
  display_name: string
  folder_path: string // vault-relative folder
  created_at: number  // epoch ms
  updated_at: number  // epoch ms
  content_hash?: string
  source?: 'md' | 'pdf' | 'import'
}

export interface VaultStats {
  totalNotes: number
  totalFolders: number
  scanTimeMs: number
}