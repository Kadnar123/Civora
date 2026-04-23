import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShieldAlert, Globe, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const UserLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="user-layout">
      <header className="public-header">
        <div className="logo-section">
          <div className="sidebar-logo">
            <ShieldAlert size={20} />
          </div>
          <span className="sidebar-title">Civora</span>
        </div>
        <nav className="public-nav">
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>{t('home')}</NavLink>
          <NavLink to="/submit" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>{t('report_issue')}</NavLink>
          {user && <NavLink to="/my-reports" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>{t('my_reports')}</NavLink>}
        </nav>
        <div className="public-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Globe size={18} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
            <select onChange={changeLanguage} value={i18n.language} className="select-input" style={{ paddingLeft: '32px', height: '36px' }}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>
          {user && user.role !== 'Citizen' && (
            <NavLink to="/admin" className="btn btn-outline" style={{ padding: '6px 16px' }}>{t('admin_dash')}</NavLink>
          )}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="avatar" style={{width: '32px', height: '32px'}} title={user.name}></div>
              <button onClick={handleLogout} className="icon-btn" title="Logout"><LogOut size={18} color="var(--accent-danger)" /></button>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary" style={{ padding: '6px 16px' }}>{t('login')}</NavLink>
          )}
        </div>
      </header>
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
