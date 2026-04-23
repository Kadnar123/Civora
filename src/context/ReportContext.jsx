import React, { createContext, useState, useEffect } from 'react';
import { mockReports } from '../data/mockData';

export const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('civora_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch(e) {
        return mockReports;
      }
    }
    return mockReports;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('civora_reports', JSON.stringify(reports));
  }, [reports]);

  const fetchReports = async () => {
    setLoading(false);
  };

  const addReport = async (payload) => {
    const newReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      ...payload,
      date: new Date().toISOString().split('T')[0],
      history: [{ date: new Date().toLocaleString(), text: "Report submitted." }]
    };
    setReports(prev => [newReport, ...prev]);
    return true;
  };

  const updateReportStatus = async (id, payload) => {
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: payload.status,
          history: [...(r.history || []), { date: new Date().toLocaleString(), text: `Status updated to ${payload.status}` }]
        };
      }
      return r;
    }));
    return true;
  };

  const bulkUpdateReports = async (reportIds, payload) => {
    setReports(prev => prev.map(r => {
      if (reportIds.includes(r.id)) {
        return {
          ...r,
          status: payload.status || r.status,
          department: payload.department || r.department,
          history: [...(r.history || []), { date: new Date().toLocaleString(), text: `Bulk updated. Status: ${payload.status}, Dept: ${payload.department}` }]
        };
      }
      return r;
    }));
    return true;
  };

  return (
    <ReportContext.Provider value={{ reports, loading, fetchReports, addReport, updateReportStatus, bulkUpdateReports }}>
      {children}
    </ReportContext.Provider>
  );
};
