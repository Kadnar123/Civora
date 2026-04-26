import React, { createContext, useState, useEffect } from 'react';

export const ReportContext = createContext();

const API_BASE = 'http://localhost:5000';

const normalizeRow = (r) => {
  // Parse history which may come as JSON string from MySQL
  let history = [];
  try {
    if (r.history) {
      history = typeof r.history === 'string' ? JSON.parse(r.history) : r.history;
    }
  } catch (e) {
    history = [];
  }

  return {
    id: r.id,
    report_id: r.report_id,
    title: r.title,
    category: r.category,
    status: r.status || 'Pending',
    priority: r.priority,
    created_at: r.created_at || r.date || new Date().toISOString(),
    photoBase64: r.photo_base64 || r.photoBase64 || r.image,
    approval_level: r.approval_level,
    department: r.department,
    description: r.description,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    user_id: r.user_id,
    history: history || []
  };
};

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const normalized = data.map(normalizeRow);
      setReports(normalized);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addReport = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Submit failed');
      // Refresh list
      await fetchReports();
      return true;
    } catch (err) {
      console.error('Add report error:', err);
      return false;
    }
  };

  const updateReportStatus = async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
      await fetchReports();
      return true;
    } catch (err) {
      console.error('Update report error:', err);
      return false;
    }
  };

  const bulkUpdateReports = async (reportIds, payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds, ...payload })
      });
      if (!res.ok) throw new Error('Bulk update failed');
      await fetchReports();
      return true;
    } catch (err) {
      console.error('Bulk update error:', err);
      return false;
    }
  };

  return (
    <ReportContext.Provider value={{ reports, loading, fetchReports, addReport, updateReportStatus, bulkUpdateReports }}>
      {children}
    </ReportContext.Provider>
  );
};
