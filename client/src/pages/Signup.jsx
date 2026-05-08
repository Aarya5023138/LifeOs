import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('All fields are required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPwd) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await signup(name, email, password);
      toast.success('Account created! Welcome to LifeOS 🚀');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon"><HiOutlineLightningBolt /></div>
          <h1>LifeOS</h1>
          <p>Create your account to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <HiOutlineUser className="auth-field-icon" />
            <input
              id="signup-name" type="text" placeholder="Full name"
              value={name} onChange={e => setName(e.target.value)} autoFocus
            />
          </div>
          <div className="auth-field">
            <HiOutlineMail className="auth-field-icon" />
            <input
              id="signup-email" type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <HiOutlineLockClosed className="auth-field-icon" />
            <input
              id="signup-password" type={showPwd ? 'text' : 'password'} placeholder="Password (min 6 chars)"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <button type="button" className="auth-eye" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
            </button>
          </div>
          <div className="auth-field">
            <HiOutlineLockClosed className="auth-field-icon" />
            <input
              id="signup-confirm" type={showPwd ? 'text' : 'password'} placeholder="Confirm password"
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
