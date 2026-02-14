# Notion-like Editor Collection 📝

A collection of clean, production-ready text editors built with React, TypeScript, and Tiptap/BlockNote. Perfect for integrating into your projects as reusable components.

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🚀 Available Editors

This project includes **5 different editor implementations**, each with unique features:

1. **BlockNoteEditor** - The gold standard for Notion clones with drag & drop
2. **NovelEditor** - AI-first editor with bubble menu
3. **BlockEditor** - Modern block-based interface with floating menu
4. **MinimalEditor** - Clean, distraction-free writing
5. **SimpleEditor** - Full-featured Tiptap editor

👉 **See [EDITORS-README.md](./EDITORS-README.md) for detailed documentation**

## 📦 Usage as Components

All editors are exported and ready to use:

```tsx
import { 
  BlockNoteEditor, 
  NovelEditor, 
  BlockEditor, 
  MinimalEditor, 
  SimpleEditor 
} from '@/apps/editor'

function MyApp() {
  return <BlockNoteEditor />
}
```

### Switch Editors in App.tsx

Open `src/App.tsx` and uncomment the editor you want to use:

```tsx
function App() {
  return (
    <div className="app-container">
      <BlockNoteEditor />
      {/* <NovelEditor /> */}
      {/* <BlockEditor /> */}
      {/* <MinimalEditor /> */}
      {/* <SimpleEditor /> */}
    </div>
  )
}
```

## ✨ Features

✅ **5 Different Editor Styles** - Choose the one that fits your needs  
✅ **Dark Mode in All Editors** - Built-in theme toggle  
✅ **Component-Ready** - Clean exports for easy integration  
✅ **TypeScript** - Fully typed for better DX  
✅ **No Headers/Footers** - Pure editor components  
✅ **Production-Ready** - Optimized and tested  

## 🌙 Dark Mode

All editors support dark mode. Toggle using the button in the top-right corner of each editor, or programmatically:

```tsx
// Enable dark mode
document.documentElement.classList.add('dark')

// Disable dark mode
document.documentElement.classList.remove('dark')
```

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tiptap** - Rich text editor framework
- **BlockNote** - Block-based editor
- **Lucide React** - Icons
- **Lowlight** - Syntax highlighting

## 📚 Documentation

- [Detailed Editors Documentation](./EDITORS-README.md)
- [BlockNote Docs](https://www.blocknotejs.org/)
- [Tiptap Docs](https://tiptap.dev/)

## 🤝 Credits

- **BlockNote:** [TypeCell/BlockNote](https://github.com/TypeCell/BlockNote)
- **Novel:** [steven-tey/novel](https://github.com/steven-tey/novel)  
- **Tiptap:** [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap)

## 📄 License

MIT License - Free for commercial and personal use

