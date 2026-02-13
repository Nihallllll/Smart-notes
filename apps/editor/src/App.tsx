import { useState } from 'react'
import NovelEditor from './editors/NovelEditor'
import MinimalEditor from './editors/MinimalEditor'
import BlockEditor from './editors/BlockEditor'
import { ChevronDown } from 'lucide-react'
import './App.css'

type EditorType = 'novel' | 'minimal' | 'block'

interface EditorOption {
  id: EditorType
  name: string
  description: string
  source: string
  sourceUrl: string
}

const editorOptions: EditorOption[] = [
  {
    id: 'novel',
    name: 'Novel Editor',
    description: 'Notion-style WYSIWYG editor inspired by steven-tey/novel',
    source: 'Novel (Open Source)',
    sourceUrl: 'https://github.com/steven-tey/novel'
  },
  {
    id: 'block',
    name: 'Block Editor',
    description: 'Modern block-based editor inspired by BlockNote',
    source: 'BlockNote (Open Source)',
    sourceUrl: 'https://github.com/TypeCellOS/BlockNote'
  },
  {
    id: 'minimal',
    name: 'Minimal Editor',
    description: 'Clean, distraction-free writing experience',
    source: 'Custom Implementation',
    sourceUrl: '#'
  }
]

function App() {
  const [selectedEditor, setSelectedEditor] = useState<EditorType>('novel')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const currentEditor = editorOptions.find(e => e.id === selectedEditor)

  const renderEditor = () => {
    switch (selectedEditor) {
      case 'novel':
        return <NovelEditor />
      case 'minimal':
        return <MinimalEditor />
      case 'block':
        return <BlockEditor />
      default:
        return <NovelEditor />
    }
  }

  return (
    <div className="app-container">
      {/* Header with Editor Selector */}
      <div className="app-header">
        <div className="header-content">
          <div className="logo">
            <h1>✍️ TipTap Editors</h1>
            <p className="subtitle">Open-Source Notion-like Editors Collection</p>
          </div>
          
          <div className="editor-selector">
            <button 
              className="selector-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="selector-info">
                <span className="selector-name">{currentEditor?.name}</span>
                <span className="selector-source">{currentEditor?.source}</span>
              </div>
              <ChevronDown size={20} className={`chevron ${isDropdownOpen ? 'open' : ''}`} />
            </button>

            {isDropdownOpen && (
              <>
                <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
                <div className="dropdown-menu">
                  {editorOptions.map((option) => (
                    <button
                      key={option.id}
                      className={`dropdown-item ${selectedEditor === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedEditor(option.id)
                        setIsDropdownOpen(false)
                      }}
                    >
                      <div className="dropdown-item-content">
                        <div className="dropdown-item-header">
                          <span className="dropdown-item-name">{option.name}</span>
                          {selectedEditor === option.id && (
                            <span className="active-badge">Active</span>
                          )}
                        </div>
                        <p className="dropdown-item-description">{option.description}</p>
                        {option.sourceUrl !== '#' && (
                          <a 
                            href={option.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dropdown-item-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Source →
                          </a>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="editor-wrapper">
        {renderEditor()}
      </div>

      {/* Footer */}
      <div className="app-footer">
        <p>
          Built with ❤️ using <a href="https://tiptap.dev" target="_blank" rel="noopener noreferrer">TipTap</a>
          {' • '}
          <a href="https://github.com/steven-tey/novel" target="_blank" rel="noopener noreferrer">Novel</a>
          {' • '}
          <a href="https://github.com/TypeCellOS/BlockNote" target="_blank" rel="noopener noreferrer">BlockNote</a>
        </p>
      </div>
    </div>
  )
}

export default App