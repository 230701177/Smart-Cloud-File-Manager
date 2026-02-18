import { createContext, useContext, useReducer, useCallback } from 'react';
import { mockFiles as initialFiles, mockFolders as initialFolders, mockStats } from '../data/mockData';

const FileContext = createContext(null);

const initialState = {
    files: initialFiles,
    folders: initialFolders,
    trash: [],
    uploads: [],
    selectedFile: null,
    currentFolderId: null,
    viewMode: 'grid',
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
    showUploadModal: false,
    showDetailsPanel: false,
};

function fileReducer(state, action) {
    switch (action.type) {
        case 'SET_CURRENT_FOLDER':
            return { ...state, currentFolderId: action.payload, selectedFile: null, showDetailsPanel: false };

        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };

        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.payload };

        case 'SET_SORT': {
            const { sortBy, sortOrder } = action.payload;
            return { ...state, sortBy, sortOrder };
        }

        case 'SELECT_FILE':
            return { ...state, selectedFile: action.payload, showDetailsPanel: true };

        case 'CLOSE_DETAILS':
            return { ...state, showDetailsPanel: false, selectedFile: null };

        case 'TOGGLE_UPLOAD_MODAL':
            return { ...state, showUploadModal: !state.showUploadModal };

        case 'UPLOAD_START':
            return {
                ...state,
                uploads: [...state.uploads, { ...action.payload, progress: 0, status: 'uploading' }],
            };

        case 'UPLOAD_PROGRESS':
            return {
                ...state,
                uploads: state.uploads.map((u) =>
                    u.id === action.payload.id ? { ...u, progress: action.payload.progress, status: action.payload.status || u.status } : u
                ),
            };

        case 'UPLOAD_COMPLETE': {
            const upload = state.uploads.find((u) => u.id === action.payload.id);
            const newFile = {
                id: `file-${Date.now()}`,
                name: upload?.name || 'Untitled',
                type: getFileType(upload?.name || ''),
                size: upload?.size || 0,
                parentId: state.currentFolderId,
                ownerId: 'user-1',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                shared: false,
                starred: false,
                hash: `sha256-${Math.random().toString(36).substr(2, 9)}`,
                chunkCount: Math.ceil((upload?.size || 1024) / 262144),
                versions: [
                    {
                        versionId: `v-${Date.now()}`,
                        date: new Date().toISOString(),
                        size: upload?.size || 0,
                        note: 'Initial upload',
                    },
                ],
            };
            return {
                ...state,
                files: [...state.files, newFile],
                uploads: state.uploads.filter((u) => u.id !== action.payload.id),
            };
        }

        case 'DELETE_FILE': {
            const file = state.files.find((f) => f.id === action.payload);
            if (!file) return state;
            return {
                ...state,
                files: state.files.filter((f) => f.id !== action.payload),
                trash: [...state.trash, { ...file, deletedAt: new Date().toISOString() }],
                selectedFile: state.selectedFile?.id === action.payload ? null : state.selectedFile,
                showDetailsPanel: state.selectedFile?.id === action.payload ? false : state.showDetailsPanel,
            };
        }

        case 'RESTORE_FILE': {
            const trashedFile = state.trash.find((f) => f.id === action.payload);
            if (!trashedFile) return state;
            const { deletedAt, ...restoredFile } = trashedFile;
            return {
                ...state,
                trash: state.trash.filter((f) => f.id !== action.payload),
                files: [...state.files, restoredFile],
            };
        }

        case 'PERMANENT_DELETE':
            return {
                ...state,
                trash: state.trash.filter((f) => f.id !== action.payload),
            };

        case 'EMPTY_TRASH':
            return { ...state, trash: [] };

        case 'TOGGLE_STAR': {
            return {
                ...state,
                files: state.files.map((f) =>
                    f.id === action.payload ? { ...f, starred: !f.starred } : f
                ),
                selectedFile: state.selectedFile?.id === action.payload
                    ? { ...state.selectedFile, starred: !state.selectedFile.starred }
                    : state.selectedFile,
            };
        }

        case 'RESTORE_VERSION': {
            const { fileId, versionId } = action.payload;
            return {
                ...state,
                files: state.files.map((f) => {
                    if (f.id !== fileId) return f;
                    const version = f.versions.find((v) => v.versionId === versionId);
                    if (!version) return f;
                    return {
                        ...f,
                        modifiedAt: new Date().toISOString(),
                        size: version.size,
                        versions: [
                            ...f.versions,
                            {
                                versionId: `v-${Date.now()}`,
                                date: new Date().toISOString(),
                                size: version.size,
                                note: `Restored from ${version.note}`,
                            },
                        ],
                    };
                }),
            };
        }

        case 'ADD_FOLDER': {
            const newFolder = {
                id: `folder-${Date.now()}`,
                name: action.payload.name,
                parentId: state.currentFolderId,
                ownerId: 'user-1',
                createdAt: new Date().toISOString(),
                color: action.payload.color || '#4285f4',
            };
            return { ...state, folders: [...state.folders, newFolder] };
        }

        default:
            return state;
    }
}

function getFileType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap = {
        pdf: 'pdf', doc: 'document', docx: 'document', txt: 'document', md: 'document',
        png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image',
        mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
        mp3: 'audio', wav: 'audio', flac: 'audio',
        xlsx: 'spreadsheet', xls: 'spreadsheet', csv: 'spreadsheet',
        pptx: 'presentation', ppt: 'presentation',
        js: 'code', ts: 'code', py: 'code', java: 'code', sql: 'code', html: 'code', css: 'code',
        fig: 'design', sketch: 'design', xd: 'design',
        zip: 'archive', rar: 'archive', tar: 'archive', gz: 'archive',
    };
    return typeMap[ext] || 'other';
}

export function FileProvider({ children }) {
    const [state, dispatch] = useReducer(fileReducer, initialState);

    const getStats = useCallback(() => {
        const totalFiles = state.files.length;
        const totalFolders = state.folders.length;
        const totalStorageUsed = state.files.reduce((acc, f) => acc + f.size, 0);
        const totalVersions = state.files.reduce((acc, f) => acc + f.versions.length, 0);
        const totalChunks = state.files.reduce((acc, f) => acc + f.chunkCount, 0);
        const uniqueChunks = Math.round(totalChunks * 0.76);
        const storageSaved = mockStats.storageSaved;
        const duplicatesAvoided = mockStats.duplicatesAvoided;

        const breakdown = { documents: 0, images: 0, videos: 0, presentations: 0, code: 0, other: 0 };
        state.files.forEach((f) => {
            if (['document', 'pdf', 'spreadsheet'].includes(f.type)) breakdown.documents += f.size;
            else if (f.type === 'image') breakdown.images += f.size;
            else if (f.type === 'video') breakdown.videos += f.size;
            else if (f.type === 'presentation') breakdown.presentations += f.size;
            else if (f.type === 'code') breakdown.code += f.size;
            else breakdown.other += f.size;
        });

        return { totalFiles, totalFolders, totalStorageUsed, storageSaved, duplicatesAvoided, totalVersions, totalChunks, uniqueChunks, storageBreakdown: breakdown };
    }, [state.files, state.folders]);

    const getCurrentItems = useCallback(() => {
        let files = state.files.filter((f) => f.parentId === state.currentFolderId);
        let folders = state.folders.filter((f) => f.parentId === state.currentFolderId);

        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            files = files.filter((f) => f.name.toLowerCase().includes(q));
            folders = folders.filter((f) => f.name.toLowerCase().includes(q));
        }

        const sortFn = (a, b) => {
            let comparison = 0;
            switch (state.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    comparison = new Date(a.modifiedAt || a.createdAt) - new Date(b.modifiedAt || b.createdAt);
                    break;
                default:
                    comparison = 0;
            }
            return state.sortOrder === 'asc' ? comparison : -comparison;
        };

        return { files: files.sort(sortFn), folders: folders.sort(sortFn) };
    }, [state.files, state.folders, state.currentFolderId, state.searchQuery, state.sortBy, state.sortOrder]);

    const getBreadcrumbs = useCallback(() => {
        const crumbs = [{ id: null, name: 'My Drive' }];
        let currentId = state.currentFolderId;
        const trail = [];
        while (currentId) {
            const folder = state.folders.find((f) => f.id === currentId);
            if (!folder) break;
            trail.unshift({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
        }
        return [...crumbs, ...trail];
    }, [state.currentFolderId, state.folders]);

    const getRecentFiles = useCallback(() => {
        return [...state.files]
            .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
            .slice(0, 8);
    }, [state.files]);

    const getStarredFiles = useCallback(() => {
        return state.files.filter((f) => f.starred);
    }, [state.files]);

    const simulateUpload = useCallback((file) => {
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        dispatch({
            type: 'UPLOAD_START',
            payload: { id: uploadId, name: file.name, size: file.size },
        });

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress >= 80 && progress < 95) {
                dispatch({ type: 'UPLOAD_PROGRESS', payload: { id: uploadId, progress: Math.min(progress, 90), status: 'deduplicating' } });
            } else if (progress >= 95) {
                clearInterval(interval);
                dispatch({ type: 'UPLOAD_PROGRESS', payload: { id: uploadId, progress: 100, status: 'complete' } });
                setTimeout(() => {
                    dispatch({ type: 'UPLOAD_COMPLETE', payload: { id: uploadId } });
                }, 800);
            } else {
                dispatch({ type: 'UPLOAD_PROGRESS', payload: { id: uploadId, progress } });
            }
        }, 400);
    }, []);

    return (
        <FileContext.Provider
            value={{
                ...state,
                dispatch,
                getStats,
                getCurrentItems,
                getBreadcrumbs,
                getRecentFiles,
                getStarredFiles,
                simulateUpload,
            }}
        >
            {children}
        </FileContext.Provider>
    );
}

export function useFiles() {
    const context = useContext(FileContext);
    if (!context) throw new Error('useFiles must be used within FileProvider');
    return context;
}
