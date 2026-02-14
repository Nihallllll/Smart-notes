import './App.css'
import MinimalEditor from './editors/MinimalEditor'
import NovelEditor from './editors/NovelEditor'
import BlockEditor from './editors/BlockEditor'
import BlockNoteEditor from './editors/BlockNoteEditor'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

// Demo: You can switch between different editors
function App() {
  return (
    <div className="app-container">
      {/* Choose one of the editors below */}
      <BlockNoteEditor />
      {/* <NovelEditor /> */}
      {/* <BlockEditor /> */}
      {/* <MinimalEditor /> */}
      {/* <SimpleEditor /> */}
    </div>
  )
}

export default App

// Export all editors for use in other projects
export { MinimalEditor, NovelEditor, BlockEditor, BlockNoteEditor, SimpleEditor }