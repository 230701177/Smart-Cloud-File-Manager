import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, Loader, Shield } from 'lucide-react';
import { useFiles } from '../../contexts/FileContext';
import { formatBytes } from '../../utils/helpers';
import './Upload.css';

export default function UploadModal() {
    const { showUploadModal, uploads, dispatch, simulateUpload } = useFiles();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        const files = [...e.dataTransfer.files];
        setSelectedFiles((prev) => [...prev, ...files]);
    }, []);

    const handleSelect = (e) => {
        const files = [...e.target.files];
        setSelectedFiles((prev) => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        selectedFiles.forEach((file) => simulateUpload(file));
        setSelectedFiles([]);
    };

    if (!showUploadModal) return null;

    const statusIcon = (status) => {
        if (status === 'uploading') return <Loader size={14} className="upload__spin" />;
        if (status === 'deduplicating') return <Shield size={14} color="var(--color-warning)" />;
        if (status === 'complete') return <CheckCircle size={14} color="var(--color-success)" />;
        return null;
    };

    const statusLabel = (status) => {
        if (status === 'uploading') return 'Uploading...';
        if (status === 'deduplicating') return 'Deduplicating...';
        if (status === 'complete') return 'Complete';
        return '';
    };

    return (
        <div className="modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL' })}>
            <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Upload Files</h3>
                    <button className="btn-icon" onClick={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL' })}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <div
                        className={`upload__dropzone ${dragActive ? 'upload__dropzone--active' : ''}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload size={36} strokeWidth={1.5} />
                        <p>Drag & drop files here</p>
                        <span className="text-xs text-tertiary">or click to browse</span>
                        <input ref={inputRef} type="file" multiple hidden onChange={handleSelect} />
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="upload__selected">
                            <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Selected Files</h4>
                            {selectedFiles.map((f, i) => (
                                <div key={i} className="upload__file-row">
                                    <FileText size={16} />
                                    <span className="text-sm truncate" style={{ flex: 1 }}>{f.name}</span>
                                    <span className="text-xs text-tertiary">{formatBytes(f.size)}</span>
                                    <button className="btn-icon" onClick={() => removeFile(i)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {uploads.length > 0 && (
                        <div className="upload__progress-section">
                            <h4 className="text-sm" style={{ fontWeight: 600, marginBottom: 'var(--sp-2)' }}>Upload Progress</h4>
                            {uploads.map((u) => (
                                <div key={u.id} className="upload__progress-item">
                                    <div className="upload__progress-header">
                                        <span className="text-sm truncate">{u.name}</span>
                                        <div className="flex items-center gap-2">
                                            {statusIcon(u.status)}
                                            <span className="text-xs text-secondary">{statusLabel(u.status)}</span>
                                        </div>
                                    </div>
                                    <div className="upload__progress-bar">
                                        <div
                                            className={`upload__progress-fill ${u.status === 'deduplicating' ? 'upload__progress-fill--dedup' : ''} ${u.status === 'complete' ? 'upload__progress-fill--done' : ''}`}
                                            style={{ width: `${Math.min(u.progress, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL' })}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleUpload} disabled={selectedFiles.length === 0}>
                        <Upload size={16} /> Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
