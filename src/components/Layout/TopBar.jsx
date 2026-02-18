import { Search, Upload, Bell, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFiles } from '../../contexts/FileContext';
import { mockNotifications } from '../../data/mockData';
import { formatDate } from '../../utils/helpers';
import './TopBar.css';

export default function TopBar({ onMobileMenuToggle }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { dispatch, searchQuery } = useFiles();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const userMenuRef = useRef(null);
    const notifRef = useRef(null);
    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    useEffect(() => {
        function handleClick(e) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="topbar">
            <div className="topbar__left">
                <button className="btn-icon topbar__mobile-menu" onClick={onMobileMenuToggle}>
                    <Menu size={20} />
                </button>
                <div className="topbar__search">
                    <Search size={18} className="topbar__search-icon" />
                    <input
                        type="text"
                        placeholder="Search files and folders..."
                        value={searchQuery}
                        onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
                        className="topbar__search-input"
                    />
                </div>
            </div>

            <div className="topbar__right">
                <button
                    className="btn-primary btn topbar__upload-btn"
                    onClick={() => dispatch({ type: 'TOGGLE_UPLOAD_MODAL' })}
                >
                    <Upload size={16} />
                    <span className="hide-mobile">Upload</span>
                </button>

                <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="topbar__notif-wrapper" ref={notifRef}>
                    <button className="btn-icon topbar__notif-btn" onClick={() => setShowNotifs(!showNotifs)}>
                        <Bell size={18} />
                        {unreadCount > 0 && <span className="topbar__notif-dot" />}
                    </button>
                    {showNotifs && (
                        <div className="topbar__dropdown topbar__notif-dropdown animate-fade-in-up">
                            <div className="topbar__dropdown-header">
                                <span className="text-sm" style={{ fontWeight: 600 }}>Notifications</span>
                                <span className="badge badge-primary">{unreadCount} new</span>
                            </div>
                            {mockNotifications.map((n) => (
                                <div key={n.id} className={`topbar__notif-item ${!n.read ? 'topbar__notif-item--unread' : ''}`}>
                                    <p className="text-sm">{n.message}</p>
                                    <span className="text-xs text-tertiary">{formatDate(n.time)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="topbar__user-wrapper" ref={userMenuRef}>
                    <button className="topbar__user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="topbar__avatar">
                            {currentUser?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="topbar__user-name hide-mobile">{currentUser?.name || 'User'}</span>
                    </button>
                    {showUserMenu && (
                        <div className="topbar__dropdown animate-fade-in-up">
                            <div className="topbar__dropdown-header">
                                <div className="topbar__avatar topbar__avatar--lg">
                                    {currentUser?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{currentUser?.name}</p>
                                    <p className="text-xs text-secondary">{currentUser?.email}</p>
                                </div>
                            </div>
                            <div className="topbar__dropdown-divider" />

                            <button className="topbar__dropdown-item topbar__dropdown-item--danger" onClick={logout}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
