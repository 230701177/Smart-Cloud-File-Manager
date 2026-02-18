import { createContext, useContext, useState, useCallback } from 'react';
import { mockUsers } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setIsLoading(true);
        setError(null);
        // Simulate network delay
        await new Promise((r) => setTimeout(r, 1000));
        const user = mockUsers.find((u) => u.email === email && u.password === password);
        if (user) {
            const { password: _, ...safeUser } = user;
            setCurrentUser(safeUser);
            setIsLoading(false);
            return true;
        } else {
            setError('Invalid email or password');
            setIsLoading(false);
            return false;
        }
    }, []);

    const register = useCallback(async (name, email, password) => {
        setIsLoading(true);
        setError(null);
        await new Promise((r) => setTimeout(r, 1200));
        const exists = mockUsers.find((u) => u.email === email);
        if (exists) {
            setError('Email already registered');
            setIsLoading(false);
            return false;
        }
        const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            role: 'user',
            avatar: null,
            storageQuota: 5368709120,
            storageUsed: 0,
        };
        setCurrentUser(newUser);
        setIsLoading(false);
        return true;
    }, []);

    const logout = useCallback(() => {
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
