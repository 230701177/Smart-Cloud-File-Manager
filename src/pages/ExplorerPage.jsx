import { useState } from 'react';
import {
    Grid, List, SortAsc, ChevronRight, FolderOpen, Folder,
    FileText, Image, Video, Code, Presentation, Package, File as FileIcon, Sheet,
    Star, MoreVertical, Download, Trash2, Info, Music, Archive
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { formatBytes, formatDate, getFileColor } from '../utils/helpers';
import './ExplorerPage.css';

const typeIcons = {
    pdf: FileText, document: FileText, spreadsheet: Sheet,
    image: Image, video: Video, audio: Music,
    presentation: Presentation, code: Code, design: Package,
    archive: Archive, other: FileIcon,
};

export default function ExplorerPage() {
    const {
        viewMode, searchQuery, sortBy, sortOrder,
        currentFolderId, dispatch,
        getCurrentItems, getBreadcrumbs,
    } = useFiles();
    const { files, folders } = getCurrentItems();
    const breadcrumbs = getBreadcrumbs();
    const [contextMenu, setContextMenu] = useState(null);

    const handleSort = (field) => {
        dispatch({
            type: 'SET_SORT',
            payload: { sortBy: field, sortOrder: sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc' },
        });
    };

    const handleContextMenu = (e, file) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    const closeContext = () => setContextMenu(null);

    return (
        <div className="explorer animate-fade-in" onClick={closeContext}>
            <div className="explorer__header">
                <div className="explorer__breadcrumbs">
                    {breadcrumbs.map((crumb, i) => (
                        <span key={crumb.id ?? 'root'} className="explorer__crumb-wrapper">
                            <button
                                className={`explorer__crumb ${i === breadcrumbs.length - 1 ? 'explorer__crumb--active' : ''}`}
                                onClick={() => dispatch({ type: 'SET_CURRENT_FOLDER', payload: crumb.id })}
                            >
                                {crumb.name}
                            </button>
                            {i < breadcrumbs.length - 1 && <ChevronRight size={14} className="explorer__crumb-sep" />}
                        </span>
                    ))}
                </div>
                <div className="explorer__controls">
                    <div className="explorer__sort">
                        {['name', 'size', 'date'].map((s) => (
                            <button
                                key={s}
                                className={`btn btn-ghost explorer__sort-btn ${sortBy === s ? 'explorer__sort-btn--active' : ''}`}
                                onClick={() => handleSort(s)}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                {sortBy === s && <SortAsc size={12} style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none' }} />}
                            </button>
                        ))}
                    </div>
                    <div className="explorer__view-toggle">
                        <button
                            className={`btn-icon ${viewMode === 'grid' ? 'explorer__view--active' : ''}`}
                            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            className={`btn-icon ${viewMode === 'list' ? 'explorer__view--active' : ''}`}
                            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {folders.length === 0 && files.length === 0 ? (
                <div className="explorer__empty">
                    <FolderOpen size={64} strokeWidth={1} />
                    <h3>No files here</h3>
                    <p className="text-secondary text-sm">Upload files or create a folder to get started</p>
                </div>
            ) : (
                <>
                    {folders.length > 0 && (
                        <div className="explorer__section">
                            <h4 className="explorer__section-title">Folders</h4>
                            <div className={viewMode === 'grid' ? 'explorer__grid' : 'explorer__list'}>
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className={`explorer__item explorer__folder ${viewMode === 'list' ? 'explorer__item--list' : ''}`}
                                        onClick={() => dispatch({ type: 'SET_CURRENT_FOLDER', payload: folder.id })}
                                    >
                                        <div className="explorer__item-icon" style={{ color: folder.color }}>
                                            <Folder size={viewMode === 'grid' ? 32 : 20} fill={folder.color} />
                                        </div>
                                        <div className="explorer__item-info">
                                            <span className="explorer__item-name truncate">{folder.name}</span>
                                            {viewMode === 'list' && (
                                                <span className="text-xs text-tertiary">{formatDate(folder.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="explorer__section">
                            <h4 className="explorer__section-title">Files</h4>
                            <div className={viewMode === 'grid' ? 'explorer__grid' : 'explorer__list'}>
                                {files.map((file) => {
                                    const Icon = typeIcons[file.type] || FileIcon;
                                    return (
                                        <div
                                            key={file.id}
                                            className={`explorer__item explorer__file ${viewMode === 'list' ? 'explorer__item--list' : ''}`}
                                            onClick={() => dispatch({ type: 'SELECT_FILE', payload: file })}
                                            onContextMenu={(e) => handleContextMenu(e, file)}
                                        >
                                            <div className="explorer__item-icon" style={{ color: getFileColor(file.type) }}>
                                                <Icon size={viewMode === 'grid' ? 32 : 20} />
                                            </div>
                                            <div className="explorer__item-info">
                                                <span className="explorer__item-name truncate">{file.name}</span>
                                                <span className="text-xs text-tertiary">
                                                    {formatBytes(file.size)} {viewMode === 'list' && `· ${formatDate(file.modifiedAt)}`}
                                                </span>
                                            </div>
                                            <div className="explorer__item-meta">
                                                {file.starred && <Star size={14} fill="var(--color-warning)" color="var(--color-warning)" />}
                                                {file.shared && <span className="badge badge-primary">Shared</span>}
                                                <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleContextMenu(e, file); }}>
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {contextMenu && (
                <div className="explorer__context-menu animate-scale-in" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button onClick={() => { dispatch({ type: 'SELECT_FILE', payload: contextMenu.file }); closeContext(); }}>
                        <Info size={14} /> Details
                    </button>
                    <button onClick={() => { dispatch({ type: 'TOGGLE_STAR', payload: contextMenu.file.id }); closeContext(); }}>
                        <Star size={14} /> {contextMenu.file.starred ? 'Unstar' : 'Star'}
                    </button>
                    <button><Download size={14} /> Download</button>
                    <div className="explorer__context-divider" />
                    <button className="explorer__context-danger" onClick={() => { dispatch({ type: 'DELETE_FILE', payload: contextMenu.file.id }); closeContext(); }}>
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}
