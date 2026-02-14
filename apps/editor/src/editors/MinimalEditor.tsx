import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import '../styles/minimal-editor.css'

/**
 * MinimalEditor - A clean and distraction-free writing experience
 * 
 * Perfect for focused writing with minimal formatting options.
 * Features:
 * - Clean interface
 * - Dark mode support
 * - Essential formatting only
 */
const MinimalEditor = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const initialDarkMode = document.documentElement.classList.contains('dark')
    setIsDarkMode(initialDarkMode)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: 'Start typing...'
      }),
      Underline,
      Link.configure({
        openOnClick: false
      }),
    ],
    content: '<p>Start writing...</p>',
    editorProps: {
      attributes: {
        class: 'minimal-editor prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-full'
      }
    }
  })

  return (
    <div className="minimal-container">
      <div className="editor-toolbar-minimal">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-btn-minimal"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default MinimalEditor
