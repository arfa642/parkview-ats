import React, { useState, useEffect } from 'react';
import { MdSave, MdCheckCircle, MdErrorOutline, MdDns, MdVpnKey, MdPerson } from 'react-icons/md';

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

export default function Settings() {
  const [formData, setFormData] = useState({
    server: '',
    port: '1433',
    database: '',
    user: '',
    password: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      const data = await res.json();
      if (res.ok) {
        setIsConnected(data.connected);
        setFormData({
          server: data.server || '',
          port: data.port || '1433',
          database: data.database || '',
          user: data.user || '',
          password: '' 
        });
      }
    } catch (err) {
      console.error("Backend unreachable", err);
      setStatus({ type: 'error', message: 'Cannot reach backend server. Make sure it is running.' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setIsConnected(true);
      } else {
        setStatus({ type: 'error', message: data.message });
        setIsConnected(false);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to connect to backend API.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>
        {`
          .settings-card {
            background-color: var(--search-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
          }
          
          .settings-input-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            margin-bottom: 1rem;
          }

          .settings-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .settings-input {
            width: 100%;
            padding: 0.875rem 1rem;
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 1rem;
            font-family: 'Inter', sans-serif;
            transition: all 0.2s ease;
          }

          .settings-input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
          }

          .settings-btn {
            width: 100%;
            padding: 1rem;
            background-color: var(--accent-color);
            color: #000;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            transition: background-color 0.2s ease, transform 0.1s ease;
            margin-top: 1rem;
          }

          .settings-btn:hover {
            background-color: var(--accent-hover);
          }

          .settings-btn:active {
            transform: scale(0.98);
          }

          .settings-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .status-banner {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-weight: 600;
            font-size: 1rem;
          }

          .status-banner.success {
            background-color: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
          }

          .status-banner.error {
            background-color: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
          }

          .grid-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 1.5rem;
          }
        `}
      </style>

      <div style={{ padding: '1.5rem 1.5rem 0', maxWidth: '800px', margin: '0 auto', flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
          Database Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: '1.4', margin: 0 }}>
          Configure your SQL Server connection details below. These settings will be applied immediately to the backend server.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
        <div className="settings-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Connection Status Banner */}
        <div className={`status-banner ${isConnected ? 'success' : 'error'}`}>
          {isConnected ? <MdCheckCircle size={24} /> : <MdErrorOutline size={24} />}
          <span>{isConnected ? 'Database Connected & Active' : 'Database Disconnected'}</span>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className="grid-row">
            <div className="settings-input-group">
              <label className="settings-label"><MdDns size={18} /> Server IP</label>
              <input 
                type="text" 
                className="settings-input" 
                name="server" 
                value={formData.server} 
                onChange={handleChange} 
                placeholder="e.g. 172.19.0.123" 
                required 
              />
            </div>
            
            <div className="settings-input-group">
              <label className="settings-label">Port</label>
              <input 
                type="text" 
                className="settings-input" 
                name="port" 
                value={formData.port} 
                onChange={handleChange} 
                placeholder="1433" 
                required 
              />
            </div>
          </div>

          <div className="settings-input-group">
            <label className="settings-label">Database Name</label>
            <input 
              type="text" 
              className="settings-input" 
              name="database" 
              value={formData.database} 
              onChange={handleChange} 
              placeholder="e.g. pv_ats_db" 
              required 
            />
          </div>

          <div className="settings-input-group">
            <label className="settings-label"><MdPerson size={18} /> Username</label>
            <input 
              type="text" 
              className="settings-input" 
              name="user" 
              value={formData.user} 
              onChange={handleChange} 
              placeholder="e.g. sa" 
              required 
            />
          </div>

          <div className="settings-input-group">
            <label className="settings-label"><MdVpnKey size={18} /> Password</label>
            <input 
              type="password" 
              className="settings-input" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Enter database password" 
              required 
            />
          </div>

          {status.message && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              borderRadius: '8px', 
              backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
              color: status.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              {status.message}
            </div>
          )}

          <button type="submit" className="settings-btn" disabled={loading}>
            {loading ? 'Connecting...' : <><MdSave size={22} /> Test & Save Connection</>}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
