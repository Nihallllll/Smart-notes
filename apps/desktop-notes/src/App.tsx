import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Editor } from './components/Editor';
import { RenameModal } from './components/RenameModal';
import { Note } from './types/electron';
import './App.css';

function App() {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const loadNotes = useCallback(async () => {
    const result = await window.electronAPI.listNotes();
    if (result.success) {
      setNotes(result.notes);
    }
  }, []);

  useEffect(() => {
    const initWorkspace = async () => {
      const workspace = await window.electronAPI.getWorkspace();
      if (workspace) {
        setWorkspacePath(workspace);
        await loadNotes();
      }
    };
    initWorkspace();

    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'true');
    }
  }, [loadNotes]);

  const handleSelectWorkspace = async () => {
    const result = await window.electronAPI.selectWorkspace();
    if (result.success && result.path) {
      setWorkspacePath(result.path);
      setActiveNote(null);
      setContent('');
      await loadNotes();
    }
  };

  const handleOpenNote = async (filename: string) => {
    const result = await window.electronAPI.readNote(filename);
    if (result.success) {
      setActiveNote(filename);
      setContent(result.content);
      setLastSaved(null);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    
    setIsSaving(true);
    const result = await window.electronAPI.saveNote(activeNote, content);
    setIsSaving(false);
    
    if (result.success) {
      setLastSaved(new Date());
      await loadNotes();
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handleNewNote = async () => {
    const timestamp = Date.now();
    const filename = `note-${timestamp}.md`;
    
    const result = await window.electronAPI.createNote(filename);
    if (result.success && result.filename) {
      await loadNotes();
      await handleOpenNote(result.filename);
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleRenameNote = () => {
    if (!activeNote) return;
    setShowRenameModal(true);
  };

  const handleConfirmRename = async (newName: string) => {
    if (!activeNote) return;
    
    const newFilename = `${newName}.md`;
    const result = await window.electronAPI.renameNote(activeNote, newFilename);
    
    if (result.success && result.filename) {
      setActiveNote(result.filename);
      await loadNotes();
    }
    setShowRenameModal(false);
  };

  const handleExportPDF = () => {
    if (!activeNote || !content) return;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeNote.replace('.md', '')}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 2.25rem; margin-top: 0; }
            h2 { font-size: 1.875rem; margin-top: 2rem; }
            h3 { font-size: 1.5rem; margin-top: 1.5rem; }
            p { margin-bottom: 1rem; }
            ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
            li { margin-bottom: 0.5rem; }
            code { background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
            pre { background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
            blockquote { border-left: 3px solid #3b82f6; padding-left: 1rem; margin: 1rem 0; font-style: italic; color: #6b7280; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDeleteNote = async () => {
    if (!activeNote) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${activeNote.replace('.md', '')}"?`);
    
    if (confirmed) {
      const result = await window.electronAPI.deleteNote(activeNote);
      
      if (result.success) {
        setActiveNote(null);
        setContent('');
        setLastSaved(null);
        await loadNotes();
      }
    }
  };

  return (
    <div className="app">
      <Sidebar
        notes={notes}
        activeNote={activeNote}
        onSelectNote={handleOpenNote}
        onNewNote={handleNewNote}
        workspacePath={workspacePath}
        onSelectWorkspace={handleSelectWorkspace}
      />
      <div className="main-content">
        <TopBar
          noteName={activeNote}
          onSave={handleSaveNote}
          onRename={handleRenameNote}
          onDelete={handleDeleteNote}
          onExportPDF={handleExportPDF}
          onToggleDarkMode={handleToggleDarkMode}
          isDarkMode={isDarkMode}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
        {activeNote ? (
          <Editor
            content={content}
            onChange={handleContentChange}
            onSave={handleSaveNote}
          />
        ) : (
          <div className="empty-editor">
            <div className="empty-editor-content">
              <div className="empty-icon">📝</div>
              <h2>Smart Notes Desktop</h2>
              <p>Select a note from the sidebar or create a new one</p>
              {!workspacePath && (
                <button onClick={handleSelectWorkspace} className="btn-select">
                  Select Workspace Folder
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {showRenameModal && activeNote && (
        <RenameModal
          currentName={activeNote.replace('.md', '')}
          onConfirm={handleConfirmRename}
          onCancel={() => setShowRenameModal(false)}
        />
      )}
    </div>
  );
}

export default App;
