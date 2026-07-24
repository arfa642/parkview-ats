import React from 'react';
import { useAssets } from '../context/AssetContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MdDevices, MdCheckCircle, MdAssignment, MdPeople } from 'react-icons/md';

export default function Dashboard() {
  const { assets, employees, auditLogs } = useAssets();

  const totalAssets = assets.length;
  const available = assets.filter(a => a.status === 'Available').length;
  const assigned = assets.filter(a => a.status === 'Assigned').length;
  const totalEmployees = employees ? employees.length : 0;

  const pieData = [
    { name: 'Available', value: available },
    { name: 'Assigned', value: assigned },
  ];

  const COLORS = ['#22c55e', '#3b82f6']; // Green for available, blue for assigned

  // Calculate category data
  const categoryCounts = assets.reduce((acc, asset) => {
    const name = asset.name.toUpperCase();
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(categoryCounts).map(key => ({
    name: key,
    count: categoryCounts[key]
  })).sort((a, b) => b.count - a.count);

  const recentLogs = auditLogs ? [...auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5) : [];

  return (
    <div className="page-content dashboard-page">
      <h1>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <MdDevices size={28} />
          </div>
          <div className="stat-info">
            <h3>TOTAL ASSETS</h3>
            <p className="stat-value">{totalAssets}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <MdCheckCircle size={28} />
          </div>
          <div className="stat-info">
            <h3>AVAILABLE</h3>
            <p className="stat-value">{available}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
            <MdAssignment size={28} />
          </div>
          <div className="stat-info">
            <h3>ASSIGNED</h3>
            <p className="stat-value">{assigned}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
            <MdPeople size={28} />
          </div>
          <div className="stat-info">
            <h3>EMPLOYEES</h3>
            <p className="stat-value">{totalEmployees}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Asset Status</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-color" style={{backgroundColor: COLORS[0]}}></span>Available</span>
              <span className="legend-item"><span className="legend-color" style={{backgroundColor: COLORS[1]}}></span>Assigned</span>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Assets by Category</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 12}} angle={-45} textAnchor="end" />
                <YAxis tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip cursor={{fill: '#374151'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: '20px' }}>
        <h3>Recent System Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No recent activity to show.</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${log.action.includes('Delete') ? '#ef4444' : log.action.includes('Create') ? '#22c55e' : '#3b82f6'}` }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '500', color: 'var(--text-primary)' }}>{log.action} <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.85rem' }}>by {log.user}</span></p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.details}</p>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
