import React, { useContext, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { ReportContext } from '../context/ReportContext';
import { AuthContext } from '../context/AuthContext';

const AnalyticsDashboard = () => {
  const { reports: allReports } = useContext(ReportContext);
  const { user } = useContext(AuthContext);

  const reports = useMemo(() => {
    return allReports.filter(r => 
      user?.role === 'Master Admin' ? true : r.approval_level === user?.role
    );
  }, [allReports, user]);

  // Derive Analytics from DB data
  const total = reports.length;
  const open = reports.filter(r => r.status === 'Pending').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;

  // Calculate Average Resolution Time
  const avgResolutionData = useMemo(() => {
    let resolvedReports = reports.filter(r => r.status === 'Resolved');
    if (resolvedReports.length === 0) return { text: 'N/A', hours: 0 };
    
    let totalMs = 0;
    resolvedReports.forEach(r => {
      // created_at is when it started.
      const startTime = new Date(r.created_at).getTime();
      // the last history item when status changed
      if (r.history && r.history.length > 0) {
        const endTime = new Date(r.history[r.history.length - 1].created_at).getTime();
        totalMs += (endTime - startTime);
      }
    });

    const avgMs = totalMs / resolvedReports.length;
    const hours = (avgMs / (1000 * 60 * 60)).toFixed(1);
    
    return { text: `${hours} Hours`, hours };
  }, [reports]);

  // Aggregate by Department for Average resolution per dept
  const deptResolutionData = useMemo(() => {
     let deptTimes = {};
     reports.filter(r => r.status === 'Resolved').forEach(r => {
        const level = r.approval_level || 'System';
        if (!deptTimes[level]) deptTimes[level] = { ms: 0, count: 0 };
        const start = new Date(r.created_at).getTime();
        const end = r.history && r.history.length > 0 ? new Date(r.history[r.history.length - 1].created_at).getTime() : start;
        deptTimes[level].ms += (end - start);
        deptTimes[level].count += 1;
     });
     
     return Object.keys(deptTimes).map(dept => {
        const avgHours = (deptTimes[dept].ms / deptTimes[dept].count) / (1000 * 60 * 60);
        return { name: dept, value: parseFloat(avgHours.toFixed(1)) };
     });
  }, [reports]);


  // Generating weekly trends smoothly
  const trendData = useMemo(() => {
    // We'd group by Date(created_at)
    const mapping = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    reports.forEach(r => {
      const d = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      if (mapping[d] !== undefined) {
        mapping[d]++;
      }
    });
    // Formulate final plot
    return Object.keys(mapping).map(day => ({ name: day, reports: mapping[day] }));
  }, [reports]);

  // Volume Distribution (by Hierarchy Level)
  const barData = useMemo(() => {
    const deptCounts = reports.reduce((acc, report) => {
      const level = report.approval_level || 'System';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    const result = Object.keys(deptCounts).map(dept => ({ name: dept, value: deptCounts[dept] }));
    if (result.length === 0) {
      result.push({ name: 'Local Sarpanch', value: 0 }, { name: 'Talathi', value: 0 });
    }
    return result;
  }, [reports]);

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div className="page-header">
        <h1 className="page-title">Analytics & Monitoring</h1>
        <p className="page-subtitle">Real-Time Insights pulled straight from the system Database.</p>
      </div>

      <div className="grid-cards">
        <div className="glass-panel kpi-card">
          <div className="kpi-title">Total Volume</div>
          <div className="kpi-value">{total}</div>
          <div className="kpi-trend trend-up">
            <Activity size={16} /> Lifetime Intake
          </div>
        </div>
        
        <div className="glass-panel kpi-card danger">
          <div className="kpi-title">Open Attention</div>
          <div className="kpi-value">{open}</div>
          <div className="kpi-trend trend-down">
            <AlertTriangle size={16} /> Action Required
          </div>
        </div>
        
        <div className="glass-panel kpi-card success">
          <div className="kpi-title">Successfully Resolved</div>
          <div className="kpi-value">{resolved}</div>
          <div className="kpi-trend trend-up">
            <CheckCircle size={16} /> Completed Cycles
          </div>
        </div>
        
        <div className="glass-panel kpi-card warning">
          <div className="kpi-title">Average Resolution</div>
          <div className="kpi-value">{avgResolutionData.text}</div>
          <div className="kpi-trend trend-up" style={{ color: 'var(--accent-warning)' }}>
            <Clock size={16} /> Global Efficiency
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginTop: '24px' }}>
        <div className="glass-panel chart-card" style={{ height: '350px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Weekly Intake Trends</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="reports" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-card" style={{ height: '350px' }}>
          <div className="chart-header">
            <h3 className="chart-title">Workload Distribution (by Level)</h3>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} width={120} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="url(#colorReports)" radius={[0, 4, 4, 0]} >
                   {
                     barData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent-primary)' : 'var(--accent-warning)'} />
                     ))
                   }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Lower Dashboard */}
      {deptResolutionData.length > 0 && (
         <div className="glass-panel" style={{ marginTop: '24px', padding: '24px' }}>
            <h3 className="chart-title" style={{ marginBottom: '16px' }}>Performance: Average Resolution Time (by Level)</h3>
            <ResponsiveContainer width="100%" height={250}>
               <BarChart data={deptResolutionData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                 <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                 <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  formatter={(value) => [`${value} Hours`, 'Average Resolution Time']}
                 />
                 <Bar dataKey="value" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
