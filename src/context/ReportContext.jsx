import React, { createContext, useState, useEffect } from 'react';

export const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reports');
      if (response.ok) {
        const data = await response.json();
        // Parse history JSON string from MySQL JSON_ARRAYAGG
        const parsedData = data.map(r => ({
          ...r,
          history: typeof r.history === 'string' ? JSON.parse(r.history) : r.history || []
        }));
        setReports(parsedData);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:5000');
      
      socket.on('report_created', (newReport) => {
        setReports(prev => [newReport, ...prev]);
        fetchReports(); // Deep refresh for text history
      });

      socket.on('report_updated', (updatedData) => {
        setReports(prev => prev.map(r => r.id == updatedData.id ? { ...r, ...updatedData } : r));
        fetchReports(); // Deep refresh for history text
      });

      return () => socket.disconnect();
    });
  }, []);

  const addReport = async (payload) => {
    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchReports(); // Refresh state from DB
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
      const response = await fetch(`http://localhost:5000/api/reports/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        await fetchReports(); // Refresh
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update report:", err);
      return false;
    }
  };

  const bulkUpdateReports = async (reportIds, payload) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reports/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportIds, ...payload })
      });
      if (response.ok) {
        await fetchReports(); 
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to bulk update reports:", err);
      return false;
    }
  };

  return (
    <ReportContext.Provider value={{ reports, loading, fetchReports, addReport, updateReportStatus, bulkUpdateReports }}>
      {children}
    </ReportContext.Provider>
  );
};
