import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const initializeAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data.user);
                localStorage.setItem('smart_cloud_user_session', JSON.stringify({
                    name: data.user.name,
                    email: data.user.email
                }));
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('smart_cloud_user_session');
                setCurrentUser(null);
            }
        } catch (err) {
            localStorage.removeItem('token');
            setCurrentUser(null);
            console.error('Auth check failed', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = useCallback(async (email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                setCurrentUser(data.user);
                localStorage.setItem('smart_cloud_user_session', JSON.stringify({
                    name: data.user.name,
                    email: data.user.email
                }));
                setIsLoading(false);
                return true;
            } else {
                setError(data.error || 'Login failed');
                setIsLoading(false);
                return false;
            }
        } catch (err) {
            setError('Network error');
            setIsLoading(false);
            return false;
        }
    }, []);

    const register = useCallback(async (name, email, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                setCurrentUser(data.user);
                localStorage.setItem('smart_cloud_user_session', JSON.stringify({
                    name: data.user.name,
                    email: data.user.email
                }));
                setIsLoading(false);
                return true;
            } else {
                setError(data.error || 'Registration failed');
                setIsLoading(false);
                return false;
            }
        } catch (err) {
            setError('Network error');
            setIsLoading(false);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('smart_cloud_user_session');
        setCurrentUser(null);
    }, []);

    const updateProfile = useCallback((updates) => {
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, error, login, register, logout, updateProfile, setError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
