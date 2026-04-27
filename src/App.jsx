import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin Interface
import Layout from './components/Layout';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ReportsList from './pages/ReportsList';

// Citizen Interface
import UserLayout from './components/UserLayout';
import CitizenLanding from './pages/CitizenLanding';
import SubmitReport from './pages/SubmitReport';
import MyReports from './pages/MyReports';
import PublicLogin from './pages/PublicLogin';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Routes>
      {/* Citizen Public Facing Routes */}
      <Route path="/" element={<UserLayout />}>
        <Route index element={<CitizenLanding />} />
        <Route path="submit" element={<SubmitReport />} />
        <Route path="my-reports" element={<MyReports />} />
        <Route path="login" element={<PublicLogin />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Secure Routes */}
      <Route path="/admin" element={<Layout />}>
        <Route index element={<AnalyticsDashboard />} />
        <Route path="reports" element={<ReportsList />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
