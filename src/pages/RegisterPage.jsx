import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const { register, isLoading, error, setError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!name || !email || !password || !confirm) { setError('Please fill all fields'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (!agreed) { setError('Please agree to the terms'); return; }
        const success = await register(name, email, password);
        if (success) navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-page__brand">
                <div className="auth-brand__content">
                    <div className="auth-brand__logo"><Cloud size={40} /></div>
                    <h1 className="auth-brand__title">Smart Cloud<br />File Manager</h1>
                    <p className="auth-brand__subtitle">
                        Join the smart storage revolution. Deduplicate, version, and manage your files efficiently.
                    </p>
                    <div className="auth-brand__stats">
                        <div className="auth-brand__stat">
                            <span className="auth-brand__stat-value">50%</span>
                            <span className="auth-brand__stat-label">Avg. Space Saved</span>
                        </div>
                        <div className="auth-brand__stat">
                            <span className="auth-brand__stat-value">SHA-256</span>
                            <span className="auth-brand__stat-label">Hash Algorithm</span>
                        </div>
                        <div className="auth-brand__stat">
                            <span className="auth-brand__stat-value">∞</span>
                            <span className="auth-brand__stat-label">Version History</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-page__form-side">
                <form className="auth-form animate-fade-in-up" onSubmit={handleSubmit}>
                    <div className="auth-form__header">
                        <h2>Create account</h2>
                        <p className="text-secondary">Start managing files smarter</p>
                    </div>

                    {error && <div className="auth-form__error">{error}</div>}

                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="auth-input-wrap">
                            <User size={16} className="auth-input-icon" />
                            <input type="text" className="input auth-input-with-icon" placeholder="John Doe"
                                value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <div className="auth-input-wrap">
                            <Mail size={16} className="auth-input-icon" />
                            <input type="email" className="input auth-input-with-icon" placeholder="you@example.com"
                                value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="auth-input-wrap">
                            <Lock size={16} className="auth-input-icon" />
                            <input type={showPass ? 'text' : 'password'} className="input auth-input-with-icon"
                                placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirm Password</label>
                        <div className="auth-input-wrap">
                            <Lock size={16} className="auth-input-icon" />
                            <input type="password" className="input auth-input-with-icon" placeholder="••••••••"
                                value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                        </div>
                    </div>

                    <label className="auth-checkbox">
                        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                        <span className="text-sm">I agree to the Terms of Service</span>
                    </label>

                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
                    </button>

                    <p className="auth-form__footer text-sm text-secondary">
                        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
