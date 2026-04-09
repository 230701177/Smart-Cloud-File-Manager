import { useState, useEffect } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { Cloud, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';


export default function LoginPage() {
    const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberedEmail'));
    const [showPass, setShowPass] = useState(false);
    const { login, isLoading, error, setError } = useAuth();

    const navigate = useNavigate();

    const [isSuccess, setIsSuccess] = useState(false);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) { setError('Please fill all fields'); return; }
        
        const success = await login(email, password);
        if (success) {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            setIsSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1200);
        }
    };



    return (
        <div className="auth-page" data-theme="light">
            {isSuccess && (
                <div className="auth-success-overlay">
                    <div className="auth-success-content animate-expand">
                        <div className="auth-success-icon">
                            <img src="/cloud-light.png" alt="CloudFM" style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
                        </div>


                        <h2>Identity Verified</h2>
                        <p>Accessing your cloud vault...</p>
                    </div>
                </div>
            )}
            <div className="auth-page__brand">

                <div className="auth-brand__content">
                    <div className="auth-brand__logo">
                        <img src="/cloud-light.png" alt="CloudFM" />
                    </div>

                    <div className="auth-brand__tagline">Intelligence Defined</div>
                    <p className="auth-brand__desc">
                        Experience the next generation of cloud storage with smart deduplication and versioning.
                    </p>



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
                        <label className="auth-checkbox clay-checkbox">
                            <input 
                                type="checkbox" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                            />
                            <span className="checkbox-box" />
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
