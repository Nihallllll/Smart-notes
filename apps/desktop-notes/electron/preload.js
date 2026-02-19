const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getWorkspace: () => ipcRenderer.invoke('get-workspace'),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  readNote: (filename) => ipcRenderer.invoke('read-note', filename),
  saveNote: (filename, content) => ipcRenderer.invoke('save-note', filename, content),
  createNote: (filename) => ipcRenderer.invoke('create-note', filename),
  renameNote: (oldFilename, newFilename) => ipcRenderer.invoke('rename-note', oldFilename, newFilename),
  deleteNote: (filename) => ipcRenderer.invoke('delete-note', filename)
});
