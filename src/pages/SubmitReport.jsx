import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { Camera, MapPin, Loader, Check, Mic, XCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ReportContext } from '../context/ReportContext';
import { AuthContext } from '../context/AuthContext';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

// Re-using the custom pin from Admin dashboard
const mapPinHtml = `<div style="background-color: var(--accent-primary); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>`;
const customIcon = L.divIcon({ className: 'custom-pin-wrapper', html: mapPinHtml, iconSize: [22, 22], iconAnchor: [11, 11] });

// Component to handle map clicks for manual pin drop
const LocationSelector = ({ location, setLocation }) => {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], map.getZoom());
    }
  }, [location, map]);

  return location ? (
    <Marker 
      position={[location.lat, location.lng]} 
      icon={customIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          setLocation({ lat: position.lat, lng: position.lng });
        },
      }}
    >
      <Popup>Report Location</Popup>
    </Marker>
  ) : null;
};

const SubmitReport = () => {
  const navigate = useNavigate();
  const { addReport } = useContext(ReportContext);
  const { user } = useContext(AuthContext);
  
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Camera State (using react-webcam)
  const webcamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");

  // AI Verification State
  const [model, setModel] = useState(null);
  const [analyzingImg, setAnalyzingImg] = useState(false);
  const [aiWarning, setAiWarning] = useState("");
  
  // Form Data
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [address, setAddress] = useState(''); // Text address
  const [details, setDetails] = useState({ title: '', category: 'Road', description: '' });

  // Load AI Model on Mount
  useEffect(() => {
    let isMounted = true;
    cocoSsd.load().then(loadedModel => {
      if (isMounted) setModel(loadedModel);
    }).catch(err => console.error("AI Model Load Error:", err));
    return () => { isMounted = false; };
  }, []);

  // PWA Offline Drafts
  useEffect(() => {
    import('localforage').then((localforage) => {
      localforage.getItem('civora_draft_details').then((saved) => {
        if (saved) setDetails(saved);
      });
    });
  }, []);

  useEffect(() => {
    if (details.title !== '' || details.description !== '') {
      import('localforage').then((localforage) => {
        localforage.setItem('civora_draft_details', details);
      });
    }
  }, [details]);

  // Update logic to fetch exact text address whenever location changes
  useEffect(() => {
    if (location) {
      reverseGeocode(location.lat, location.lng);
    }
  }, [location]);

  // Reverse Geocoding using OpenStreetMap Nominatim
  const reverseGeocode = async (lat, lng) => {
    setFetchingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress("Exact address not found");
      }
    } catch (error) {
      console.error("Geocoding failed", error);
      setAddress("Could not fetch address name");
    } finally {
      setFetchingAddress(false);
    }
  };

  // Turn on device camera
  const startCamera = () => {
    setIsCameraActive(true);
    setPhoto(null);
  };

  // Capture frame from react-webcam with AI Verification
  const capturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      const videoElement = webcamRef.current.video;
      
      // Run AI Scan
      if (model && videoElement) {
        setAnalyzingImg(true);
        setAiWarning("");
        try {
          const predictions = await model.detect(videoElement);
          const hasHuman = predictions.some(p => p.class === 'person' && p.score > 0.5);
          
          if (hasHuman) {
            setAnalyzingImg(false);
            setAiWarning("AI Restriction: Human face/body detected. Pictures containing people are strictly not allowed. Capture the infrastructure only.");
            return; // Prevent capture
          }
        } catch (e) {
          console.warn("AI check skipped due to error", e);
        }
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhoto(imageSrc);
        setIsCameraActive(false);
        setAiWarning("");
        
        // We set analyzing to true here so the UI shows 'Analyzing AI...' while fetching from our endpoint
        setAnalyzingImg(true);

        try {
          const response = await fetch('http://localhost:5000/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoBase64: imageSrc })
          });
          const result = await response.json();
          
          if (result.success) {
             // Update category and title based on AI result
             setDetails(prev => ({ ...prev, category: result.category, title: result.title }));
             alert(`AI Auto-Categorization Complete!\n\nDetected Issue: ${result.title}\nCategory Assigned: ${result.category}\nConfidence: ${Math.round(result.confidence * 100)}%`);
          }
          setAnalyzingImg(false);
        } catch (e) {
          console.error('AI analysis failed', e);
          setAnalyzingImg(false);
        }

        // Auto-trigger location fetch when photo is taken
        if (!location) fetchLiveLocation();
      } else {
        setAnalyzingImg(false);
        alert("Camera is still loading. Please wait a second and try again.");
      }
    }
  }, [webcamRef, location, model]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const fetchLiveLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
       navigator.geolocation.getCurrentPosition(
         (position) => {
           setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
           setLoadingLocation(false);
         },
         (error) => {
           console.error("Error getting location", error);
           setLoadingLocation(false);
           alert("Could not pull live location automatically. Please tap the map to drop a pin manually.");
           // Fallback default
           setLocation({ lat: 19.9975, lng: 73.7898 }); // Default to Nashik area
         },
         { enableHighAccuracy: true }
       );
    } else {
       setLoadingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Photo is no longer required
    if (!location) {
      alert("Please provide a location by auto-detecting or dropping a pin on the map.");
      return;
    }
    
    setSubmitting(true);
    
    const payload = {
      title: details.title,
      category: details.category,
      description: details.description,
      lat: location.lat,
      lng: location.lng,
      address: address,
      user_id: user?.id
    };
    
    const success = await addReport(payload);
    setSubmitting(false);
    
    if (success) {
      import('localforage').then((localforage) => {
        localforage.removeItem('civora_draft_details');
      });
      alert("Report Submitted Successfully! You will receive push notifications as the status changes.");
      navigate('/my-reports');
    } else {
      alert("Failed to submit to database. Make sure your local MySQL backend is running.");
    }
  };

  return (
    <div className="citizen-page submit-container">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="page-title">Report an Issue</h1>
        <p className="page-subtitle">Take a live photo, auto-detect the exact address, and submit.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel form-slide-in" style={{ maxWidth: '700px', margin: '0 auto', padding: '32px' }}>
        
        {/* 1. Photo Section Using react-webcam */}
        <div className="info-group" style={{ marginBottom: '32px' }}>
          <span className="info-label" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>1. Evidence (Camera)</span>
          
          <div style={{ position: 'relative', marginTop: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            
            {/* Webcam Stream Container */}
            {isCameraActive && !photo && (
              <div style={{ position: 'relative' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode }}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
                />
                
                {aiWarning && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px', right: '50px', background: 'var(--accent-danger)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.875rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: 10 }}>
                    {aiWarning}
                  </div>
                )}
                
                {/* Camera Actions */}
                <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button 
                    type="button" 
                    className="icon-btn" 
                    style={{ background: 'rgba(0,0,0,0.6)', width: '48px', height: '48px' }}
                    onClick={toggleCameraFacing}
                    title="Flip Camera"
                  >
                    <RefreshCw size={20} color="white" />
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ borderRadius: '50px', padding: '16px 32px' }}
                    onClick={capturePhoto}
                    disabled={analyzingImg}
                  >
                    {analyzingImg ? <><Loader size={20} className="spin"/> Analyzing AI...</> : <><Camera size={20} /> Snap Photo</>}
                  </button>
                </div>

                <button 
                  type="button" 
                  className="icon-btn" 
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)' }}
                  onClick={() => setIsCameraActive(false)}
                  title="Close Camera"
                >
                  <XCircle size={20} color="white" />
                </button>
              </div>
            )}

            {/* Captured Photo Preview Container */}
            {photo && !isCameraActive && (
             <div style={{ position: 'relative' }}>
               <img src={photo} alt="Issue evidence" style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
               <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                  onClick={startCamera}
               >
                 Retake Photo
               </button>
             </div>
            )}

            {/* Inactive State - Click to open camera */}
            {!photo && !isCameraActive && (
              <div 
                className="photo-capture-area" 
                onClick={startCamera}
                style={{
                  height: '250px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px dashed var(--border-medium)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                 <Camera size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                 <h3>Open Camera</h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Take a picture instantly in the browser</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Exact Location Section */}
        <div className="info-group" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="info-label" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>2. Exact Live Location</span>
            <button type="button" className="btn btn-outline" onClick={fetchLiveLocation} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              {loadingLocation ? <><Loader size={14} className="spin" /> Locating...</> : <><MapPin size={14} /> Auto-Detect GPS</>}
            </button>
          </div>
          
          <div style={{ height: '250px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: '12px', border: '1px solid var(--border-light)' }}>
            <MapContainer center={location ? [location.lat, location.lng] : [19.9975, 73.7898]} zoom={location ? 17 : 12} style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
              />
              <LocationSelector location={location} setLocation={setLocation} />
            </MapContainer>
          </div>

          {/* Show the Reverse Geocoded Address dynamically */}
          {location && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginTop: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--accent-primary)' }}>Resolved Address:</strong>
              {fetchingAddress ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <Loader size={14} className="spin" /> Fetching street address...
                </div>
              ) : (
                <p style={{ color: 'white', lineHeight: '1.4' }}>{address || "Exact address not found. Showing coordinates."}</p>
              )}
            </div>
          )}
        </div>

        {/* 3. Details Section */}
        <div className="info-group" style={{ marginBottom: '32px' }}>
          <span className="info-label" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>3. Issue Details</span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Category</label>
              <select 
                className="select-input" 
                value={details.category}
                onChange={e => setDetails({...details, category: e.target.value})}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option>Road</option>
                <option>Sanitation</option>
                <option>Electrical</option>
                <option>Water</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Short Title</label>
              <input 
                type="text" 
                className="select-input" 
                required
                placeholder="e.g. Broken Pipe" 
                value={details.title}
                onChange={e => setDetails({...details, title: e.target.value})}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description (Optional Text or Voice Note)</label>
            <div style={{ position: 'relative' }}>
              <textarea 
                className="select-input" 
                placeholder="Provide any additional details..." 
                value={details.description}
                onChange={e => setDetails({...details, description: e.target.value})}
                style={{ width: '100%', marginTop: '4px', minHeight: '100px', resize: 'vertical' }}
              />
              <button 
                type="button"
                className={`icon-btn ${recording ? 'recording' : ''}`}
                onClick={() => setRecording(!recording)}
                style={{ position: 'absolute', bottom: '16px', right: '16px', background: recording ? 'var(--accent-danger)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                title="Record Voice Note"
              >
                 <Mic size={18} />
              </button>
            </div>
            {recording && <p style={{ color: 'var(--accent-danger)', fontSize: '0.8rem', marginTop: '4px', animation: 'pulse 1.5s infinite' }}>🔴 Recording audio...</p>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary lg" style={{ width: '100%' }}>
          <Check size={20} /> Submit Issue
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;
