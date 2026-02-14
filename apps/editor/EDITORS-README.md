# Notion-like Editor Collection

A collection of clean, production-ready text editors inspired by Notion, built with React and TypeScript.

## 🚀 Available Editors

### 1. BlockNote Editor
**The "Gold Standard" for Notion-Clones**

Built on top of Tiptap with a simple "Block" API.

**Features:**
- ✅ / menu for commands
- ✅ Drag-and-drop block handles
- ✅ Side menus
- ✅ Real-time collaboration support with Yjs
- ✅ Dark mode

**License:** MIT  
**Repo:** [GitHub - TypeCell/BlockNote](https://github.com/TypeCell/BlockNote)

### 2. Novel Editor
**The "AI-First" Notion Editor**

Highly polished Tiptap configuration inspired by Steven Tey's Novel.

**Features:**
- ✅ Beautiful Bubble Menu for formatting
- ✅ Slash commands support
- ✅ Rich text formatting (bold, italic, strikethrough, code)
- ✅ Headings, lists, tables
- ✅ Text alignment controls
- ✅ Highlight and color support
- ✅ AI completion interface ready (requires API key)
- ✅ Dark mode

**Repo:** [GitHub - steven-tey/novel](https://github.com/steven-tey/novel)

### 3. Block Editor
**Modern Block-Based Interface**

Tiptap-based editor with floating menu for adding blocks.

**Features:**
- ✅ Floating menu for block insertion
- ✅ Code blocks with syntax highlighting (lowlight)
- ✅ Tables, images, task lists
- ✅ Beautiful gradient background
- ✅ Dark mode

### 4. Minimal Editor
**Clean and Distraction-Free**

Perfect for focused writing with minimal formatting.

**Features:**
- ✅ Ultra-clean interface
- ✅ Essential formatting only
- ✅ Serif typography for better readability
- ✅ Dark mode

### 5. Simple Editor (Tiptap Template)
**Full-Featured Tiptap Editor**

A comprehensive editor with all Tiptap features.

**Features:**
- ✅ Complete toolbar with all formatting options
- ✅ Image upload
- ✅ Mobile-responsive
- ✅ Dark mode

---

## 📦 Installation

These editors are ready to use as React components in your project.

### Install Dependencies

```bash
npm install
# or
bun install
```

### Run Development Server

```bash
npm run dev
# or
bun run dev
```

---

## 🎨 Usage as Components

### Import Individual Editors

```tsx
import { BlockNoteEditor } from './editors/BlockNoteEditor'
import { NovelEditor } from './editors/NovelEditor'
import { BlockEditor } from './editors/BlockEditor'
import { MinimalEditor } from './editors/MinimalEditor'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

function App() {
  return (
    <div>
      {/* Choose one editor */}
      <BlockNoteEditor />
      {/* or */}
      <NovelEditor />
      {/* or */}
      <BlockEditor />
      {/* or */}
      <MinimalEditor />
      {/* or */}
      <SimpleEditor />
    </div>
  )
}
```

### Export for External Use

All editors are exported from `App.tsx`:

```tsx
export { 
  MinimalEditor, 
  NovelEditor, 
  BlockEditor, 
  BlockNoteEditor, 
  SimpleEditor 
}
```

You can import them in your main project:

```tsx
import { BlockNoteEditor, NovelEditor } from '@/apps/editor'
```

---

## 🌙 Dark Mode

All editors support dark mode out of the box. They detect the `dark` class on `document.documentElement` and each editor has a toggle button in the top-right corner.

To enable dark mode programmatically:

```tsx
document.documentElement.classList.add('dark')
```

To disable:

```tsx
document.documentElement.classList.remove('dark')
```

---

## 🛠️ Customization

### Styling

Each editor has its own CSS file in `src/styles/`:
- `blocknote-editor.css`
- `novel-editor.css`
- `block-editor.css`
- `minimal-editor.css`

### Extending Functionality

Each editor is a standalone React component that you can customize:

```tsx
// Example: Add custom content to BlockNoteEditor
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'

const MyCustomEditor = () => {
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: 'paragraph',
        content: 'Your custom content here',
      },
    ],
  })

  return <BlockNoteView editor={editor} />
}
```

---

## 📚 Key Dependencies

- **@blocknote/react**: BlockNote editor framework
- **@tiptap/react**: Tiptap editor framework
- **@tiptap/starter-kit**: Essential Tiptap extensions
- **lucide-react**: Icon library
- **lowlight**: Syntax highlighting for code blocks

---

## 🔥 Features Comparison

| Feature | BlockNote | Novel | Block | Minimal | Simple |
|---------|-----------|-------|-------|---------|--------|
| Drag & Drop | ✅ | ❌ | ❌ | ❌ | ❌ |
| Slash Menu | ✅ | ✅ | ❌ | ❌ | ✅ |
| Bubble Menu | ❌ | ✅ | ❌ | ❌ | ❌ |
| Floating Menu | ❌ | ❌ | ✅ | ❌ | ❌ |
| Dark Mode | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tables | ✅ | ✅ | ✅ | ❌ | ✅ |
| Code Blocks | ✅ | ✅ | ✅ | ❌ | ✅ |
| Task Lists | ✅ | ✅ | ✅ | ❌ | ✅ |
| Images | ✅ | ✅ | ✅ | ❌ | ✅ |
| AI Ready | ❌ | ✅ | ❌ | ❌ | ❌ |
| Yjs Support | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📄 License

MIT - Free for commercial and personal use

---

## 🤝 Contributing

This is a collection of editor implementations. Feel free to:
- Add new editor variants
- Enhance existing editors
- Improve styling and UX
- Add new features

---

## 🙏 Credits

- **BlockNote:** [TypeCell/BlockNote](https://github.com/TypeCell/BlockNote)
- **Novel:** [steven-tey/novel](https://github.com/steven-tey/novel)
- **Tiptap:** [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap)

---

## 📞 Support

For issues and questions, please refer to the respective library documentation:
- [BlockNote Docs](https://www.blocknotejs.org/)
- [Tiptap Docs](https://tiptap.dev/)
- [Novel Repo](https://github.com/steven-tey/novel)
