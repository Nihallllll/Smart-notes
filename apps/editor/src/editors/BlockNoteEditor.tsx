import { useEffect, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { Moon, Sun } from 'lucide-react'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'
import '../styles/blocknote-editor.css'

/**
 * BlockNoteEditor - The "Gold Standard" for Notion-Clones
 * 
 * Built on top of Tiptap with a simple "Block" API.
 * Features:
 * - / menu for commands
 * - Drag-and-drop block handles
 * - Side menus
 * - Real-time collaboration support with Yjs
 * 
 * License: MIT
 * Repo: https://github.com/TypeCell/BlockNote
 */
const BlockNoteEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const initialDarkMode = document.documentElement.classList.contains('dark')
    setIsDarkMode(initialDarkMode)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode)

  // Create the BlockNote editor instance
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: 'paragraph',
        content: 'Welcome to BlockNote! 👋',
      },
      {
        type: 'paragraph',
        content: 'Type "/" to open the slash menu and see all available blocks',
      },
      {
        type: 'paragraph',
        content: 'Try dragging and dropping blocks using the handle on the left',
      },
      {
        type: 'heading',
        content: 'Features:',
      },
      {
        type: 'bulletListItem',
        content: 'Drag & drop blocks',
      },
      {
        type: 'bulletListItem',
        content: 'Slash commands with "/"',
      },
      {
        type: 'bulletListItem',
        content: 'Rich formatting options',
      },
      {
        type: 'bulletListItem',
        content: 'Tables, images, code blocks, and more',
      },
    ],
  })

  return (
    <div className="blocknote-container">
      <div className="editor-toolbar">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-btn"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="blocknote-editor-wrapper">
        <BlockNoteView
          editor={editor}
          theme={isDarkMode ? 'dark' : 'light'}
        />
      </div>
    </div>
  )
}

export default BlockNoteEditor
