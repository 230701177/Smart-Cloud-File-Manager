import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useFiles } from '../contexts/FileContext';
import { formatBytes, formatDate } from '../utils/helpers';
import './TrashPage.css';

export default function TrashPage() {
    const { trash, dispatch } = useFiles();
    const [confirmEmpty, setConfirmEmpty] = useState(false);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--sp-6)' }}>
                <div>
                    <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Trash</h1>
                    <p className="text-secondary text-sm">{trash.length} items in trash</p>
                </div>
                {trash.length > 0 && (
                    <button className="btn btn-danger" onClick={() => setConfirmEmpty(true)}>
                        <Trash2 size={16} /> Empty Trash
                    </button>
                )}
            </div>

            {trash.length === 0 ? (
                <div className="explorer__empty">
                    <Trash2 size={64} strokeWidth={1} />
                    <h3>Trash is empty</h3>
                    <p className="text-secondary text-sm">Deleted files will appear here</p>
                </div>
            ) : (
                <div className="trash__list">
                    {trash.map((file) => (
                        <div key={file.id} className="trash__item">
                            <div className="trash__item-info">
                                <span className="text-sm" style={{ fontWeight: 500 }}>{file.name}</span>
                                <span className="text-xs text-tertiary">
                                    {formatBytes(file.size)} · Deleted {formatDate(file.deletedAt)}
                                </span>
                            </div>
                            <div className="trash__item-actions">
                                <button className="btn btn-ghost text-sm" onClick={() => dispatch({ type: 'RESTORE_FILE', payload: file.id })}>
                                    <RotateCcw size={14} /> Restore
                                </button>
                                <button className="btn btn-danger text-sm" onClick={() => dispatch({ type: 'PERMANENT_DELETE', payload: file.id })}>
                                    <X size={14} /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmEmpty && (
                <div className="modal-overlay" onClick={() => setConfirmEmpty(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-body" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>
                            <AlertTriangle size={48} color="var(--color-warning)" style={{ marginBottom: 'var(--sp-4)' }} />
                            <h3 style={{ marginBottom: 'var(--sp-2)' }}>Empty Trash?</h3>
                            <p className="text-sm text-secondary" style={{ marginBottom: 'var(--sp-6)' }}>
                                This will permanently delete all {trash.length} items. Chunk references will be decremented.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button className="btn btn-secondary" onClick={() => setConfirmEmpty(false)}>Cancel</button>
                                <button className="btn btn-danger" onClick={() => { dispatch({ type: 'EMPTY_TRASH' }); setConfirmEmpty(false); }}>
                                    Delete All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
