const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let workspacePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.ELECTRON_DEV === 'true';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Workspace Folder',
    buttonLabel: 'Select Workspace'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    workspacePath = result.filePaths[0];
    return { success: true, path: workspacePath };
  }
  
  return { success: false, path: null };
});

ipcMain.handle('get-workspace', async () => {
  return workspacePath;
});

ipcMain.handle('list-notes', async () => {
  if (!workspacePath) {
    return { success: false, notes: [], error: 'No workspace selected' };
  }

  try {
    const files = await fs.readdir(workspacePath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const notes = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(workspacePath, filename);
        const stats = await fs.stat(filePath);
        return {
          filename,
          path: filePath,
          created: stats.birthtime,
          modified: stats.mtime,
          size: stats.size
        };
      })
    );

    notes.sort((a, b) => b.modified - a.modified);
    
    return { success: true, notes };
  } catch (error) {
    return { success: false, notes: [], error: error.message };
  }
});

ipcMain.handle('read-note', async (event, filename) => {
  if (!workspacePath) {
    return { success: false, content: '', error: 'No workspace selected' };
  }

  try {
    const filePath = path.join(workspacePath, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, content: '', error: error.message };
  }
});

ipcMain.handle('save-note', async (event, filename, content) => {
  if (!workspacePath) {
    return { success: false, error: 'No workspace selected' };
  }

  try {
    const filePath = path.join(workspacePath, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-note', async (event, filename) => {
  if (!workspacePath) {
    return { success: false, error: 'No workspace selected' };
  }

  try {
    const filePath = path.join(workspacePath, filename);
    const initialContent = `# ${filename.replace('.md', '')}\n\n`;
    await fs.writeFile(filePath, initialContent, 'utf-8');
    return { success: true, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-note', async (event, oldFilename, newFilename) => {
  if (!workspacePath) {
    return { success: false, error: 'No workspace selected' };
  }

  try {
    const oldPath = path.join(workspacePath, oldFilename);
    const newPath = path.join(workspacePath, newFilename);
    await fs.rename(oldPath, newPath);
    return { success: true, filename: newFilename };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-note', async (event, filename) => {
  if (!workspacePath) {
    return { success: false, error: 'No workspace selected' };
  }

  try {
    const filePath = path.join(workspacePath, filename);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
