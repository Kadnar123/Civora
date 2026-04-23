import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthContext } from '../context/AuthContext';
import AdminLogin from '../pages/AdminLogin';

const Layout = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
