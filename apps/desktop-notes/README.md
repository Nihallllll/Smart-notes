# Smart Notes Desktop

A privacy-first, offline desktop note-taking application with local markdown storage and a powerful editor built with Electron, React, and TipTap.

## Features

- **Local-First Storage**: All notes saved as `.md` files on your local filesystem
- **Rich Text Editor**: Powered by TipTap with full markdown support
- **File System Integration**: Direct integration with your file system - edit notes in any markdown editor
- **Auto-Save**: Automatic saving every 2 seconds while typing
- **Privacy-Focused**: No cloud sync, no telemetry, everything stays on your machine
- **Clean UI**: Modern, distraction-free interface
- **Keyboard Shortcuts**: Full keyboard support for productivity

## Technology Stack

- **Electron**: Desktop application framework
- **React 18**: Modern UI framework
- **TipTap**: Extensible rich text editor
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **Tailwind CSS**: Utility-first styling

## Project Structure

```
desktop-notes/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # IPC bridge (secure)
├── src/
│   ├── components/
│   │   ├── Editor.tsx   # TipTap editor component
│   │   ├── Sidebar.tsx  # Note list sidebar
│   │   └── TopBar.tsx   # Top action bar
│   ├── types/
│   │   └── electron.d.ts # TypeScript definitions
│   ├── App.tsx          # Main application
│   └── main.tsx         # React entry point
└── package.json
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or bun

### Installation

```bash
cd apps/desktop-notes
npm install
```

### Development

Run the development server with hot reload:

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron with the application

### Building

Build the application for production:

```bash
npm run electron:build
```

This creates distributable packages in the `dist-electron` directory.

## Usage

### First Launch

1. The app will prompt you to select a workspace folder
2. Choose any folder on your computer where you want to store notes
3. All notes will be saved as `.md` files in this folder

### Creating Notes

- Click the **+** button in the sidebar
- A new note with a timestamp name will be created
- Start typing in the editor

### Editing Notes

- Click any note in the sidebar to open it
- Use the rich text toolbar for formatting
- Changes auto-save every 2 seconds
- Or press `Ctrl+S` / `Cmd+S` to save manually

### Editor Features

**Formatting:**
- **Bold** (Ctrl+B)
- *Italic* (Ctrl+I)
- ~~Strikethrough~~
- <u>Underline</u> (Ctrl+U)
- `Code`
- Highlight

**Structure:**
- Headings (H1-H3)
- Bullet lists
- Numbered lists
- Task lists with checkboxes
- Blockquotes
- Code blocks
- Horizontal rules

**Actions:**
- Undo/Redo
- Text alignment
- Auto-save

### Managing Notes

- **Rename**: Click "Rename" button in top bar
- **Delete**: Click "Delete" button (with confirmation)
- **Save**: Click "Save" or use Ctrl+S

### Workspace Management

- Click "Change" next to workspace path to select a different folder
- All notes are instantly accessible in the new workspace

## File Format

Notes are stored as standard markdown files with the `.md` extension:

```markdown
# My Note Title

This is the content of my note.

- Bullet point
- Another point

**Bold text** and *italic text*.
```

## Architecture Highlights

### Electron IPC

Secure communication between renderer and main process:
- Context isolation enabled
- Sandboxed renderer process
- Preload script with `contextBridge`

### File Operations

All file operations happen in the main process:
- `selectWorkspace()` - Choose workspace folder
- `listNotes()` - Get all .md files
- `readNote()` - Load note content
- `saveNote()` - Write note to disk
- `createNote()` - Create new note file
- `renameNote()` - Rename note file
- `deleteNote()` - Delete note file

### Storage Strategy

- **Source of truth**: File system
- **Format**: Plain markdown (.md)
- **Metadata**: Embedded in frontmatter (future)
- **No database**: Direct file operations

## Roadmap (Future Enhancements)

### Phase 2: Advanced Features
- [ ] File watcher (chokidar) for external changes
- [ ] Metadata registry (SQLite) for fast search
- [ ] Full-text search across all notes
- [ ] Folder hierarchies and organization
- [ ] Tags and categories

### Phase 3: AI Integration
- [ ] Background indexing service
- [ ] Local embeddings (Ollama)
- [ ] Semantic search
- [ ] RAG pipeline for Q&A
- [ ] Auto-linking related notes

## Development Notes

### Testing File System Integration

1. Create notes in the app
2. Open workspace folder in file explorer
3. Edit `.md` files in VS Code or any text editor
4. Changes persist across both applications

### Debugging

- Dev tools automatically open in development mode
- Main process logs appear in terminal
- Renderer logs in DevTools console

## License

This is a prototype project for demonstration purposes.

## Contributing

This project demonstrates the foundation (Phase 1) for Smart Notes:
- ✅ Electron app setup
- ✅ Local markdown storage
- ✅ TipTap editor integration
- ✅ File system operations
- ✅ Clean modular architecture
- ✅ Privacy-first, offline-only

Ready for Phase 2 enhancements (file watching, indexing, search) and Phase 3 AI features.
