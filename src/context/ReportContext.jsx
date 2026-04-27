import React, { createContext, useState, useEffect } from 'react';
import { mockReports } from '../data/mockData';

export const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const API_URL = 'http://localhost:5000';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const addReport = async (payload) => {
    try {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        fetchReports(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to add report:", err);
      return false;
    }
  };

  const updateReportStatus = async (id, payload) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        fetchReports(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update status:", err);
      return false;
    }
  };

  const bulkUpdateReports = async (reportIds, payload) => {
    try {
      const response = await fetch(`${API_URL}/api/reports/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds, ...payload })
      });
      const data = await response.json();
      if (data.success) {
        fetchReports(); // Refresh the list
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed bulk update:", err);
      return false;
    }
  };

  return (
    <ReportContext.Provider value={{ reports, loading, fetchReports, addReport, updateReportStatus, bulkUpdateReports }}>
      {children}
    </ReportContext.Provider>
  );
};
