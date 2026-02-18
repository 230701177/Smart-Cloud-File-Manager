import { Star, FileText, Image, Video, Code } from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { formatBytes, formatDate, getFileColor } from '../utils/helpers';

const typeIcons = { pdf: FileText, document: FileText, image: Image, video: Video, code: Code, other: FileText };

export default function StarredPage() {
    const { getStarredFiles, dispatch } = useFiles();
    const starred = getStarredFiles();

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Starred</h1>
            <p className="text-secondary text-sm" style={{ marginBottom: 'var(--sp-6)' }}>Your important files</p>
            {starred.length === 0 ? (
                <div className="explorer__empty"><Star size={64} strokeWidth={1} /><h3>No starred files</h3><p className="text-secondary text-sm">Star files to find them quickly</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                    {starred.map((file) => {
                        const Icon = typeIcons[file.type] || FileText;
                        return (
                            <div key={file.id} className="explorer__item explorer__item--list" onClick={() => dispatch({ type: 'SELECT_FILE', payload: file })}>
                                <div className="explorer__item-icon" style={{ color: getFileColor(file.type) }}><Icon size={20} /></div>
                                <div className="explorer__item-info">
                                    <span className="explorer__item-name truncate">{file.name}</span>
                                    <span className="text-xs text-tertiary">{formatBytes(file.size)} · {formatDate(file.modifiedAt)}</span>
                                </div>
                                <Star size={14} fill="var(--color-warning)" color="var(--color-warning)" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
