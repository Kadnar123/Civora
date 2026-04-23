import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, ArrowRight } from 'lucide-react';

const CitizenLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="gateway-container">
      
      {/* Citizen Side */}
      <div className="gateway-split citizen-side" onClick={() => navigate('/login')}>
        <div className="gateway-content">
          <div className="gateway-icon-wrapper">
             <Users size={64} color="var(--accent-primary)" />
          </div>
          <h1 className="gateway-title">Citizen Portal</h1>
          <p className="gateway-subtitle">
            Report civic issues, track real-time resolution progress, and work with local authorities.
          </p>
          <button className="btn btn-outline lg gateway-btn" onClick={(e) => { e.stopPropagation(); navigate('/login'); }}>
            Login as Citizen <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* VS Divider in middle */}
      <div className="gateway-divider">
        <div className="gateway-logo">CIVORA</div>
      </div>

      {/* Government Side */}
      <div className="gateway-split admin-side" onClick={() => navigate('/admin/login')}>
        <div className="gateway-content">
          <div className="gateway-icon-wrapper admin-icon">
             <ShieldCheck size={64} color="#10b981" />
          </div>
          <h1 className="gateway-title">Government Portal</h1>
          <p className="gateway-subtitle">
            Manage reports, resolve issues, and view analytics exclusively for verified officials.
          </p>
          <button className="btn btn-outline lg gateway-btn admin-btn" onClick={(e) => { e.stopPropagation(); navigate('/admin/login'); }}>
            Login as Government <ArrowRight size={20} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default CitizenLanding;
