import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function LoginPage() {
    const [email, setEmail] = useState('mano@smartcloud.io');
    const [password, setPassword] = useState('password123');
    const [showPass, setShowPass] = useState(false);
    const { login, isLoading, error, setError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) { setError('Please fill all fields'); return; }
        const success = await login(email, password);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-page__brand">
                <div className="auth-brand__content">
                    <div className="auth-brand__logo">
                        <Cloud size={40} />
                    </div>
                    <h1 className="auth-brand__title">Smart Cloud<br />File Manager</h1>
                    <p className="auth-brand__subtitle">
                        Intelligent deduplication. Version control. Safe deletions.
                        Your files, optimized.
                    </p>
                    <div className="auth-brand__features">
                        <div className="auth-brand__feature">
                            <div className="auth-brand__feature-dot" style={{ background: '#34d399' }} />
                            <span>SHA-256 Deduplication</span>
                        </div>
                        <div className="auth-brand__feature">
                            <div className="auth-brand__feature-dot" style={{ background: '#60a5fa' }} />
                            <span>Version History</span>
                        </div>
                        <div className="auth-brand__feature">
                            <div className="auth-brand__feature-dot" style={{ background: '#fbbf24' }} />
                            <span>Safe Delete with RefCount</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-page__form-side">
                <form className="auth-form animate-fade-in-up" onSubmit={handleSubmit}>
                    <div className="auth-form__header">
                        <h2>Welcome back</h2>
                        <p className="text-secondary">Sign in to your account</p>
                    </div>

                    {error && <div className="auth-form__error">{error}</div>}

                    <div className="input-group">
                        <label>Email</label>
                        <div className="auth-input-wrap">
                            <Mail size={16} className="auth-input-icon" />
                            <input
                                type="email" className="input auth-input-with-icon"
                                placeholder="you@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="auth-input-wrap">
                            <Lock size={16} className="auth-input-icon" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="input auth-input-with-icon"
                                placeholder="••••••••"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-form__options">
                        <label className="auth-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm">Remember me</span>
                        </label>
                        <a href="#" className="text-sm auth-link">Forgot password?</a>
                    </div>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
                    </button>

                    <p className="auth-form__footer text-sm text-secondary">
                        Don't have an account? <Link to="/register" className="auth-link">Create one</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
