import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

const PublicLogin = () => {
  const { loginAPI, registerAPI } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const res = await loginAPI(formData.email || formData.phone, formData.password);
      if (res.success) {
        navigate('/my-reports');
      } else {
        setError(res.error || 'Login failed');
      }
    } else {
      const res = await registerAPI(formData.name, formData.phone, formData.email, formData.password, 'Citizen');
      if (res.success) {
        navigate('/my-reports');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  return (
    <div className="citizen-page submit-container" style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel form-slide-in" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
        
        <h1 className="page-title">{isLogin ? 'Citizen Login' : 'Create Account'}</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>
          {isLogin ? 'Welcome back to Civora' : 'Join to track your civic reports'}
        </p>

        {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '16px', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Full Name</label>
              <input type="text" name="name" className="search-input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }} onChange={handleInputChange} required />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Email Address</label>
            <input type="email" name="email" className="search-input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }} onChange={handleInputChange} required />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Phone Number</label>
              <input type="tel" name="phone" className="search-input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }} onChange={handleInputChange} required />
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Password</label>
            <input type="password" name="password" className="search-input" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px' }} onChange={handleInputChange} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center' }}>
            {isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Register</>}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
          <button onClick={() => setIsLogin(!isLogin)} className="btn btn-outline" style={{ width: '100%' }}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicLogin;
