import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import '../styles/minimal-editor.css'

const MinimalEditor = () => {
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
    content: `
      <h1>Minimal Editor</h1>
      <p>A clean, distraction-free writing experience.</p>
      <p>This editor focuses on <strong>simplicity</strong> and <em>clarity</em>. No complex menus, just pure writing.</p>
      <h2>What you can do:</h2>
      <ul>
        <li>Use basic formatting (bold, italic, underline)</li>
        <li>Create headings and lists</li>
        <li>Write code blocks</li>
        <li>Add links</li>
      </ul>
      <p>Try using keyboard shortcuts:</p>
      <ul>
        <li><code>Ctrl/Cmd + B</code> for bold</li>
        <li><code>Ctrl/Cmd + I</code> for italic</li>
        <li><code>Ctrl/Cmd + U</code> for underline</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'minimal-editor prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-full'
      }
    }
  })

  return (
    <div className="minimal-container">
      <EditorContent editor={editor} />
    </div>
  )
}

export default MinimalEditor
