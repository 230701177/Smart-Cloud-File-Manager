import {
    Files, HardDrive, TrendingDown, GitBranch,
    FileText, Image, Video, Code, Presentation, Package,
    Star, Clock, Download, MoreVertical
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { formatBytes, formatDate, getFileColor } from '../utils/helpers';
import './DashboardPage.css';

const typeIcons = {
    pdf: FileText, document: FileText, spreadsheet: FileText,
    image: Image, video: Video, presentation: Presentation,
    code: Code, design: Package, other: Files,
};

export default function DashboardPage() {
    const { getStats, getRecentFiles, dispatch } = useFiles();
    const stats = getStats();
    const recentFiles = getRecentFiles();

    const statCards = [
        { label: 'Total Files', value: stats.totalFiles, icon: Files, color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
        { label: 'Storage Used', value: formatBytes(stats.totalStorageUsed), icon: HardDrive, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
        { label: 'Space Saved', value: formatBytes(stats.storageSaved), icon: TrendingDown, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
        { label: 'Versions Tracked', value: stats.totalVersions, icon: GitBranch, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    ];

    const breakdownItems = [
        { label: 'Documents', size: stats.storageBreakdown.documents, color: '#4285f4' },
        { label: 'Images', size: stats.storageBreakdown.images, color: '#ff6d01' },
        { label: 'Videos', size: stats.storageBreakdown.videos, color: '#fbbc04' },
        { label: 'Presentations', size: stats.storageBreakdown.presentations, color: '#ea4335' },
        { label: 'Code', size: stats.storageBreakdown.code, color: '#00bcd4' },
        { label: 'Other', size: stats.storageBreakdown.other, color: '#9e9e9e' },
    ];

    const maxBreakdown = Math.max(...breakdownItems.map((b) => b.size));

    return (
        <div className="dashboard animate-fade-in">
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">Dashboard</h1>
                    <p className="text-secondary text-sm">Overview of your cloud storage</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="dashboard__stats grid-4">
                {statCards.map((s) => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-card__icon" style={{ background: s.bg, color: s.color }}>
                            <s.icon size={22} />
                        </div>
                        <div className="stat-card__info">
                            <span className="stat-card__value">{s.value}</span>
                            <span className="stat-card__label">{s.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard__grid">
                {/* Storage Breakdown */}
                <div className="card dashboard__breakdown">
                    <h3 className="dashboard__section-title">Storage Breakdown</h3>
                    <div className="breakdown__list">
                        {breakdownItems.map((item) => (
                            <div key={item.label} className="breakdown__item">
                                <div className="breakdown__item-header">
                                    <div className="flex items-center gap-2">
                                        <div className="breakdown__dot" style={{ background: item.color }} />
                                        <span className="text-sm">{item.label}</span>
                                    </div>
                                    <span className="text-sm text-secondary">{formatBytes(item.size)}</span>
                                </div>
                                <div className="breakdown__bar">
                                    <div
                                        className="breakdown__bar-fill"
                                        style={{ width: `${(item.size / maxBreakdown) * 100}%`, background: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="breakdown__summary">
                        <div className="breakdown__summary-item">
                            <span className="text-xs text-tertiary">Total Chunks</span>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{stats.totalChunks}</span>
                        </div>
                        <div className="breakdown__summary-item">
                            <span className="text-xs text-tertiary">Unique Chunks</span>
                            <span className="text-sm" style={{ fontWeight: 600 }}>{stats.uniqueChunks}</span>
                        </div>
                        <div className="breakdown__summary-item">
                            <span className="text-xs text-tertiary">Duplicates Avoided</span>
                            <span className="text-sm" style={{ fontWeight: 600, color: 'var(--color-success)' }}>{stats.duplicatesAvoided}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Files */}
                <div className="card dashboard__recent">
                    <h3 className="dashboard__section-title">Recent Files</h3>
                    <div className="recent__list">
                        {recentFiles.map((file) => {
                            const Icon = typeIcons[file.type] || Files;
                            return (
                                <div
                                    key={file.id}
                                    className="recent__item"
                                    onClick={() => dispatch({ type: 'SELECT_FILE', payload: file })}
                                >
                                    <div className="recent__item-icon" style={{ color: getFileColor(file.type) }}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="recent__item-info">
                                        <span className="recent__item-name truncate">{file.name}</span>
                                        <span className="text-xs text-tertiary">{formatBytes(file.size)} · {formatDate(file.modifiedAt)}</span>
                                    </div>
                                    <div className="recent__item-actions">
                                        {file.starred && <Star size={14} fill="var(--color-warning)" color="var(--color-warning)" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
