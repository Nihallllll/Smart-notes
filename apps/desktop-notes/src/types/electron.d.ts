export interface Note {
  filename: string;
  path: string;
  created: Date;
  modified: Date;
  size: number;
}

export interface ElectronAPI {
  selectWorkspace: () => Promise<{ success: boolean; path: string | null }>;
  getWorkspace: () => Promise<string | null>;
  listNotes: () => Promise<{ success: boolean; notes: Note[]; error?: string }>;
  readNote: (filename: string) => Promise<{ success: boolean; content: string; error?: string }>;
  saveNote: (filename: string, content: string) => Promise<{ success: boolean; error?: string }>;
  createNote: (filename: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  renameNote: (oldFilename: string, newFilename: string) => Promise<{ success: boolean; filename?: string; error?: string }>;
  deleteNote: (filename: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
