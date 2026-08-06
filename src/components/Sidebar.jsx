import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MdSpeed,
  MdLaptop,
  MdPeople,
  MdCheckBox,
  MdSwapHoriz,
  MdUndo,
  MdBusiness,
  MdInsertDriveFile,
  MdCloudUpload,
  MdSettings,
  MdClose,
  MdDarkMode,
  MdLightMode,
  MdLogout,
  MdPerson,
  MdEdit,
  MdHistory,
  MdSecurity
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import logoLight from '../assets/pvatsl.png';
import logoDark from '../assets/pvatsld.png';
import logoMobileLight from '../assets/ml.png';
import logoMobileDark from '../assets/md.png';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <MdSpeed />, roles: ['Developer', 'CEO', 'Executive', 'HR'] },
  { name: 'Assets', path: '/assets', icon: <MdLaptop />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Employees', path: '/employees', icon: <MdPeople />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Assignments', path: '/assignments', icon: <MdCheckBox />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Transfers', path: '/transfers', icon: <MdSwapHoriz />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Returns', path: '/returns', icon: <MdUndo />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Employee Assets', path: '/employee-assets', icon: <MdBusiness />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Reports', path: '/reports', icon: <MdInsertDriveFile />, roles: ['Developer', 'Executive', 'HR', 'CEO'] },
  { name: 'Audit Log', path: '/audit-log', icon: <MdHistory />, roles: ['Developer', 'Executive'] },
  { name: 'Import Data', path: '/import-data', icon: <MdCloudUpload />, roles: ['Developer', 'Executive'] },
  { name: 'Settings', path: '/settings', icon: <MdSettings />, roles: ['Developer', 'Executive'] },
  { name: 'Users', path: '/users', icon: <MdPeople />, roles: ['Developer', 'Executive'] },
  { name: 'Access', path: '/access-management', icon: <MdSecurity />, roles: ['Developer', 'Executive'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const [theme, setTheme] = useState('dark');
  const { currentUser, permissions, logout, updateProfile } = useAuth();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
    }
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (profilePassword && profilePassword !== confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    const res = await updateProfile(profileName, profilePassword, oldPassword);
    if (profilePassword && !res?.success) {
      alert(res?.message || "Failed to update profile");
      return;
    }
    setIsProfileModalOpen(false);
    setProfilePassword('');
    setOldPassword('');
    setConfirmPassword('');
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { msg: '', color: 'transparent' };
    let score = 0;
    if (pwd.length > 7) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score < 2) return { msg: 'Weak - Add numbers & symbols', color: '#ef4444' };
    if (score === 2) return { msg: 'Fair - Add uppercase or symbols', color: '#eab308' };
    if (score === 3) return { msg: 'Good - Add more variety', color: '#3b82f6' };
    return { msg: 'Strong', color: '#22c55e' };
  };
  const strength = getPasswordStrength(profilePassword);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '16px 16px 8px 16px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          {setIsOpen && (
            <button className="mobile-close-btn" onClick={() => setIsOpen(false)}>
              <MdClose size={28} />
            </button>
          )}
          <img
            src={theme === 'light' ? logoLight : logoDark}
            alt="Parkview City ATS Logo"
            className="desktop-sidebar-logo"
            style={{ width: '100%', maxWidth: '220px', height: 'auto', objectFit: 'contain' }}
          />
          <img
            src={theme === 'light' ? logoMobileLight : logoMobileDark}
            alt="Parkview City ATS Logo Mobile"
            className="mobile-sidebar-logo"
            style={{ width: '100%', maxWidth: '220px', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        <nav className="sidebar-nav">
          {navItems.filter(item => {
            const allowed = permissions?.[currentUser?.role]?.allowedPages || [];
            return allowed.includes(item.name);
          }).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen && setIsOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="developer-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--primary-color)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MdPerson size={20} />
                </div>
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600', lineHeight: 1, whiteSpace: 'nowrap' }}>{currentUser?.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1 }}>{currentUser?.role}</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                title="Edit Profile"
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <MdEdit size={16} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '4px', opacity: 0.8 }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Developed By</p>
              <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600' }}>Muhammad Arfa</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IT Intern @ PVC</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={logout}
                className="theme-btn"
                style={{ flex: 3, justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <MdLogout size={18} /> Logout
              </button>
              <button
                className="theme-btn"
                onClick={() => toggleTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{ flex: 1, height: '36px', padding: 0, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? <MdLightMode size={18} /> : <MdDarkMode size={18} />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isProfileModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>Edit Profile</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setIsProfileModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProfileSubmit} className="asset-form">
                <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <label style={{ width: '100%', textAlign: 'left', fontWeight: '500' }}>Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <label style={{ width: '100%', textAlign: 'left', fontWeight: '500' }}>Old Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter old password if changing it"
                    required={!!profilePassword}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <label style={{ width: '100%', textAlign: 'left', fontWeight: '500' }}>New Password</label>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    {profilePassword && (
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: strength.color, fontWeight: '500' }}>
                        Security: {strength.msg}
                      </div>
                    )}
                  </div>
                </div>
                {profilePassword && (
                  <div className="form-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <label style={{ width: '100%', textAlign: 'left', fontWeight: '500' }}>Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Type new password again"
                      required
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
                <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn blue-btn" style={{ padding: '10px 24px', fontWeight: '600', fontSize: '0.95rem' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
