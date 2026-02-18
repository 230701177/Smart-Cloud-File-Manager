import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FolderOpen, Star, Share2, Trash2,
    Settings, Cloud, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useFiles } from '../../contexts/FileContext';
import { formatBytes } from '../../utils/helpers';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/files', icon: FolderOpen, label: 'My Files' },
    { path: '/starred', icon: Star, label: 'Starred' },
    { path: '/shared', icon: Share2, label: 'Shared' },
    { path: '/trash', icon: Trash2, label: 'Trash' },
];

export default function Sidebar({ isOpen, onClose, collapsed, setCollapsed }) {
    const { getStats, trash } = useFiles();
    const stats = getStats();
    const location = useLocation();
    const usedPercent = Math.round((stats.totalStorageUsed / (10 * 1024 * 1024 * 1024)) * 100);

    const handleLinkClick = () => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    };

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${isOpen ? 'sidebar--mobile-open' : ''}`}>
            <div className="sidebar__header">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-icon">
                        <Cloud size={22} />
                    </div>
                    {!collapsed && <span className="sidebar__logo-text">CloudFM</span>}
                </div>
                <button className="btn-icon sidebar__toggle hide-mobile" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            <nav className="sidebar__nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                        title={collapsed ? item.label : undefined}
                        onClick={handleLinkClick}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.path === '/trash' && trash.length > 0 && (
                            <span className="sidebar__badge">{trash.length}</span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__divider" />

            <div className="sidebar__bottom">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                    title={collapsed ? 'Settings' : undefined}
                    onClick={handleLinkClick}
                >
                    <Settings size={20} />
                    {!collapsed && <span>Settings</span>}
                </NavLink>

                {!collapsed && (
                    <div className="sidebar__storage">
                        <div className="sidebar__storage-header">
                            <span className="text-xs text-secondary">Storage</span>
                            <span className="text-xs text-secondary">{usedPercent}%</span>
                        </div>
                        <div className="sidebar__storage-bar">
                            <div
                                className="sidebar__storage-fill"
                                style={{ width: `${usedPercent}%` }}
                            />
                        </div>
                        <span className="text-xs text-tertiary">
                            {formatBytes(stats.totalStorageUsed)} of 10 GB used
                        </span>
                    </div>
                )}
            </div>
        </aside>
    );
}
