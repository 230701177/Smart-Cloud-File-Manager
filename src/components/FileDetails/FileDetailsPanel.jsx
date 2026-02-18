import {
    X, Download, Trash2, Star, Clock, Share2, FileText, Image, Video, Code, User, Hash, Layers, RotateCcw
} from 'lucide-react';
import { useFiles } from '../../contexts/FileContext';
import { formatBytes, formatDate, getFileColor } from '../../utils/helpers';
import './FileDetails.css';

export default function FileDetailsPanel() {
    const { selectedFile, showDetailsPanel, dispatch } = useFiles();
    if (!showDetailsPanel || !selectedFile) return null;

    const meta = [
        { label: 'Type', value: selectedFile.type, icon: FileText },
        { label: 'Size', value: formatBytes(selectedFile.size), icon: Layers },
        { label: 'Owner', value: selectedFile.ownerId === 'user-1' ? 'You' : 'Team member', icon: User },
        { label: 'Created', value: formatDate(selectedFile.createdAt), icon: Clock },
        { label: 'Modified', value: formatDate(selectedFile.modifiedAt), icon: Clock },
        { label: 'Hash', value: selectedFile.hash, icon: Hash },
        { label: 'Chunks', value: selectedFile.chunkCount, icon: Layers },
    ];

    return (
        <div className="details-overlay" onClick={() => dispatch({ type: 'CLOSE_DETAILS' })}>
            <div className="details-panel animate-slide-right" onClick={(e) => e.stopPropagation()}>
                <div className="details__header">
                    <h3 className="details__title truncate">{selectedFile.name}</h3>
                    <button className="btn-icon" onClick={() => dispatch({ type: 'CLOSE_DETAILS' })}><X size={18} /></button>
                </div>

                <div className="details__preview">
                    <div className="details__preview-icon" style={{ color: getFileColor(selectedFile.type) }}>
                        {selectedFile.type === 'image' ? <Image size={48} /> : selectedFile.type === 'video' ? <Video size={48} /> : selectedFile.type === 'code' ? <Code size={48} /> : <FileText size={48} />}
                    </div>
                </div>

                <div className="details__actions">
                    <button className="btn btn-primary"><Download size={16} /> Download</button>
                    <button className="btn btn-secondary" onClick={() => dispatch({ type: 'TOGGLE_STAR', payload: selectedFile.id })}>
                        <Star size={16} fill={selectedFile.starred ? 'var(--color-warning)' : 'none'} color={selectedFile.starred ? 'var(--color-warning)' : 'currentColor'} />
                        {selectedFile.starred ? 'Starred' : 'Star'}
                    </button>
                    <button className="btn btn-danger" onClick={() => dispatch({ type: 'DELETE_FILE', payload: selectedFile.id })}>
                        <Trash2 size={16} /> Delete
                    </button>
                </div>

                <div className="details__meta">
                    <h4 className="details__section-title">File Information</h4>
                    {meta.map((m) => (
                        <div key={m.label} className="details__meta-row">
                            <div className="details__meta-label"><m.icon size={14} /> {m.label}</div>
                            <div className="details__meta-value text-sm">{m.value}</div>
                        </div>
                    ))}
                    {selectedFile.shared && (
                        <div className="details__meta-row">
                            <div className="details__meta-label"><Share2 size={14} /> Status</div>
                            <span className="badge badge-primary">Shared</span>
                        </div>
                    )}
                </div>

                <div className="details__versions">
                    <h4 className="details__section-title">Version History ({selectedFile.versions.length})</h4>
                    <div className="details__version-list">
                        {[...selectedFile.versions].reverse().map((v, i) => (
                            <div key={v.versionId} className="details__version-item">
                                <div className="details__version-dot-line">
                                    <div className={`details__version-dot ${i === 0 ? 'details__version-dot--current' : ''}`} />
                                    {i < selectedFile.versions.length - 1 && <div className="details__version-line" />}
                                </div>
                                <div className="details__version-info">
                                    <span className="text-sm" style={{ fontWeight: 500 }}>{v.note}</span>
                                    <span className="text-xs text-tertiary">{formatDate(v.date)} · {formatBytes(v.size)}</span>
                                </div>
                                {i !== 0 && (
                                    <button className="btn btn-ghost text-xs" onClick={() => dispatch({ type: 'RESTORE_VERSION', payload: { fileId: selectedFile.id, versionId: v.versionId } })}>
                                        <RotateCcw size={12} /> Restore
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
