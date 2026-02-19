import { Note } from '../types/electron';
import './Sidebar.css';

interface SidebarProps {
  notes: Note[];
  activeNote: string | null;
  onSelectNote: (filename: string) => void;
  onNewNote: () => void;
  workspacePath: string | null;
  onSelectWorkspace: () => void;
}

export function Sidebar({
  notes,
  activeNote,
  onSelectNote,
  onNewNote,
  workspacePath,
  onSelectWorkspace
}: SidebarProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Smart Notes</h2>
        <button onClick={onNewNote} className="btn-new" title="New Note">
          +
        </button>
      </div>

      <div className="workspace-info">
        {workspacePath ? (
          <div className="workspace-path">
            <span className="workspace-label">Workspace:</span>
            <span className="workspace-name">{workspacePath.split('\\').pop() || workspacePath.split('/').pop()}</span>
            <button onClick={onSelectWorkspace} className="btn-change">
              Change
            </button>
          </div>
        ) : (
          <button onClick={onSelectWorkspace} className="btn-select-workspace">
            Select Workspace
          </button>
        )}
      </div>

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No notes yet</p>
            <p className="empty-hint">Create your first note to get started</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.filename}
              className={`note-item ${activeNote === note.filename ? 'active' : ''}`}
              onClick={() => onSelectNote(note.filename)}
            >
              <div className="note-name">
                {note.filename.replace('.md', '')}
              </div>
              <div className="note-meta">
                {formatDate(note.modified)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
