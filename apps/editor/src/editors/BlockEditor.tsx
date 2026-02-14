import { useEditor, EditorContent } from '@tiptap/react'
import { FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Plus, Heading1, Heading2, List, ListOrdered, CheckSquare, Code, ImageIcon, Table as TableIcon, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import '../styles/block-editor.css'

const lowlight = createLowlight(common)

const BlockEditor = () => {
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
        codeBlock: false,
        heading: {
          levels: [1, 2, 3]
        }
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block'
        }
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          return "Type '/' for commands or click '+' to add a block..."
        },
        showOnlyWhenEditable: true
      }),
      Link.configure({
        openOnClick: false
      }),
      Image,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: '<p>Start writing...</p>',
    editorProps: {
      attributes: {
        class: 'block-editor prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-full'
      }
    }
  })

  const addBlock = (type: string) => {
    switch (type) {
      case 'heading1':
        editor?.chain().focus().setHeading({ level: 1 }).run()
        break
      case 'heading2':
        editor?.chain().focus().setHeading({ level: 2 }).run()
        break
      case 'bulletList':
        editor?.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor?.chain().focus().toggleOrderedList().run()
        break
      case 'taskList':
        editor?.chain().focus().toggleTaskList().run()
        break
      case 'codeBlock':
        editor?.chain().focus().setCodeBlock().run()
        break
      case 'table':
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        break
      case 'image':
        const url = window.prompt('Enter image URL:')
        if (url) {
          editor?.chain().focus().setImage({ src: url }).run()
        }
        break
    }
  }

  return (
    <div className="block-container">
      <div className="editor-toolbar">
        <button
          onClick={toggleDarkMode}
          className="theme-toggle-btn"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      {editor && (
        <FloatingMenu editor={editor}>
          <div className="floating-menu">
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              title="Add Block"
              className="add-block-btn"
            >
              <Plus size={20} />
            </button>
            <div className="floating-menu-dropdown">
              <button onClick={() => addBlock('heading1')} title="Heading 1">
                <Heading1 size={16} /> <span>Heading 1</span>
              </button>
              <button onClick={() => addBlock('heading2')} title="Heading 2">
                <Heading2 size={16} /> <span>Heading 2</span>
              </button>
              <button onClick={() => addBlock('bulletList')} title="Bullet List">
                <List size={16} /> <span>Bullet List</span>
              </button>
              <button onClick={() => addBlock('orderedList')} title="Numbered List">
                <ListOrdered size={16} /> <span>Numbered List</span>
              </button>
              <button onClick={() => addBlock('taskList')} title="Task List">
                <CheckSquare size={16} /> <span>Task List</span>
              </button>
              <button onClick={() => addBlock('codeBlock')} title="Code Block">
                <Code size={16} /> <span>Code Block</span>
              </button>
              <button onClick={() => addBlock('table')} title="Table">
                <TableIcon size={16} /> <span>Table</span>
              </button>
              <button onClick={() => addBlock('image')} title="Image">
                <ImageIcon size={16} /> <span>Image</span>
              </button>
            </div>
          </div>
        </FloatingMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

export default BlockEditor
