import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('All fields are required');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
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
          <p>Welcome back — sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <HiOutlineMail className="auth-field-icon" />
            <input
              id="login-email" type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus
            />
          </div>
          <div className="auth-field">
            <HiOutlineLockClosed className="auth-field-icon" />
            <input
              id="login-password" type={showPwd ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            <button type="button" className="auth-eye" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
            </button>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
