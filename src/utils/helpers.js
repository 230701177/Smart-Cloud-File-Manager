export function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getFileIcon(type) {
    const icons = {
        pdf: 'FileText', document: 'FileText', spreadsheet: 'Sheet',
        image: 'Image', video: 'Video', audio: 'Music',
        presentation: 'Presentation', code: 'Code', design: 'Palette',
        archive: 'Archive', other: 'File',
    };
    return icons[type] || 'File';
}

export function getFileColor(type) {
    const colors = {
        pdf: '#ea4335', document: '#4285f4', spreadsheet: '#34a853',
        image: '#ff6d01', video: '#fbbc04', audio: '#ab47bc',
        presentation: '#ff6d01', code: '#00bcd4', design: '#e91e63',
        archive: '#795548', other: '#9e9e9e',
    };
    return colors[type] || '#9e9e9e';
}
