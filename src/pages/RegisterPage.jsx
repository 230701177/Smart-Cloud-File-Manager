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

    const [isSuccess, setIsSuccess] = useState(false);

    const [showTerms, setShowTerms] = useState(false);
    const [hasViewedTerms, setHasViewedTerms] = useState(false);

    const openTerms = () => {
        setShowTerms(true);
        setHasViewedTerms(true);
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!name || !email || !password || !confirm) { setError('Please fill all fields'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (!agreed) { setError('Please agree to the terms'); return; }
        const success = await register(name, email, password);
        if (success) {
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


                        <h2>Vault Created</h2>
                        <p>Setting up your secure environment...</p>
                    </div>
                </div>
            )}
            <div className="auth-page__brand">

                <div className="auth-brand__content">
                    <div className="auth-brand__logo"><img src="/cloud-light.png" alt="CloudFM" /></div>

                    <div className="auth-brand__tagline">Intelligence Defined</div>
                    <p className="auth-brand__desc">
                        Experience the next generation of cloud storage with smart deduplication and versioning.
                    </p>




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

                    <label className={`auth-checkbox clay-checkbox ${!hasViewedTerms ? 'checkbox-disabled' : ''}`}>
                        <input 
                            type="checkbox" 
                            checked={agreed} 
                            disabled={!hasViewedTerms}
                            onChange={(e) => setAgreed(e.target.checked)} 
                        />
                        <span className="checkbox-box" />
                        <span className="text-sm">
                            I agree to the <span className="auth-link" onClick={openTerms}>Terms of Service</span>
                        </span>
                    </label>



                    <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                        {isLoading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
                    </button>

                    <p className="auth-form__footer text-sm text-secondary">
                        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>
                </form>
            </div>
            {showTerms && (
                <div className="modal-overlay" onClick={() => setShowTerms(false)}>
                    <div className="modal-content terms-modal animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Terms of Service</h3>
                            <button className="btn-icon" onClick={() => setShowTerms(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="terms-content">
                                <h4>Our Commitment to Security</h4>
                                <p>By using Smart Cloud File Manager, you access our advanced deduplication and versioning systems.</p>
                                
                                <div className="terms-feature-grid">
                                    <div className="terms-feature">
                                        <h5>Smart Chunking</h5>
                                        <p>Data is broken into unique chunks identified by SHA-256 hashes for maximum efficiency.</p>
                                    </div>
                                    <div className="terms-feature">
                                        <h5>Privacy First</h5>
                                        <p>Your files are yours. We use reference counting to ensure data is only deleted when no user needs it.</p>
                                    </div>
                                </div>

                                <p>By creating an account, you agree to follow our acceptable use policy and security guidelines.</p>
                                <p>Failure to comply may result in account suspension to protect the integrity of the storage cloud.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={() => setShowTerms(false)}>I Understand</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

