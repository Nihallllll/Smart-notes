import './TopBar.css';

interface TopBarProps {
  noteName: string | null;
  onSave: () => void;
  onRename: () => void;
  onDelete: () => void;
  onExportPDF: () => void;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function TopBar({
  noteName,
  onSave,
  onRename,
  onDelete,
  onExportPDF,
  onToggleDarkMode,
  isDarkMode,
  isSaving,
  lastSaved
}: TopBarProps) {
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    
    if (diff < 5000) return 'Saved just now';
    if (diff < 60000) return `Saved ${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`;
    
    return `Saved at ${lastSaved.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="note-title">
          {noteName ? noteName.replace('.md', '') : 'No note selected'}
        </div>
        <div className="save-status">
          {isSaving && <span className="status-saving">Saving...</span>}
          {!isSaving && lastSaved && (
            <span className="status-saved">{formatLastSaved()}</span>
          )}
        </div>
      </div>
      <div className="topbar-actions">
        <button
          onClick={onToggleDarkMode}
          className="btn-action"
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        {noteName && (
          <>
            <button
              onClick={onSave}
              className="btn-action btn-save"
              title="Save (Ctrl+S)"
            >
              💾 Save
            </button>
            <button
              onClick={onExportPDF}
              className="btn-action"
              title="Export as PDF"
            >
              📄 PDF
            </button>
            <button
              onClick={onRename}
              className="btn-action"
              title="Rename note"
            >
              ✏️ Rename
            </button>
            <button
              onClick={onDelete}
              className="btn-action btn-delete"
              title="Delete note"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
