import React, { useState, useContext, useMemo } from 'react';
import ReportDetailPanel from './ReportDetailPanel';
import { Filter, SortAsc, Loader, Search } from 'lucide-react';
import { ReportContext } from '../context/ReportContext';
import { AuthContext } from '../context/AuthContext';

const ReportsList = () => {
  const { reports, loading, bulkUpdateReports } = useContext(ReportContext);
  const { user } = useContext(AuthContext);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Bulk Action States
  const [bulkRole, setBulkRole] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('Recent'); // Recent, Oldest, HighPriority
  const [viewMode, setViewMode] = useState('assigned'); // 'assigned' or 'all'

  const priorityScore = { 'High': 3, 'Medium': 2, 'Low': 1 };

  const processedReports = useMemo(() => {
    // 0. Base filtering by Role Profile
    let result = reports.filter(r => {
      if (user?.role === 'Master Admin' || user?.role === 'Government' || viewMode === 'all') return true;
      return r.approval_level === user?.role;
    });

    // 1. Full Text Search (ID, Title, Address)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.report_id && r.report_id.toLowerCase().includes(q)) ||
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.address && r.address.toLowerCase().includes(q))
      );
    }

    // 2. Exact Match Filters
    if (filterStatus !== 'All') result = result.filter(r => r.status === filterStatus);
    if (filterCategory !== 'All') result = result.filter(r => r.category === filterCategory);
    if (filterDepartment !== 'All') result = result.filter(r => r.department === filterDepartment);

    // 3. Date Range
    if (dateRange.start) {
      const start = new Date(dateRange.start).setHours(0,0,0,0);
      result = result.filter(r => new Date(r.created_at).getTime() >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end).setHours(23,59,59,999);
      result = result.filter(r => new Date(r.created_at).getTime() <= end);
    }

    // 4. Sorting Engine
    result = [...result].sort((a, b) => {
      if (sortBy === 'Recent') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'Oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'HighPriority') {
        const scoreDiff = (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.created_at) - new Date(a.created_at); // fallback to recent
      }
      return 0;
    });

    return result;
  }, [reports, searchQuery, filterStatus, filterCategory, filterDepartment, dateRange, sortBy]);

  if (loading) {
     return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}><Loader className="spin" size={32} /></div>;
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(processedReports.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    const payload = {};
    if (bulkRole) payload.approval_level = bulkRole;
    if (bulkStatus) payload.status = bulkStatus;
    payload.note = "System Bulk Update";

    const success = await bulkUpdateReports(selectedIds, payload);
    if (success) {
       alert("Bulk update successful!");
       setSelectedIds([]);
       setBulkRole('');
       setBulkStatus('');
    } else {
       alert("Bulk update failed.");
    }
  };

  const exportCSV = () => {
    if (processedReports.length === 0) return;
    const headers = ['Report ID', 'Title', 'Category', 'Level', 'Status', 'Date', 'Priority'];
    const rows = processedReports.map(r => [
       r.report_id,
       `"${r.title.replace(/"/g, '""')}"`,
       r.category,
       r.approval_level,
       r.status,
       new Date(r.created_at).toLocaleDateString(),
       r.priority
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "civora_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports Management</h1>
        <p className="page-subtitle">View, filter, and manage all incoming citizen reports.</p>
      </div>

      <div className="filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-panel)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        
        {/* Top Row: Search and Sort */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border-light)' }}>
             <button 
                type="button"
                className={`btn ${viewMode === 'assigned' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewMode('assigned')}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}
             >
               Assigned to Me
             </button>
             <button 
                type="button"
                className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => setViewMode('all')}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}
             >
               See All Reports
             </button>
          </div>

          <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="select-input" 
              placeholder="Search by Report ID, Keyword, or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '48px', paddingRight: '16px' }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SortAsc size={18} color="var(--text-muted)" />
            <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="Recent">Newest First</option>
              <option value="Oldest">Oldest First</option>
              <option value="HighPriority">Highest Priority</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Exact Filters */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <Filter size={18} />
            <span>Filters:</span>
          </div>
          <select className="select-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select className="select-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="Road">Road</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Electrical">Electrical</option>
            <option value="Water">Water</option>
            <option value="Other">Other</option>
          </select>
          <select className="select-input" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
            <option value="All">All Departments</option>
            <option value="Public Works">Public Works</option>
            <option value="Waste Management">Waste Management</option>
            <option value="Energy & Utilities">Energy & Utilities</option>
            <option value="Water Supply Board">Water Supply Board</option>
          </select>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid var(--border-medium)', paddingLeft: '16px' }}>
            <input 
              type="date" 
              className="select-input" 
              title="Start Date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input 
              type="date" 
              className="select-input" 
              title="End Date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div style={{ position: 'sticky', top: '20px', zIndex: 100, background: 'var(--accent-primary)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <span style={{ color: 'white', fontWeight: 'bold' }}>{selectedIds.length} Selected</span>
          
          <select className="select-input" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} style={{ padding: '8px', color: 'black' }}>
            <option value="">-- Reassign To --</option>
            <option value="Local Sarpanch">Local Sarpanch</option>
            <option value="Talathi">Talathi</option>
            <option value="Tahsildar">Tahsildar</option>
            <option value="Block Development Officer">Block Development Officer</option>
            <option value="Sub-Divisional Magistrate">Sub-Divisional Magistrate</option>
            <option value="District Collector">District Collector</option>
          </select>

          <select className="select-input" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ padding: '8px', color: 'black' }}>
            <option value="">-- Change Status --</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <button className="btn" style={{ background: 'white', color: 'var(--accent-primary)' }} onClick={handleBulkUpdate}>
            Apply Bulk Action
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
         <button className="btn btn-outline" onClick={exportCSV}>Export to CSV</button>
      </div>

      <div className="glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>
                 <input 
                   type="checkbox" 
                   onChange={handleSelectAll} 
                   checked={processedReports.length > 0 && selectedIds.length === processedReports.length} 
                   style={{ cursor: 'pointer' }}
                 />
              </th>
              <th>Image</th>
              <th>ID</th>
              <th>Report Details</th>
              <th>Category</th>
              <th>Approval Stage</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {processedReports.length === 0 ? (
               <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px' }}>No reports match the current filters.</td></tr>
            ) : processedReports.map((report) => (
              <tr key={report.id} style={{ background: selectedIds.includes(report.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(report.id)} 
                    onChange={() => toggleSelection(report.id)} 
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>
                  {(report.photo_base64 || report.photoBase64 || report.image) ? (
                    <img 
                      src={report.photo_base64 || report.photoBase64 || report.image} 
                      alt="Thumbnail" 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                    />
                  ) : (
                    <div style={{ width: '50px', height: '50px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}></div>
                  )}
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{report.report_id || report.id}</td>
                <td>
                  <div style={{ fontWeight: '500' }}>{report.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority: <span style={{ color: report.priority === 'High' ? 'var(--accent-danger)' : 'inherit' }}>{report.priority}</span></div>
                </td>
                <td>{report.category}</td>
                <td style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{report.approval_level || 'Local Sarpanch'}</td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${(report.status || '').toLowerCase().replace(' ', '')}`}>
                    {report.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedReport(report)}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReportDetailPanel 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />
    </div>
  );
};

export default ReportsList;
