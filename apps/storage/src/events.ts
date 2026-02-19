// src/events.ts
// Event name constants for VaultManager
export const EVENTS = {
  VAULT_READY: "vaultReady",
  NOTE_CREATED: "noteCreated",
  NOTE_UPDATED: "noteUpdated",
  NOTE_DELETED: "noteDeleted",
  NOTE_RENAMED: "noteRenamed",
  CONFLICT_DETECTED: "conflictDetected",
  FOLDER_MOVED: "folderMoved",
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]