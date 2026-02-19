import { useState } from 'react';
import './RenameModal.css';

interface RenameModalProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export function RenameModal({ currentName, onConfirm, onCancel }: RenameModalProps) {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onConfirm(newName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Rename Note</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            placeholder="Enter note name"
          />
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
