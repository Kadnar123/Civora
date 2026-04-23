import React, { useContext } from 'react';
import { Search, Bell, LogOut, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="top-header">
      <div className="search-bar">
        <Search size={18} color="var(--text-muted)" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search by ID, keyword, location..." 
        />
      </div>
      
      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 12px', borderRadius: '50px', border: '1px solid var(--accent-primary)' }}>
            <ShieldCheck size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--accent-primary)' }}>{user.role}</span>
          </div>
        )}
        
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        <button className="icon-btn" onClick={logout} title="Log Out">
           <LogOut size={20} color="var(--accent-danger)" />
        </button>
        <div className="avatar"></div>
      </div>
    </header>
  );
};

export default Header;
