import React, { useState, useContext } from 'react';
import { Shield, Key, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('Local Sarpanch');

  const handleLogin = (e) => {
    e.preventDefault();
    login(selectedRole);
    navigate('/admin'); // Force routing to internal dash
  };

  return (
    <div className="citizen-page submit-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel form-slide-in" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', marginBottom: '24px' }}>
          <Shield size={32} color="var(--accent-primary)" />
        </div>
        
        <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Admin Portal Login</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>Secure simulator for Government Employees</p>

        <form onSubmit={handleLogin}>
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Select Your Department</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select 
                className="select-input" 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: '100%', paddingLeft: '48px', fontSize: '1rem', height: '48px' }}
              >
                <optgroup label="Government Hierarchy">
                  <option value="Local Sarpanch">Local Sarpanch (Village Level)</option>
                  <option value="Talathi">Talathi (Revenue Officer)</option>
                  <option value="Tahsildar">Tahsildar (Tehsil Level)</option>
                  <option value="Block Development Officer">Block Development Officer</option>
                  <option value="Sub-Divisional Magistrate">Sub-Divisional Magistrate</option>
                  <option value="District Collector">District Collector</option>
                </optgroup>
                <optgroup label="System Executive">
                  <option value="Master Admin">Master City Administrator (Sees All)</option>
                </optgroup>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', display: 'flex', justifyContent: 'center' }}>
            <LogIn size={18} /> Login to Sandbox
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
          <button onClick={() => navigate('/')} className="btn btn-outline" style={{ width: '100%' }}>
            Return to Public Site
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
