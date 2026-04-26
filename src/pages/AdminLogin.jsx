import React, { useState, useContext } from 'react';
import { Shield, Key, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { loginAPI, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_ROLES = ['Master Admin', 'Local Sarpanch', 'Talathi', 'Tahsildar', 'Block Development Officer', 'Sub-Divisional Magistrate', 'District Collector'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAPI(email, password);
      if (res.success) {
        if (ADMIN_ROLES.includes(res.user.role)) {
          navigate('/admin');
        } else {
          logout();
          setError('Access denied. This portal is for government officials only.');
        }
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Make sure the backend server is running.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="citizen-page submit-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel form-slide-in" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', marginBottom: '24px' }}>
          <Shield size={32} color="var(--accent-primary)" />
        </div>
        
        <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Admin Portal Login</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>Access Government Dashboard</p>

        {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '16px', fontSize: '0.875rem', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', paddingLeft: '12px', fontSize: '1rem', height: '48px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', paddingLeft: '12px', fontSize: '1rem', height: '48px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
              placeholder="Enter password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={loading}>
            {loading ? 'Logging in...' : <><LogIn size={18} /> Login</>}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Demo Credentials:</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Email: admin@civora.local</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Password: admin123</p>
          <button onClick={() => navigate('/')} className="btn btn-outline" style={{ width: '100%' }}>
            Return to Public Site
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
