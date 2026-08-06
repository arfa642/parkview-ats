import React from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdHistory } from 'react-icons/md';

export default function AuditLog() {
  const { auditLogs, clearAuditLogs } = useAssets();
  const { currentUser } = useAuth();

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to completely clear ALL system audit logs? This action cannot be undone.")) {
      clearAuditLogs();
    }
  };

  // Sort logs by date descending (newest first)
  const sortedLogs = [...auditLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>System Audit Log</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdHistory size={18} /> {sortedLogs.length} Events Recorded
          </div>
          {sortedLogs.length > 0 && (
            <button 
              onClick={handleClearLogs}
              className="btn"
              style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Clear All Logs
            </button>
          )}
        </div>
      </div>

      <div className="table-container" style={{ padding: '20px' }}>
        {sortedLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
            No activity logs recorded yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{log.user}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      {log.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: log.action.includes('Delete') ? '#ef4444' : 
                             log.action.includes('Create') ? '#22c55e' : 
                             log.action.includes('Update') ? '#eab308' : '#3b82f6',
                      fontWeight: '500'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
