import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

const FileContext = createContext(null);

const UPLOAD_CHUNK_SIZE = 1024 * 1024 * 2;
const UPLOAD_CONCURRENCY = 3;

const initialState = {
    files: [],
    folders: [], 
    trash: [],
    recommendedFiles: [],
    uploads: [],
    selectedFile: null,
    currentFolderId: null,
    viewMode: 'grid',
    searchQuery: '',
    sortBy: 'name',
    sortOrder: 'asc',
    showUploadModal: false,
    showDetailsPanel: false,
    showViewer: false,
    viewingFile: null,
    backendStats: null,
};

function fileReducer(state, action) {
    switch (action.type) {
        case 'FETCH_FILES_SUCCESS':
            return { ...state, files: action.payload };

        case 'FETCH_RECOMMENDED_SUCCESS':
            return { ...state, recommendedFiles: action.payload };

        case 'FETCH_TRASH_SUCCESS':
            return { ...state, trash: action.payload };

        case 'FETCH_FOLDERS_SUCCESS':
            return { ...state, folders: action.payload };

        case 'FETCH_STATS_SUCCESS':
            return { ...state, backendStats: action.payload };

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

        case 'FETCH_VERSIONS_SUCCESS':
            if (state.selectedFile?.id === action.payload.fileId) {
                return { 
                    ...state, 
                    selectedFile: { ...state.selectedFile, versions: action.payload.versions } 
                };
            }
            return state;

        case 'CLOSE_DETAILS':
            return { ...state, showDetailsPanel: false, selectedFile: null };

        case 'TOGGLE_UPLOAD_MODAL':
            return { ...state, showUploadModal: !state.showUploadModal };

        case 'OPEN_VIEWER':
            return { ...state, showViewer: true, viewingFile: action.payload };

        case 'CLOSE_VIEWER':
            return { ...state, showViewer: false, viewingFile: null };

        case 'UPLOAD_START':
            return {
                ...state,
                uploads: [...state.uploads, {
                    ...action.payload,
                    progress: 0,
                    status: 'uploading',
                    error: null,
                    uploadedChunks: action.payload.uploadedChunks || [],
                    totalChunks: action.payload.totalChunks || 0,
                    file: action.payload.file,
                }],
            };

        case 'UPLOAD_PROGRESS':
            return {
                ...state,
                uploads: state.uploads.map((u) =>
                    u.id === action.payload.id
                        ? {
                            ...u,
                            progress: action.payload.progress,
                            status: action.payload.status || u.status,
                            uploadedChunks: action.payload.uploadedChunks || u.uploadedChunks,
                            totalChunks: action.payload.totalChunks || u.totalChunks,
                            error: action.payload.error ?? u.error,
                        }
                        : u
                ),
            };

        case 'UPLOAD_PAUSED':
            return {
                ...state,
                uploads: state.uploads.map((u) =>
                    u.id === action.payload.id
                        ? {
                            ...u,
                            status: 'paused',
                            error: action.payload.error || 'Upload paused',
                            progress: action.payload.progress ?? u.progress,
                            uploadedChunks: action.payload.uploadedChunks || u.uploadedChunks,
                        }
                        : u
                ),
            };

        case 'UPLOAD_FAILED':
            return {
                ...state,
                uploads: state.uploads.map((u) =>
                    u.id === action.payload.id
                        ? {
                            ...u,
                            status: 'error',
                            error: action.payload.error || 'Upload failed',
                            progress: action.payload.progress ?? u.progress,
                            uploadedChunks: action.payload.uploadedChunks || u.uploadedChunks,
                        }
                        : u
                ),
            };

        case 'UPLOAD_COMPLETE': {
            const backendFile = action.payload.file; // From real API logic
            
            const newFile = backendFile ? {
                id: backendFile.fileId,
                name: backendFile.fileName,
                type: getFileType(backendFile.fileName),
                size: backendFile.size,
                parentId: state.currentFolderId,
                ownerId: backendFile.userId || 'user-1',
                createdAt: backendFile.createdAt || new Date().toISOString(),
                modifiedAt: backendFile.updatedAt || new Date().toISOString(),
                shared: false,
                starred: false,
                hash: backendFile.chunkHashes ? backendFile.chunkHashes[0] : `sha256-${Math.random().toString(36).substr(2, 9)}`,
                chunkCount: backendFile.chunkHashes?.length || Math.ceil((backendFile.size || 1024) / 262144),
                versions: [
                    {
                        versionId: `v-${backendFile.version || 1}`,
                        date: backendFile.createdAt || new Date().toISOString(),
                        size: backendFile.size || 0,
                        note: 'Initial upload',
                    },
                ],
            } : null;
            
            return {
                ...state,
                files: newFile ? [...state.files, newFile] : state.files,
                uploads: state.uploads.filter((u) => u.id !== action.payload.id),
            };
        }

        case 'DELETE_FILE_START': {
            const file = state.files.find((f) => f.id === action.payload);
            if (!file) return state;
            return {
                ...state,
                files: state.files.filter((f) => f.id !== action.payload),
                recommendedFiles: state.recommendedFiles.filter((f) => f.id !== action.payload),
                trash: [...state.trash, { ...file, inTrash: true, deletedAt: new Date().toISOString() }],
                selectedFile: state.selectedFile?.id === action.payload ? null : state.selectedFile,
                showDetailsPanel: state.selectedFile?.id === action.payload ? false : state.showDetailsPanel,
            };
        }

        case 'RESTORE_FILE_START': {
            const trashedFile = state.trash.find((f) => f.id === action.payload);
            if (!trashedFile) return state;
            return {
                ...state,
                trash: state.trash.filter((f) => f.id !== action.payload),
                files: [...state.files, { ...trashedFile, inTrash: false, deletedAt: null }],
                recommendedFiles: state.recommendedFiles.filter((f) => f.id !== action.payload),
            };
        }

        case 'PERMANENT_DELETE_START':
            return {
                ...state,
                trash: state.trash.filter((f) => f.id !== action.payload),
                recommendedFiles: state.recommendedFiles.filter((f) => f.id !== action.payload),
            };

        case 'EMPTY_TRASH_START':
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

        case 'RESTORE_VERSION_SUCCESS': {
            const { fileId, file } = action.payload;
            return {
                ...state,
                files: state.files.map((f) => 
                    f.id === fileId 
                        ? { ...f, version: file.version, modifiedAt: file.updatedAt } 
                        : f
                ),
                selectedFile: state.selectedFile?.id === fileId 
                    ? { ...state.selectedFile, version: file.version, modifiedAt: file.updatedAt }
                    : state.selectedFile
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
        const toSafeNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

        const totalFiles = state.files.length;
        const totalFolders = state.folders.length;
        const totalStorageUsed = state.files.reduce((acc, f) => acc + f.size, 0);
        const totalVersions = state.files.reduce((acc, f) => acc + f.versions?.length || 1, 0);
        const totalChunks = state.files.reduce((acc, f) => acc + (f.chunkCount || 1), 0);
        const uniqueChunks = toSafeNumber(state.backendStats?.uniqueChunks) || totalChunks;

        const logicalStorage = toSafeNumber(
            state.backendStats?.logicalStorage ?? state.backendStats?.totalLogicalSize
        );
        const physicalStorage = toSafeNumber(
            state.backendStats?.physicalStorage ?? state.backendStats?.totalPhysicalSize
        );

        const storageSaved = Math.max(0, logicalStorage - physicalStorage);
        const duplicatesAvoided = toSafeNumber(state.backendStats?.duplicatesAvoided);

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
    }, [state.files, state.folders, state.backendStats]);

    const fetchFiles = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/files/list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedFiles = data.files.map((backendFile) => ({
                    id: backendFile.fileId,
                    name: backendFile.fileName,
                    type: getFileType(backendFile.fileName),
                    size: backendFile.size,
                    parentId: backendFile.parentId || null,
                    ownerId: backendFile.userId,
                    createdAt: backendFile.createdAt || new Date().toISOString(),
                    modifiedAt: backendFile.updatedAt || new Date().toISOString(),
                    shared: false,
                    starred: backendFile.starred || false,
                    hash: backendFile.chunkHashes ? backendFile.chunkHashes[0] : 'sha256-xxx',
                    chunkCount: backendFile.chunkHashes?.length || 1,
                    inTrash: backendFile.inTrash || false,
                    versions: [
                        {
                            versionId: `v-${backendFile.version || 1}`,
                            date: backendFile.createdAt || new Date().toISOString(),
                            size: backendFile.size || 0,
                            note: 'Upload',
                        },
                    ],
                }));
                dispatch({ type: 'FETCH_FILES_SUCCESS', payload: mappedFiles });
            }
        } catch (error) {
            console.error('Failed to fetch files', error);
        }
    }, []);

    const fetchFolders = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/folders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedFolders = data.folders.map((f) => ({
                    id: f.folderId,
                    name: f.name,
                    parentId: f.parentId || null,
                    ownerId: f.userId,
                    createdAt: f.createdAt,
                    color: f.color
                }));
                dispatch({ type: 'FETCH_FOLDERS_SUCCESS', payload: mappedFolders });
            }
        } catch (error) {
            console.error('Failed to fetch folders', error);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/stats/storage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                dispatch({ type: 'FETCH_STATS_SUCCESS', payload: data.stats });
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    }, []);

    const fetchRecommended = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/files/recommend', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedFiles = data.files.map((backendFile) => ({
                    id: backendFile.fileId,
                    name: backendFile.fileName,
                    type: getFileType(backendFile.fileName),
                    size: backendFile.size,
                    modifiedAt: backendFile.lastAccessedAt || backendFile.updatedAt,
                    starred: backendFile.starred
                }));
                dispatch({ type: 'FETCH_RECOMMENDED_SUCCESS', payload: mappedFiles });
            }
        } catch (error) {
            console.error('Failed to fetch recommendations', error);
        }
    }, []);

    const fetchTrash = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch('/api/files/list?trash=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedFiles = data.files.map((backendFile) => ({
                    id: backendFile.fileId,
                    name: backendFile.fileName,
                    type: getFileType(backendFile.fileName),
                    size: backendFile.size,
                    deletedAt: backendFile.deletedAt
                }));
                dispatch({ type: 'FETCH_TRASH_SUCCESS', payload: mappedFiles });
            }
        } catch (error) {
            console.error('Failed to fetch trash', error);
        }
    }, []);

    const moveToTrash = useCallback(async (fileId) => {
        dispatch({ type: 'DELETE_FILE_START', payload: fileId });
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/files/trash/${fileId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await Promise.all([fetchFiles(), fetchTrash(), fetchRecommended(), fetchStats()]);
        } catch (error) {
            console.error('Move to trash failed', error);
        }
    }, [fetchFiles, fetchRecommended, fetchStats, fetchTrash]);

    const restoreFromTrash = useCallback(async (fileId) => {
        dispatch({ type: 'RESTORE_FILE_START', payload: fileId });
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/files/restore/${fileId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await Promise.all([fetchFiles(), fetchTrash(), fetchRecommended(), fetchStats()]);
        } catch (error) {
            console.error('Restore failed', error);
        }
    }, [fetchFiles, fetchRecommended, fetchStats, fetchTrash]);

    const permanentDelete = useCallback(async (fileId) => {
        dispatch({ type: 'PERMANENT_DELETE_START', payload: fileId });
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await Promise.all([fetchFiles(), fetchTrash(), fetchRecommended(), fetchStats()]);
        } catch (error) {
            console.error('Permanent delete failed', error);
        }
    }, [fetchFiles, fetchRecommended, fetchStats, fetchTrash]);

    const fetchVersions = useCallback(async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`/api/files/${fileId}/versions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mappedVersions = data.versions.map(v => ({
                    versionId: `v-${v.versionNumber}`,
                    versionNumber: v.versionNumber,
                    date: v.createdAt,
                    size: state.files.find(f => f.id === fileId)?.size || 0, // Simplified
                    note: `Version ${v.versionNumber}`
                }));
                dispatch({ type: 'FETCH_VERSIONS_SUCCESS', payload: { fileId, versions: mappedVersions } });
            }
        } catch (error) {
            console.error('Failed to fetch versions', error);
        }
    }, [state.files]);

    useEffect(() => {
        if (state.selectedFile?.id) {
            fetchVersions(state.selectedFile.id);
        }
    }, [state.selectedFile?.id, fetchVersions]);

    useEffect(() => {
        fetchFiles();
        fetchFolders();
        fetchStats();
        fetchRecommended();
        fetchTrash();
    }, [fetchFiles, fetchFolders, fetchStats, fetchRecommended, fetchTrash]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchRecommended();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [fetchRecommended]);

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

    const shareFile = useCallback(async (fileId, email, permission = 'view') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/files/share/${fileId}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, permission })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Failed to share file');
            }
            return true;
        } catch (error) {
            console.error('Share failed', error);
            throw error;
        }
    }, []);

    const readChunk = useCallback((file, start, end) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Failed to read file chunk'));
            reader.readAsArrayBuffer(file.slice(start, end));
        });
    }, []);

    const uploadChunkRequest = useCallback(async (uploadId, chunkIndex, buffer) => {
        const formData = new FormData();
        formData.append('chunk', new Blob([buffer]), `chunk-${chunkIndex}`);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', String(chunkIndex));

        const token = localStorage.getItem('token');
        const res = await fetch('/api/files/upload/chunk', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Chunk upload failed');
        }
    }, []);

    const completeChunkedUpload = useCallback(async (uploadId, fileName, parentId, totalChunks) => {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/files/upload/complete', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uploadId, totalChunks, fileName, parentId }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || error.message || 'Upload finalization failed');
        }

        return res.json();
    }, []);

    const startOptimizedUpload = useCallback((file, existingUpload = null) => {
        const uploadId = existingUpload?.id || `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const totalChunks = Math.max(1, Math.ceil(file.size / UPLOAD_CHUNK_SIZE));
        const parentId = state.currentFolderId || null;
        const uploadedChunkSet = new Set(existingUpload?.uploadedChunks || []);
        const pendingChunks = [];

        for (let index = 0; index < totalChunks; index += 1) {
            if (!uploadedChunkSet.has(index)) {
                pendingChunks.push(index);
            }
        }

        if (!existingUpload) {
            dispatch({
                type: 'UPLOAD_START',
                payload: {
                    id: uploadId,
                    name: file.name,
                    size: file.size,
                    file,
                    parentId,
                    totalChunks,
                    uploadedChunks: [...uploadedChunkSet],
                },
            });
        } else {
            dispatch({
                type: 'UPLOAD_PROGRESS',
                payload: {
                    id: uploadId,
                    progress: Math.min(95, Math.round((uploadedChunkSet.size / totalChunks) * 95)),
                    status: 'uploading',
                    uploadedChunks: [...uploadedChunkSet],
                    totalChunks,
                },
            });
        }

        void (async () => {
            try {
                if (pendingChunks.length > 0) {
                    let nextIndex = 0;
                    const workerCount = Math.min(UPLOAD_CONCURRENCY, pendingChunks.length);

                    const workers = Array.from({ length: workerCount }, async () => {
                        while (nextIndex < pendingChunks.length) {
                            const chunkIndex = pendingChunks[nextIndex];
                            nextIndex += 1;
                            const start = chunkIndex * UPLOAD_CHUNK_SIZE;
                            const end = Math.min(file.size, start + UPLOAD_CHUNK_SIZE);
                            const buffer = await readChunk(file, start, end);

                            await uploadChunkRequest(uploadId, chunkIndex, buffer);
                            uploadedChunkSet.add(chunkIndex);

                            const progress = Math.min(95, Math.round((uploadedChunkSet.size / totalChunks) * 95));
                            dispatch({
                                type: 'UPLOAD_PROGRESS',
                                payload: {
                                    id: uploadId,
                                    progress,
                                    status: 'uploading',
                                    uploadedChunks: [...uploadedChunkSet],
                                    totalChunks,
                                },
                            });
                        }
                    });

                    await Promise.all(workers);
                }

                dispatch({
                    type: 'UPLOAD_PROGRESS',
                    payload: {
                        id: uploadId,
                        progress: 97,
                        status: 'deduplicating',
                        uploadedChunks: [...uploadedChunkSet],
                        totalChunks,
                    },
                });

                const data = await completeChunkedUpload(uploadId, file.name, parentId, totalChunks);

                dispatch({
                    type: 'UPLOAD_PROGRESS',
                    payload: {
                        id: uploadId,
                        progress: 100,
                        status: 'complete',
                        uploadedChunks: [...uploadedChunkSet],
                        totalChunks,
                    },
                });

                setTimeout(() => {
                    dispatch({ type: 'UPLOAD_COMPLETE', payload: { id: uploadId, file: data.file } });
                    void Promise.all([fetchFiles(), fetchRecommended(), fetchStats()]);
                }, 400);
            } catch (error) {
                const uploadedChunks = [...uploadedChunkSet];
                const isRecoverable = error.message !== 'Upload finalization failed';

                dispatch({
                    type: isRecoverable ? 'UPLOAD_PAUSED' : 'UPLOAD_FAILED',
                    payload: {
                        id: uploadId,
                        error: error.message,
                        progress: Math.min(95, Math.round((uploadedChunkSet.size / totalChunks) * 95)),
                        uploadedChunks,
                    },
                });
            }
        })();

        return uploadId;
    }, [completeChunkedUpload, dispatch, fetchStats, readChunk, state.currentFolderId, uploadChunkRequest]);

    const simulateUpload = useCallback((file) => startOptimizedUpload(file), [startOptimizedUpload]);

    const resumeUpload = useCallback(async (uploadId) => {
        const session = state.uploads.find((upload) => upload.id === uploadId);
        if (!session?.file) {
            throw new Error('Upload session is missing file data');
        }

        return startOptimizedUpload(session.file, session);
    }, [startOptimizedUpload, state.uploads]);

    const restoreVersion = useCallback(async (fileId, versionNumber) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/files/${fileId}/restore-version/${versionNumber}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                dispatch({ type: 'RESTORE_VERSION_SUCCESS', payload: { fileId, file: data.file } });
                fetchVersions(fileId);
            }
        } catch (error) {
            console.error('Restore version failed', error);
        }
    }, [fetchVersions]);

    const summarizeFile = useCallback(async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/files/${fileId}/summarize`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Failed to summarize');
            }
            const data = await res.json();
            return data.summary;
        } catch (error) {
            console.error('AI Summarization failed', error);
            throw error;
        }
    }, []);

    const deleteFile = moveToTrash;

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
                shareFile,
                moveToTrash,
                restoreFromTrash,
                permanentDelete,
                restoreVersion,
                deleteFile,
                fetchFiles,
                fetchRecommended,
                fetchTrash,
                summarizeFile
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
