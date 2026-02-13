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
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Heading1, Heading2, List, ListOrdered, CheckSquare } from 'lucide-react'
import '../styles/novel-editor.css'

const NovelEditor = () => {
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
          class: 'text-blue-500 underline cursor-pointer'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto'
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
    ],
    content: `
      <h1>Novel-Style Editor</h1>
      <p>This is a <strong>Notion-style</strong> WYSIWYG editor inspired by the open-source <em>Novel</em> project.</p>
      <h2>Features:</h2>
      <ul>
        <li>Rich formatting with bubble menu</li>
        <li>Task lists and tables</li>
        <li>Image support</li>
        <li>Link editing</li>
      </ul>
      <h3>Try it out:</h3>
      <p>Click on any text to see the formatting menu appear!</p>
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

  return (
    <div className="novel-container">
      {editor && (
        <BubbleMenu editor={editor}>
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
              onClick={setLink}
              className={editor.isActive('link') ? 'is-active' : ''}
              title="Add Link"
            >
              <LinkIcon size={16} />
            </button>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}

export default NovelEditor
