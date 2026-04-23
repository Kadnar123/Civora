import React, { useContext } from 'react';
import { ReportContext } from '../context/ReportContext';
import { CheckCircle, Clock, MapPin, Loader } from 'lucide-react';

const MyReports = () => {
  const { reports, loading } = useContext(ReportContext);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><Loader className="spin" size={32} /></div>;
  }

  // Use the reports from MySQL
  const userReports = reports;

  return (
    <div className="citizen-page">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="page-title">My Reports</h1>
        <p className="page-subtitle">Track the status of the issues you've reported.</p>
      </div>

      <div className="reports-grid" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {userReports.length === 0 ? (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            You haven't submitted any reports yet.
          </div>
        ) : userReports.map(report => (
          <div key={report.id} className="glass-panel tracking-card">
            <div className="tracking-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{report.title}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> {report.address?.substring(0, 40) || report.lat + ", " + report.lng}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14}/> {new Date(report.created_at).toLocaleDateString()}</span>
                  {report.eta_date && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-secondary)' }}>
                      <strong>Target Resolution:</strong> {new Date(report.eta_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <span className={`status-badge status-${(report.status || '').toLowerCase().replace(' ', '')}`}>{report.status}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Stage: {report.approval_level || 'Gram Panchayat'}</span>
              </div>
            </div>
            
            <div className="tracking-body" style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
              {report.photo_base64 ? (
                <img src={report.photo_base64} alt="Report" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}></div>
              )}
              
              <div className="tracking-timeline" style={{ flex: 1 }}>
                {report.history && report.history.length > 0 ? (
                  report.history.map((h, index) => {
                    const isLast = index === report.history.length - 1;
                    return (
                      <div key={index} className={`timeline-step ${isLast && report.status !== 'Resolved' ? 'pending' : 'completed'}`}>
                        <div className="step-icon"><CheckCircle size={16} /></div>
                        <div className="step-content">
                          <strong>{index === 0 ? 'Report Submitted' : 'Government Action'}</strong>
                          <span>{h.text || h.status_text}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(h.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="timeline-step pending">
                     <div className="step-icon"></div>
                     <div className="step-content">
                        <strong>Processing</strong>
                        <span>Awaiting system routing</span>
                     </div>
                  </div>
                )}
                
                {report.status === 'Resolved' && (
                  <div className="timeline-step completed" style={{ marginTop: '16px' }}>
                    <div className="step-icon" style={{ background: 'var(--accent-success)', color: 'white', border: 'none' }}>
                      <CheckCircle size={16} />
                    </div>
                    <div className="step-content">
                      <strong style={{ color: 'var(--accent-success)' }}>Issue Resolved</strong>
                      <span>The government has officially closed this issue.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyReports;
