import React, { useState, useEffect, useContext } from 'react';
import { X, MapPin, User, Tag, Clock, Save, ArrowUpCircle, Calendar } from 'lucide-react';
import { ReportContext } from '../context/ReportContext';
import { AuthContext } from '../context/AuthContext';

const ReportDetailPanel = ({ report, isOpen, onClose }) => {
  const { updateReportStatus } = useContext(ReportContext);
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState('Pending');
  const [note, setNote] = useState('');
  
  // Re-assignment states
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [priority, setPriority] = useState('');
  
  // Escalation & ETA states
  const [approvalLevel, setApprovalLevel] = useState('');
  const [etaDate, setEtaDate] = useState('');

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'Pending');
      setCategory(report.category || '');
      setPriority(report.priority || 'Low');
      setApprovalLevel(report.approval_level || 'Local Sarpanch');
      setEtaDate(report.eta_date ? report.eta_date.split('T')[0] : '');
    }
  }, [report]);

  if (!report) return null;

  const handleUpdate = async () => {
    const payload = { 
      status, 
      note,
      category: category !== report.category ? category : undefined,
      priority: priority !== report.priority ? priority : undefined,
      approval_level: approvalLevel !== report.approval_level ? approvalLevel : undefined,
      eta_date: etaDate !== (report.eta_date ? report.eta_date.split('T')[0] : '') ? etaDate : undefined
    };
    
    const success = await updateReportStatus(report.id, payload);
    if (success) {
      alert("Successfully updated report!");
      setNote('');
      onClose(); // Hide panel after updating
    } else {
      alert("Failed to update report. Check backend connection.");
    }
  };

  return (
    <>
      <div className={`slide-panel-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`slide-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3 className="page-title" style={{ marginBottom: 0, fontSize: '1.25rem' }}>{report.report_id}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="panel-content">
          {report.photo_base64 && (
            <img src={report.photo_base64} alt={report.title} className="report-image" />
          )}
          
          <div className="info-group">
            <h2 className="page-title">{report.title}</h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <span className={`status-badge status-${status.toLowerCase().replace(' ', '')}`}>
                {status}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>• {new Date(report.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-dark)', lineHeight: '1.6' }}>
            {report.description || "No description provided."}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="info-group" style={{ gridColumn: '1 / -1' }}>
              <span className="info-label"><MapPin size={14} style={{ display: 'inline', marginRight: '4px'}}/>Location</span>
              <span className="info-value" style={{ fontSize: '0.875rem' }}>{report.address || `${report.lat}, ${report.lng}`}</span>
            </div>
            
            <div className="info-group">
              <span className="info-label"><Tag size={14} style={{ display: 'inline', marginRight: '4px'}}/>Category</span>
              <select 
                className="select-input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.875rem' }}
              >
                <option>Road</option>
                <option>Sanitation</option>
                <option>Electrical</option>
                <option>Water</option>
                <option>Other</option>
              </select>
            </div>

            <div className="info-group">
              <span className="info-label"><User size={14} style={{ display: 'inline', marginRight: '4px'}}/>Current Assignment</span>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                {report.approval_level || 'Local Sarpanch'}
              </div>
            </div>

            <div className="info-group" style={{ gridColumn: '1 / -1' }}>
              <span className="info-label"><Clock size={14} style={{ display: 'inline', marginRight: '4px'}}/>Priority Level</span>
              <select 
                className="select-input" 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.875rem', color: priority === 'High' ? 'var(--accent-danger)' : 'inherit' }}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

           <div className="info-group" style={{ marginTop: '12px' }}>
             <span className="info-label">Update Status</span>
             <select 
                className="select-input" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', marginTop: '8px' }}
              >
               <option value="Pending">Pending</option>
               <option value="In Progress">In Progress</option>
               <option value="Resolved">Resolved</option>
             </select>
          </div>

          {/* New Escalation Module */}
          <div className="glass-panel" style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '16px', fontSize: '0.95rem' }}>
              <ArrowUpCircle size={18} /> Official Action & Escalation
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="info-group" style={{ marginBottom: 0 }}>
                <span className="info-label">Reassign / Escalate To</span>
                <select 
                  className="select-input" 
                  value={approvalLevel} 
                  onChange={(e) => setApprovalLevel(e.target.value)}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  <option value="Local Sarpanch">Local Sarpanch</option>
                  <option value="Talathi">Talathi</option>
                  <option value="Tahsildar">Tahsildar</option>
                  <option value="Block Development Officer">Block Development Officer</option>
                  <option value="Sub-Divisional Magistrate">Sub-Divisional Magistrate</option>
                  <option value="District Collector">District Collector</option>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  * Move up or down the hierarchy.
                </div>
              </div>
              
              <div className="info-group" style={{ marginBottom: 0 }}>
                <span className="info-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> Target Resolution (ETA)
                </span>
                <input 
                  type="date"
                  className="select-input"
                  value={etaDate}
                  onChange={(e) => setEtaDate(e.target.value)}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            </div>
          </div>

          <div className="info-group" style={{ marginTop: '12px' }}>
             <span className="info-label">Action Log & Citizen Response</span>
             <div className="timeline">
               {report.history && report.history.map((h, i) => (
                 <div key={i} className="timeline-item">
                   <div className="timeline-date">{new Date(h.created_at).toLocaleString()}</div>
                   <div className="timeline-content">{h.text || h.status_text}</div>
                 </div>
               ))}
               <div className="timeline-item">
                 <div className="timeline-date">Take Action</div>
                 <input 
                    type="text" 
                    className="select-input" 
                    placeholder="Log an action or reply to citizen..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ width: '100%', marginTop: '4px', background: 'rgba(255,255,255,0.02)' }}
                  />
               </div>
             </div>
          </div>
        </div>

        <div className="panel-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate}><Save size={16} /> Save Changes</button>
        </div>
      </div>
    </>
  );
};

export default ReportDetailPanel;
