# Desktop Notes App - Implementation Notes

## Overview
This is a complete Electron-based desktop note-taking application built with React, TipTap editor, and local file system storage. The app provides a privacy-focused, offline-first experience with rich text editing capabilities.

## Architecture

### Technology Stack
- **Electron 33.3.0** - Desktop application framework
- **React 18.3.1** - UI framework
- **TypeScript 5.7.2** - Type safety
- **TipTap 3.19.0** - Rich text editor (built on ProseMirror)
- **Vite 6.0.7** - Build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS (with PostCSS)
- **Node.js fs.promises** - File system operations

### Application Structure

```
apps/desktop-notes/
├── electron/              # Electron main process files
│   ├── main.js           # Main process (Node.js environment)
│   └── preload.js        # Secure IPC bridge
├── src/                  # React application (renderer process)
│   ├── components/       # React components
│   │   ├── Editor.tsx    # TipTap rich text editor
│   │   ├── Sidebar.tsx   # Note list and workspace selector
│   │   ├── TopBar.tsx    # Action buttons and status
│   │   └── RenameModal.tsx # Modal for renaming notes
│   ├── App.tsx          # Main application logic
│   ├── main.tsx         # React entry point
│   └── types/
│       └── electron.d.ts # TypeScript definitions for IPC
└── package.json         # Dependencies and scripts
```

## Key Features

### 1. File System Storage
- **No Database**: Notes are stored directly as `.md` (Markdown) files on disk
- **Workspace-Based**: Users select a folder as their workspace
- **File Naming**: Auto-generated filenames like `note-{timestamp}.md`
- **Direct Access**: Users can access their notes with any text editor

### 2. Rich Text Editor (TipTap)
**Extensions Used:**
- `StarterKit` - Core functionality (bold, italic, paragraph, headings, lists, etc.)
  - Includes: Bold, Italic, Strike, Link, Underline, Code, CodeBlock, Paragraph, Heading, BulletList, OrderedList, Blockquote, HorizontalRule
- `Highlight` - Text highlighting/marking
- `TaskList` & `TaskItem` - Checkbox todo lists
- `Image` - Image embedding
- `TextAlign` - Left/center/right alignment
- `Typography` - Smart quotes, ellipsis, em dash

**Important Note**: StarterKit already includes Link and Underline extensions, so they should NOT be imported separately to avoid duplicate extension errors.

### 3. Auto-Save System
- **Debounced Saving**: 2-second delay after typing stops
- **Visual Feedback**: Shows "Saving..." and "Saved at {time}" in TopBar
- **Efficient**: Only saves when content changes

### 4. Dark Mode
- **Toggle Button**: Sun/moon emoji in TopBar
- **Persistent**: Saved to localStorage
- **Complete**: All components styled for both light and dark themes
- **CSS Classes**: Uses `.dark` class on `<html>` element

### 5. PDF Export
- **Browser Print API**: Opens print dialog with formatted content
- **Styled Output**: Professional formatting with proper typography
- **Full Content**: Exports current note with all formatting preserved

### 6. Rename Functionality
- **Custom Modal**: Replaced `prompt()` (not supported in Electron) with React modal
- **File Renaming**: Updates filename on disk and refreshes note list
- **Validation**: Ensures names are not empty

## IPC (Inter-Process Communication)

### Security Architecture
- **Context Isolation**: Enabled for security
- **No Node.js in Renderer**: Renderer process doesn't have direct Node.js access
- **Preload Script**: Acts as secure bridge between main and renderer

### IPC Methods

```typescript
interface ElectronAPI {
  selectWorkspace: () => Promise<string | null>
  getWorkspace: () => Promise<string | null>
  listNotes: () => Promise<Note[]>
  readNote: (filename: string) => Promise<string>
  saveNote: (filename: string, content: string) => Promise<boolean>
  createNote: () => Promise<string>
  renameNote: (oldFilename: string, newFilename: string) => Promise<{ success: boolean; filename?: string }>
  deleteNote: (filename: string) => Promise<boolean>
}
```

### How IPC Works
1. **Renderer** → Calls `window.electronAPI.methodName()`
2. **Preload** → Invokes `ipcRenderer.invoke('channel-name', args)`
3. **Main** → Handles via `ipcMain.handle('channel-name', async (event, args) => { ... })`
4. **File System** → Main process performs fs operations
5. **Return** → Result flows back through preload to renderer

## Implementation Details

### Main Process (electron/main.js)

**Responsibilities:**
- Create and manage browser window
- Handle file system operations (read, write, rename, delete)
- Provide native dialogs (workspace selection)
- Serve as security boundary

**Key Code Patterns:**

```javascript
// Window creation with security
const mainWindow = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false
  }
});

// IPC handler example
ipcMain.handle('read-note', async (event, filename) => {
  const workspacePath = store.get('workspacePath');
  const filePath = path.join(workspacePath, filename);
  return await fs.readFile(filePath, 'utf-8');
});
```

### Preload Script (electron/preload.js)

**Purpose:** Expose limited, secure API to renderer process

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  readNote: (filename) => ipcRenderer.invoke('read-note', filename),
  saveNote: (filename, content) => ipcRenderer.invoke('save-note', filename, content)
  // ... other methods
});
```

### React Application

**State Management:**
- `workspacePath`: Currently selected workspace folder
- `notes`: Array of notes in workspace
- `activeNote`: Currently opened note filename
- `content`: Current note HTML content
- `isDarkMode`: Theme preference
- `showRenameModal`: Modal visibility

**Component Hierarchy:**
```
App
├── Sidebar (note list, workspace selector)
├── TopBar (actions, status, theme toggle)
└── Editor (TipTap rich text)
└── RenameModal (conditional render)
```

**Data Flow:**
1. User action (e.g., click note)
2. React event handler (e.g., `handleNoteClick`)
3. IPC call to main process
4. File system operation
5. Update React state
6. Re-render affected components

### TipTap Editor Configuration

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] }
    }),
    Highlight,
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Typography
  ],
  content: content,
  onUpdate: ({ editor }) => {
    onContentChange(editor.getHTML());
  }
});
```

**Toolbar Implementation:**
- Icon buttons for each format command
- Active state styling when format is applied
- Disabled state for unavailable commands (e.g., undo/redo)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)

## Development Workflow

### Running the App

```bash
# Development mode (hot reload)
cd apps/desktop-notes
npm install
npm run electron:dev
```

This command:
1. Starts Vite dev server on port 5173
2. Launches Electron with window pointing to dev server
3. Enables hot module replacement (HMR)

### Building for Production

```bash
npm run electron:build
```

This will:
1. Build React app with Vite
2. Package Electron app with electron-builder
3. Create distributable for your platform (exe on Windows)

## Configuration Files

### package.json
- **Scripts**: `electron:dev` (development), `electron:build` (production build)
- **Main Dependencies**: React, TipTap extensions, Electron
- **Build Config**: Electron-builder settings (output folder, app ID, etc.)

### vite.config.ts
- **Base URL**: Set to `'./'` for Electron file:// protocol
- **Optimize Deps**: Excludes TipTap packages to avoid Vite optimization errors
- **Build**: Configured for Electron renderer process

### tsconfig.json
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: React JSX
- **Paths**: `@/*` alias for `./src/*`

## Common Pitfalls & Solutions

### 1. Duplicate TipTap Extensions
**Problem:** "Duplicate extension names found: ['link', 'underline']"

**Cause:** StarterKit already includes these extensions

**Solution:** Don't import Link/Underline separately, only configure via StarterKit

### 2. prompt() Not Working
**Problem:** `prompt()` is not supported in Electron renderer

**Solution:** Use custom React modal component (RenameModal.tsx)

### 3. Vite Optimization Errors
**Problem:** "The following dependencies are chunked more than 1x" for TipTap

**Solution:** Add to `optimizeDeps.exclude` in vite.config.ts

### 4. Context Isolation Issues
**Problem:** Can't access Node.js APIs in renderer

**Solution:** This is intentional for security. Use IPC via preload script.

### 5. ES Module vs CommonJS
**Problem:** "require() is not defined"

**Solution:** Don't set `"type": "module"` in package.json for Electron main process

## File System Operations

### Reading Notes
```javascript
async function readNote(filename) {
  const filePath = path.join(workspacePath, filename);
  return await fs.readFile(filePath, 'utf-8');
}
```

### Saving Notes
```javascript
async function saveNote(filename, content) {
  const filePath = path.join(workspacePath, filename);
  await fs.writeFile(filePath, content, 'utf-8');
  return true;
}
```

### Listing Notes
```javascript
async function listNotes() {
  const files = await fs.readdir(workspacePath);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  return await Promise.all(
    mdFiles.map(async (filename) => {
      const filePath = path.join(workspacePath, filename);
      const stats = await fs.stat(filePath);
      return {
        filename,
        modified: stats.mtime.toISOString()
      };
    })
  );
}
```

### Creating Notes
```javascript
async function createNote() {
  const filename = `note-${Date.now()}.md`;
  const filePath = path.join(workspacePath, filename);
  await fs.writeFile(filePath, '', 'utf-8');
  return filename;
}
```

## Styling Approach

### Light/Dark Mode Toggle
- Uses `document.documentElement.classList` to add/remove `.dark` class
- All CSS files include `.dark` variants
- localStorage persists preference across sessions

### CSS Structure
- **Component-scoped CSS**: Each component has its own .css file
- **Consistent Variables**: Colors, spacing follow design system
- **Responsive**: Works on different screen sizes
- **Accessible**: Proper contrast ratios, focus states

### Dark Mode Color Palette
- Background: `#1a1a1a` (darkest), `#111827` (dark), `#1f2937` (slightly lighter)
- Text: `#f9fafb` (white), `#d1d5db` (gray), `#9ca3af` (muted)
- Borders: `#374151`, `#4b5563`
- Accents: `#3b82f6` (blue), `#2563eb` (darker blue)

## Security Considerations

### Context Isolation
- Renderer process runs in isolated context
- No direct access to Node.js or Electron APIs
- Only controlled access via `contextBridge`

### Input Validation
- File paths are validated in main process
- Workspace paths must be directories
- Filenames sanitized to prevent path traversal

### Content Security
- Notes stored as plain text (Markdown)
- No eval() or dangerous HTML execution
- User content properly escaped

## Future Improvements

### Potential Features
1. **Search**: Full-text search across all notes
2. **Tags/Categories**: Organization system
3. **Encryption**: Optional note encryption
4. **Sync**: Cloud backup/sync (optional)
5. **Themes**: More color schemes
6. **Custom Fonts**: User-selectable editor fonts
7. **Markdown Preview**: Side-by-side Markdown view
8. **Version History**: Track note changes
9. **Attachments**: File attachments to notes
10. **Keyboard Shortcuts**: More editor shortcuts

### Performance Optimizations
- Virtual scrolling for large note lists
- Lazy loading of note content
- Debounced file system operations
- Indexed search with Fuse.js or similar

### Code Quality
- Unit tests (Jest, React Testing Library)
- E2E tests (Playwright)
- Linting with ESLint
- Code formatting with Prettier

## Troubleshooting

### App Won't Start
- Check if port 5173 is available
- Verify all dependencies are installed (`npm install`)
- Clear Vite cache (`rm -rf node_modules/.vite`)

### Notes Not Saving
- Check workspace permissions (write access)
- Verify workspace path is valid directory
- Check console for error messages

### Editor Not Loading
- Check browser console for errors
- Verify TipTap extensions are installed
- Clear browser cache

### Dark Mode Not Working
- Check if `.dark` class is on `<html>` element
- Verify CSS is properly loaded
- Check localStorage for `darkMode` key

## Contributing Guidelines

If adding new features:
1. Follow existing code patterns
2. Maintain TypeScript type safety
3. Add dark mode styles for new components
4. Test IPC communication thoroughly
5. Document new IPC methods
6. Update this IMPLEMENTATION_NOTES.md

## Lessons Learned

1. **Foundation First**: Building the core (editor, storage, UI) before AI/RAG features aligns with mentor's guidance
2. **Electron Security**: Context isolation is crucial - never disable it
3. **TipTap Extensions**: Read documentation carefully to avoid duplicate extensions
4. **File System**: Local file storage is simple, reliable, and privacy-friendly
5. **IPC Pattern**: Clear separation between main and renderer is key to maintainability
6. **Dark Mode**: Planning for dark mode from the start makes styling easier
7. **Auto-Save**: Debouncing is essential to avoid excessive file writes

## Related GSoC Project Context

This desktop app was built as part of the Smart Notes GSoC project contribution strategy:

**Mentor's Guidance** (Garv):
> "Foundation first approach - Start with Electron + local storage + editor. Get that working perfectly before adding AI/RAG features. The AI part is the easy part, but having a solid base is crucial."

**Alignment with Project Goals:**
- ✅ Desktop application (Electron)
- ✅ Local storage (file system)
- ✅ Rich text editor (TipTap)
- ✅ Privacy-focused (no external services)
- ✅ Offline-first (no network dependencies)
- 🔜 AI/RAG integration (future phase)

This implementation demonstrates understanding of:
- Desktop application architecture
- Secure IPC patterns
- File system operations
- React component design
- TypeScript type safety
- User experience fundamentals

---

**Created**: January 2024  
**Author**: Built for Smart Notes GSoC Project  
**Version**: 1.0.0
