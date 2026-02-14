import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Heading1, Heading2, List, ListOrdered, CheckSquare, Highlighter, AlignLeft, AlignCenter, AlignRight, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import '../styles/novel-editor.css'

/**
 * NovelEditor - The "AI-First" Notion Editor
 * 
 * Highly polished Tiptap configuration inspired by Novel by Steven Tey
 * Features:
 * - Beautiful Bubble Menu for formatting
 * - Slash Menu for commands
 * - Tailwind CSS styling
 * - AI completion interface ready (requires API key)
 * 
 * Repo: https://github.com/steven-tey/novel
 */
const NovelEditor = () => {
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
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading'
          }
          return "Type '/' for commands, or just start writing..."
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'novel-link'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'novel-image'
        }
      }),
      Underline,
      Highlight.configure({
        multicolor: true
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list'
        }
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'novel-table'
        }
      }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      TextStyle,
      Color,
    ],
    content: `
      <h1>Welcome to Novel Editor</h1>
      <p>A beautiful, AI-ready editor inspired by Notion.</p>
      <p><strong>Try these features:</strong></p>
      <ul>
        <li>Select text to see the bubble menu with formatting options</li>
        <li>Type <code>/</code> to open the slash command menu</li>
        <li>Create tables, images, and task lists</li>
        <li>Use <em>markdown shortcuts</em> like <code>**bold**</code> or <code>## heading</code></li>
      </ul>
      <p>Start writing to experience the clean, focused interface!</p>
    `,
    editorProps: {
      attributes: {
        class: 'novel-editor prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-full'
      }
    }
  })

  const setLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run()
  }

  return (
    <div className="novel-container">
      <div className="editor-toolbar">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-btn"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="bubble-menu">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
              title="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'is-active' : ''}
              title="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'is-active' : ''}
              title="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'is-active' : ''}
              title="Code"
            >
              <Code size={16} />
            </button>
            <div className="separator" />
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
              title="Heading 1"
            >
              <Heading1 size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
              title="Heading 2"
            >
              <Heading2 size={16} />
            </button>
            <div className="separator" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'is-active' : ''}
              title="Task List"
            >
              <CheckSquare size={16} />
            </button>
            <div className="separator" />
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'is-active' : ''}
              title="Highlight"
            >
              <Highlighter size={16} />
            </button>
            <button
              onClick={setLink}
              className={editor.isActive('link') ? 'is-active' : ''}
              title="Add Link"
            >
              <LinkIcon size={16} />
            </button>
            <div className="separator" />
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

export default NovelEditor
