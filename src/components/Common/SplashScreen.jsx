import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './SplashScreen.css';

const SplashScreen = () => {
    const [cachedUser, setCachedUser] = useState(null);
    const { theme } = useTheme();

    useEffect(() => {
        const session = localStorage.getItem('smart_cloud_user_session');
        if (session) {
            try {
                setCachedUser(JSON.parse(session));
            } catch (e) {
                console.error("Failed to parse user session", e);
            }
        }
    }, []);

    return (
        <div className="splash-screen" data-theme={theme}>
            <div className="splash-content">
                <div className="splash-logo-container">
                    <div className="splash-brand-logo">
                        <img 
                            src={theme === 'dark' ? '/cloud-dark.png' : '/cloud-light.png'} 
                            alt="CloudFM" 
                        />
                    </div>
                </div>
                <div className="splash-text">
                    <h1 className="splash-title">CloudFM</h1>
                    <p className="splash-tagline">Intelligence Defined</p>
                    <div className="splash-welcome">
                        {cachedUser ? (
                            <>
                                Welcome back, <span className="splash-user-info">{cachedUser.name || cachedUser.email.split('@')[0]}</span>
                            </>
                        ) : (
                            "Accessing your cloud vault..."
                        )}
                    </div>
                </div>
                <div className="splash-loader">
                    <div className="splash-dot"></div>
                    <div className="splash-dot"></div>
                    <div className="splash-dot"></div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
