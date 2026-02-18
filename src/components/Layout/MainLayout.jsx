import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

export default function MainLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={`main-layout ${collapsed ? 'main-layout--collapsed' : ''}`}>
            <Sidebar
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />
            {mobileMenuOpen && (
                <div className="sidebar--overlay show" onClick={() => setMobileMenuOpen(false)} />
            )}
            <div className="main-layout__content">
                <TopBar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
                <main className="main-layout__page">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
