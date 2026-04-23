export const mockReports = [
  {
    id: "REP-1049",
    title: "Pothole on Main St",
    category: "Infrastructure",
    status: "Open",
    priority: "High",
    date: "2026-04-04",
    location: "Downtown",
    lat: 51.505,
    lng: -0.09,
    department: "Public Works",
    description: "Deep pothole causing vehicle damage near the intersection of Main and 4th.",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400",
    history: [
      { date: "2026-04-03 10:00", text: "Report submitted by user." },
      { date: "2026-04-04 08:30", text: "Assigned to Public Works." }
    ]
  },
  {
    id: "REP-1050",
    title: "Broken Streetlight",
    category: "Lighting",
    status: "In Progress",
    priority: "Medium",
    date: "2026-04-03",
    location: "Westside",
    lat: 51.51,
    lng: -0.1,
    department: "Electricity",
    description: "Streetlight flickering and going out completely at night.",
    image: "https://images.unsplash.com/photo-1510413009472-74892c90f20f?auto=format&fit=crop&q=80&w=400",
    history: [
      { date: "2026-04-03 20:00", text: "Report submitted." },
      { date: "2026-04-04 09:15", text: "Technician dispatched." }
    ]
  },
  {
    id: "REP-1051",
    title: "Overflowing Trash Bin",
    category: "Sanitation",
    status: "Resolved",
    priority: "Low",
    date: "2026-04-01",
    location: "City Park",
    lat: 51.49,
    lng: -0.08,
    department: "Waste Management",
    description: "Trash overflowing near the children's play area.",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400",
    history: [
      { date: "2026-04-01 14:00", text: "Report submitted." },
      { date: "2026-04-02 10:00", text: "Cleaned by sanitation crew." }
    ]
  },
  {
    id: "REP-1052",
    title: "Fallen Tree Branch",
    category: "Parks & Rec",
    status: "Open",
    priority: "High",
    date: "2026-04-04",
    location: "Eastside",
    lat: 51.515,
    lng: -0.07,
    department: "Parks & Rec",
    description: "Large tree branch blocking the pedestrian walkway.",
    image: "https://images.unsplash.com/photo-1596791995874-5c9110dd06a4?auto=format&fit=crop&q=80&w=400",
    history: [
      { date: "2026-04-04 11:45", text: "Report submitted." }
    ]
  }
];

export const kpiData = {
  total: 124,
  open: 18,
  resolved: 94,
  avgTime: "4.2 Days"
};

export const trendData = [
  { name: 'Mon', reports: 12 },
  { name: 'Tue', reports: 19 },
  { name: 'Wed', reports: 15 },
  { name: 'Thu', reports: 22 },
  { name: 'Fri', reports: 30 },
  { name: 'Sat', reports: 14 },
  { name: 'Sun', reports: 8 },
];
