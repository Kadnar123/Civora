import React, { useState, useContext } from 'react';
import ReportDetailPanel from './ReportDetailPanel';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ReportContext } from '../context/ReportContext';
import { AuthContext } from '../context/AuthContext';
import { Layers } from 'lucide-react';

// Fix Leaflet icons issue in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom Icons for different statuses
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const iconOpen = createCustomIcon('var(--accent-danger)');
const iconProgress = createCustomIcon('var(--accent-warning)');
const iconResolved = createCustomIcon('var(--accent-success)');

const getIconForStatus = (status) => {
  if (status === 'Pending') return iconOpen;
  if (status === 'In Progress') return iconProgress;
  return iconResolved;
};

const LiveMap = () => {
  const { reports } = useContext(ReportContext);
  const { user } = useContext(AuthContext);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const processedReports = reports.filter(r => {
    // Role filter
    if (user?.role !== 'Master Admin' && r.approval_level !== user?.role) return false;
    
    // Category filter
    if (filterCategory !== 'All' && r.category !== filterCategory) return false;
    
    // Status filter
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    
    return true;
  });
  
  // Default to Nashik area
  const center = processedReports.length > 0 ? [processedReports[0].lat, processedReports[0].lng] : [19.9975, 73.7898];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Live Map Dashboard</h1>
          <p className="page-subtitle">Real-time geographic view and heatmap of all reported issues.</p>
        </div>
        <button 
          className={`btn ${showHeatmap ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          <Layers size={18} /> {showHeatmap ? 'Disable Hotspots' : 'Show Hotspot Heatmap'}
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
             <select className="select-input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '8px 16px' }}>
                <option value="All">All Categories</option>
                <option value="Road">Road</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Electrical">Electrical</option>
                <option value="Water">Water</option>
             </select>
             <select className="select-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 16px' }}>
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
             </select>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-danger)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Pending</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-warning)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>In Progress</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-success)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Resolved</span>
            </div>
          </div>
        </div>

        <div className="map-container" style={{ flex: 1 }}>
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {processedReports.map((report) => {
               if(!report.lat || !report.lng) return null;
               
               // Heatmap Visual Generation (Overlapping circles)
               if(showHeatmap) {
                 return (
                   <Circle 
                     key={`heat-${report.id}`}
                     center={[report.lat, report.lng]} 
                     pathOptions={{ fillColor: 'red', fillOpacity: 0.2, color: 'transparent' }} 
                     radius={800} 
                   />
                 );
               }

               // Standard Pin Mode
               return (
                 <Marker 
                   key={report.id} 
                   position={[report.lat, report.lng]}
                   icon={getIconForStatus(report.status)}
                   eventHandlers={{
                     click: () => {
                       setSelectedReport(report);
                     },
                   }}
                 />
               )
            })}
          </MapContainer>
        </div>
      </div>
      
      {/* Sliding Direct Panel Integration */}
      <ReportDetailPanel 
        report={selectedReport} 
        isOpen={!!selectedReport} 
        onClose={() => setSelectedReport(null)} 
      />
    </div>
  );
};

export default LiveMap;
