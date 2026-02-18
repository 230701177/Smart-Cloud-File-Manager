import { useState } from 'react';
import {
    User, Mail, Shield, HardDrive, Sun, Moon, Bell, BellOff,
    Lock, Smartphone, Laptop, LogOut, Trash2, Cpu, Zap, RefreshCw, ChevronRight, AlertTriangle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFiles } from '../contexts/FileContext';
import { formatBytes } from '../utils/helpers';
import './SettingsPage.css';

export default function SettingsPage() {
    const { currentUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { getStats } = useFiles();
    const stats = getStats();
    const quota = 10 * 1024 * 1024 * 1024;
    const usedPercent = Math.round((stats.totalStorageUsed / quota) * 100);

    // Interactive States
    const [notifications, setNotifications] = useState({
        uploads: true,
        dedup: true,
        storage: false
    });
    const [is2faEnabled, setIs2faEnabled] = useState(false);
    const [sessions, setSessions] = useState([
        { id: 1, device: 'iPhone 15 Pro', location: 'Chennai, India', time: 'Active now', icon: Smartphone, current: true },
        { id: 2, device: 'MacBook Pro 14"', location: 'Chennai, India', time: '2 hours ago', icon: Laptop, current: false }
    ]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const toggleNotification = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const removeSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const handleAction = (label) => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 2000); // Simulate network request
    };

    return (
        <div className="settings animate-fade-in">
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginBottom: 'var(--sp-1)' }}>Settings</h1>
            <p className="text-secondary text-sm" style={{ marginBottom: 'var(--sp-6)' }}>Manage your preferences</p>

            <div className="settings__grid">
                <div className="card settings__profile">
                    <div className="settings__profile-avatar">{currentUser?.name?.charAt(0) || 'U'}</div>
                    <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 600 }}>{currentUser?.name}</h3>
                    <div className="settings__profile-meta">
                        <div className="settings__meta-item"><Mail size={14} /> {currentUser?.email}</div>
                        <div className="settings__meta-item"><Shield size={14} /> <span className="badge badge-primary">{currentUser?.role}</span></div>
                    </div>
                </div>

                <div className="card settings__storage-card">
                    <h3 className="settings__section-title"><HardDrive size={16} /> Storage Quota</h3>
                    <div className="settings__storage-visual">
                        <div className="settings__quota-ring">
                            <svg viewBox="0 0 100 100" className="settings__ring-svg">
                                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#grad)" strokeWidth="8"
                                    strokeDasharray={`${usedPercent * 2.64} ${264 - usedPercent * 2.64}`}
                                    strokeDashoffset="66" strokeLinecap="round" />
                                <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6c63ff" /><stop offset="100%" stopColor="#a78bfa" />
                                </linearGradient></defs>
                            </svg>
                            <div className="settings__ring-label">
                                <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{usedPercent}%</span>
                                <span className="text-xs text-tertiary">Used</span>
                            </div>
                        </div>
                        <div className="settings__quota-details">
                            <div className="settings__quota-row"><span className="text-sm text-secondary">Used</span><span className="text-sm" style={{ fontWeight: 600 }}>{formatBytes(stats.totalStorageUsed)}</span></div>
                            <div className="settings__quota-row"><span className="text-sm text-secondary">Saved (Dedup)</span><span className="text-sm" style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatBytes(stats.storageSaved)}</span></div>
                            <div className="settings__quota-row"><span className="text-sm text-secondary">Total Quota</span><span className="text-sm" style={{ fontWeight: 600 }}>{formatBytes(quota)}</span></div>
                            <div className="settings__linear-progress">
                                <div
                                    className="settings__linear-fill"
                                    style={{
                                        width: `${usedPercent}%`,
                                        background: usedPercent > 90 ? 'var(--color-danger)' : usedPercent > 70 ? 'var(--color-warning)' : 'var(--color-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="settings__section-title">{theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Appearance</h3>
                    <div className="settings__toggle-row">
                        <div><span className="text-sm" style={{ fontWeight: 500 }}>Dark Mode</span><p className="text-xs text-tertiary">Toggle between dark and light themes</p></div>
                        <button className={`settings__switch ${theme === 'dark' ? 'settings__switch--on' : ''}`} onClick={toggleTheme}>
                            <div className="settings__switch-knob" />
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="settings__section-title"><Bell size={16} /> Notifications</h3>
                    <div className="settings__toggle-row">
                        <div><span className="text-sm" style={{ fontWeight: 500 }}>Upload Notifications</span><p className="text-xs text-tertiary">Get notified when uploads complete</p></div>
                        <button
                            className={`settings__switch ${notifications.uploads ? 'settings__switch--on' : ''}`}
                            onClick={() => toggleNotification('uploads')}
                        >
                            <div className="settings__switch-knob" />
                        </button>
                    </div>
                    <div className="settings__toggle-row">
                        <div><span className="text-sm" style={{ fontWeight: 500 }}>Dedup Alerts</span><p className="text-xs text-tertiary">Alert when duplicates are detected</p></div>
                        <button
                            className={`settings__switch ${notifications.dedup ? 'settings__switch--on' : ''}`}
                            onClick={() => toggleNotification('dedup')}
                        >
                            <div className="settings__switch-knob" />
                        </button>
                    </div>
                    <div className="settings__toggle-row">
                        <div><span className="text-sm" style={{ fontWeight: 500 }}>Storage Warnings</span><p className="text-xs text-tertiary">Warn when storage exceeds 80%</p></div>
                        <button
                            className={`settings__switch ${notifications.storage ? 'settings__switch--on' : ''}`}
                            onClick={() => toggleNotification('storage')}
                        >
                            <div className="settings__switch-knob" />
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="settings__section-title"><Lock size={16} /> Security</h3>
                    <div className="settings__toggle-row">
                        <div>
                            <span className="text-sm" style={{ fontWeight: 500 }}>Two-Factor Authentication (2FA)</span>
                            <p className="text-xs text-tertiary">Add an extra layer of security to your account</p>
                        </div>
                        <button
                            className={`settings__switch ${is2faEnabled ? 'settings__switch--on' : ''}`}
                            onClick={() => setIs2faEnabled(!is2faEnabled)}
                        >
                            <div className="settings__switch-knob" />
                        </button>
                    </div>

                    {is2faEnabled && (
                        <div className="settings__reveal-info animate-fade-in">
                            <div className="settings__opt-item" style={{ background: 'var(--color-bg)', border: '1px dashed var(--color-primary)' }}>
                                <div className="settings__opt-detail">
                                    <span className="text-xs text-tertiary uppercase fw-bold">Recovery Codes</span>
                                    <span className="text-sm font-code" style={{ letterSpacing: '2px', color: 'var(--color-primary)' }}>XXXX-XXXX-XXXX-XXXX</span>
                                </div>
                                <Zap size={14} className="text-primary" />
                            </div>
                            <p className="text-xs text-tertiary mt-2">Save these codes in a safe place. They allow you to access your account if you lose your device.</p>
                        </div>
                    )}

                    <div className="sidebar__divider" style={{ margin: 'var(--sp-4) 0' }} />

                    <div className="settings__sessions-list">
                        {sessions.map(session => (
                            <div key={session.id} className="settings__session-item">
                                <div className="settings__session-icon"><session.icon size={16} /></div>
                                <div className="settings__session-info">
                                    <span className="text-sm" style={{ fontWeight: 500 }}>{session.device}</span>
                                    <span className="text-xs text-tertiary">{session.location} • {session.time}</span>
                                </div>
                                {session.current ? (
                                    <span className="badge badge-primary">Current</span>
                                ) : (
                                    <button className="btn-icon text-tertiary" onClick={() => removeSession(session.id)}><LogOut size={14} /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card settings__account-card">
                    <h3 className="settings__section-title"><User size={16} /> Account Management</h3>
                    <button className="settings__action-row" onClick={() => handleAction('Password')}>
                        <div className="settings__action-left">
                            <div className="settings__action-icon-wrapper"><Lock size={16} /></div>
                            <div className="settings__action-info">
                                <span className="text-sm" style={{ fontWeight: 500 }}>Change Password</span>
                                <p className="text-xs text-tertiary">Update your password regularly</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-tertiary" />
                    </button>
                    <button className="settings__action-row" onClick={() => handleAction('Logout All')}>
                        <div className="settings__action-left">
                            <div className="settings__action-icon-wrapper" style={{ color: 'var(--color-danger)', background: 'var(--color-danger-subtle)' }}><LogOut size={16} /></div>
                            <div className="settings__action-info">
                                <span className="text-sm" style={{ fontWeight: 500 }}>Logout from all sessions</span>
                                <p className="text-xs text-tertiary">Sign out of every device instantly</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-tertiary" />
                    </button>
                    {isSaving && <div className="text-xs text-primary mt-3 flex items-center gap-2 animate-pulse"><RefreshCw size={12} /> Processing request...</div>}
                </div>

                <div className="card settings__dedup-card">
                    <h3 className="settings__section-title"><Cpu size={16} /> Storage Optimization</h3>
                    <div className="settings__optimization-grid">
                        <div className="settings__opt-item">
                            <div className="settings__opt-icon" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}><Zap size={18} /></div>
                            <div className="settings__opt-detail">
                                <span className="settings__opt-value">{Math.round((stats.storageSaved / (stats.totalStorageUsed + stats.storageSaved)) * 100)}%</span>
                                <span className="settings__opt-label">Dedup Ratio</span>
                            </div>
                        </div>
                        <div className="settings__opt-item">
                            <div className="settings__opt-icon" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}><RefreshCw size={18} /></div>
                            <div className="settings__opt-detail">
                                <span className="settings__opt-value">{stats.duplicatesAvoided}</span>
                                <span className="settings__opt-label">Reused Chunks</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-tertiary" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
                        Our hashing engine has saved you <strong>{formatBytes(stats.storageSaved)}</strong> by avoiding redundant storage.
                    </p>
                </div>

                <div className="card settings__danger-card">
                    <h3 className="settings__section-title text-danger"><AlertTriangle size={16} /> Danger Zone</h3>
                    <div className="settings__toggle-row" style={{ borderBottom: 'none' }}>
                        <div>
                            <span className="text-sm" style={{ fontWeight: 500, color: 'var(--color-danger)' }}>Delete Account</span>
                            <p className="text-xs text-tertiary">Permanently delete your account and all data</p>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>Delete</button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header">
                            <h3 className="text-danger flex items-center gap-2"><AlertTriangle size={20} /> Delete Account</h3>
                            <button className="btn-icon" onClick={() => setShowDeleteModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-sm text-secondary mb-4">
                                This action is <strong>irreversible</strong>. This will permanently delete your profile, files, and all associated metadata.
                            </p>
                            <label className="text-xs text-tertiary mb-1 block">To confirm, type <strong className="text-primary">DELETE</strong> in the box below:</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="TYPE DELETE"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button
                                className="btn btn-danger"
                                disabled={deleteConfirmText !== 'DELETE'}
                                onClick={() => { alert('Account deletion simulated!'); setShowDeleteModal(false); }}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

