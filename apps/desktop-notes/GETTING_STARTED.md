# Smart Notes Desktop - Getting Started

## What Was Built

A fully functional Electron desktop application with:

### ✅ Foundation (Phase 1) Complete

**Electron Infrastructure:**
- Main process with secure IPC handlers
- Preload script with context isolation
- File system operations (CRUD for markdown files)
- Native file dialogs for workspace selection

**Rich Text Editor:**
- TipTap-powered markdown editor
- Full formatting toolbar (bold, italic, headings, lists, etc.)
- Auto-save every 2 seconds
- Keyboard shortcuts (Ctrl+S, Ctrl+B, etc.)
- Task lists, code blocks, blockquotes

**File Storage:**
- All notes saved as `.md` files locally
- User selects workspace folder
- Direct file system integration
- No database, no cloud sync - privacy first

**UI Components:**
- Sidebar with note list and workspace info
- Top bar with save/rename/delete actions
- Modern, clean interface
- Responsive design

## How to Run

### 1. Install Dependencies

```bash
cd apps/desktop-notes
npm install --legacy-peer-deps
```

Or from the root:
```bash
npm run desktop:install
```

### 2. Start Development Mode

```bash
cd apps/desktop-notes
npm run electron:dev
```

This will:
1. Start Vite dev server
2. Launch Electron app automatically
3. Enable hot reload for changes

### 3. First Use

When the app launches:
1. Click "Select Workspace Folder"
2. Choose any folder on your computer (e.g., `D:\MyNotes`)
3. Click "+" to create your first note
4. Start typing!

### 4. Test File System Integration

**Verify 
 storage works:**
1. Create a note in the app
2. Open your workspace folder in File Explorer
3. You'll see a `.md` file created
4. Open it in VS Code or Notepad
5. Edit and save
6. (Future: app will auto-detect changes)

## What Mentors Will See

### Demo Flow (2 minutes)

1. **Launch** → Clean welcome screen
2. **Select Workspace** → Native folder dialog
3. **Create Note** → Instant file creation
4. **Rich Editing** → Full formatting toolbar working
5. **Auto-Save** → Status shows "Saved just now"
6. **File Explorer** → Show actual `.md` files on disk
7. **Rename/Delete** → Full CRUD operations

### Key Features to Highlight

✅ **Foundation First** - No AI/RAG complexity, solid base  
✅ **Real File System** - Not IndexedDB, actual `.md` files  
✅ **Production Editor** - TipTap with markdown support  
✅ **Clean Architecture** - Proper IPC boundaries, type-safe  
✅ **Privacy-Focused** - Everything local, no cloud calls  
✅ **Extensible** - Clear extension points for Phase 2  

## File Structure Created

```
apps/desktop-notes/
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # Secure IPC bridge
├── src/
│   ├── components/
│   │   ├── Editor.tsx       # TipTap editor (auto-save, keyboard shortcuts)
│   │   ├── Sidebar.tsx      # Note list, workspace selector
│   │   └── TopBar.tsx       # Actions bar (save/rename/delete)
│   ├── types/
│   │   └── electron.d.ts    # TypeScript definitions
│   ├── App.tsx              # Main app logic
│   ├── App.css              # Main styles
│   ├── main.tsx             # React entry
│   └── index.css            # Global styles
├── package.json             # Dependencies & scripts
├── vite.config.ts           # Vite build config
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind setup
└── README.md                # Full documentation
```

## Storage Architecture

### How It Works

```
User Action               →  IPC Call           →  File System
-----------------------------------------------------------------
Click "New Note"         →  createNote()       →  note-1234.md created
Type in editor           →  (debounced)        →  
Wait 2 seconds           →  saveNote()         →  File written to disk
Click "Rename"           →  renameNote()       →  File renamed
Click "Delete"           →  deleteNote()       →  File deleted
Open workspace           →  listNotes()        →  Scan .md files
```

### File Format

Notes are plain markdown:

```markdown
# Meeting Notes

## Action Items
- [ ] Review PR
- [ ] Update docs

**Important**: Deploy by Friday
```

### Why This Design

1. **Human-readable** - Open in any text editor
2. **Version control ready** - Git-friendly format
3. **Backup-friendly** - Just copy the folder
4. **Portable** - Move to any machine
5. **No lock-in** - Standard markdown

## Next Steps (Phase 2 Ready)

The foundation is complete. Ready to add:

### File Watcher Integration
```javascript
// In electron/main.js - add chokidar
const watcher = chokidar.watch(workspacePath);
watcher.on('change', (path) => {
  mainWindow.webContents.send('file-changed', path);
});
```

### Metadata Registry
```javascript
// Add SQLite for fast indexing
{
  filename: 'note-123.md',
  hash: 'abc123',
  lastIndexed: Date,
  embedding: [0.1, 0.2, ...]
}
```

### Indexing Service
```javascript
// Background worker for embeddings
class IndexingService {
  subscribe(fileWatcher);
  async processFile(path);
  async embedChunks(content);
  persistToVectorStore();
}
```

## Troubleshooting

### If npm install fails:
```bash
npm install --legacy-peer-deps
```

### If Electron doesn't launch:
```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

### If hot reload doesn't work:
- Close Electron app
- Run `npm run electron:dev` again
- Check http://localhost:5173 is accessible

## Building for Production

```bash
npm run electron:build
```

Creates distributable in `dist-electron/`:
- Windows: `.exe` installer
- macOS: `.dmg` image
- Linux: `.AppImage` binary

## Architecture Decisions

### Why Electron over Tauri?
- Mature ecosystem
- Better TipTap compatibility
- Larger community support

### Why TipTap over Draft.js?
- Modern, React-first
- Excellent markdown support
- Active development
- Extensible plugin system

### Why No Database?
- Phase 1 focuses on foundation
- File system is source of truth
- Simplifies architecture
- Metadata registry comes in Phase 2

### Why No File Watcher Yet?
- Foundation first approach
- Chokidar integration is Phase 2
- Keeps initial demo simple
- Easy to add later

## Contributing to GSoC

This prototype demonstrates:

1. **Systems Thinking** - Clean architecture, not flashy features
2. **Foundation First** - Aligns with mentor guidance
3. **Production Quality** - Type-safe, secure, well-documented
4. **Extensible Design** - Clear paths for Phase 2/3 features
5. **Privacy Focus** - Local-first, offline-only

Use this as a portfolio piece showing you understand:
- Desktop app development
- Electron security (context isolation, sandboxing)
- React best practices
- File system operations
- Clean code architecture

## Questions?

Check the main README.md for:
- Full feature list
- API documentation
- Future roadmap
- Development notes
