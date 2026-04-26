import React from 'react';
import ReportsList from './ReportsList';

const GovernmentDashboard = () => {
	return (
		<div className="government-dashboard-container">
			<h1>Government Dashboard</h1>
			<ReportsList showAll={true} />
		</div>
	);
};

export default GovernmentDashboard;
