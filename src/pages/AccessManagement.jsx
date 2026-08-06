import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../context/AssetContext';
import { useToast } from '../context/ToastContext';
import { MdClose, MdSecurity } from 'react-icons/md';

const ALL_PAGES = ['Dashboard', 'Assets', 'Employees', 'Assignments', 'Transfers', 'Returns', 'Employee Assets', 'Reports', 'Audit Log', 'Import Data', 'Settings', 'Users', 'Access'];

// Pages that don't have "Edit" capabilities
const VIEW_ONLY_PAGES = ['Dashboard', 'Settings', 'Access'];

export default function AccessManagement() {
  const { currentUser, permissions, updatePermissions, users } = useAuth();
  const { addAuditLog } = useAssets();
  const { addToast } = useToast();
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [modalPermissions, setModalPermissions] = useState(null);

  if (currentUser?.role !== 'Executive' && currentUser?.role !== 'Developer') {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const openModal = (role) => {
    setSelectedRole(role);
    setModalPermissions({
      allowedPages: permissions[role]?.allowedPages || [],
      editPages: permissions[role]?.editPages || []
    });
  };

  const closeModal = () => {
    setSelectedRole(null);
    setModalPermissions(null);
  };

  const handleToggleView = (pageName, checked) => {
    if ((selectedRole === 'Executive' || selectedRole === 'Developer') && pageName === 'Access' && !checked) {
      addToast("Cannot remove Access Management from this role.", "error");
      return;
    }

    setModalPermissions(prev => {
      let newAllowed = [...prev.allowedPages];
      let newEdit = [...prev.editPages];
      
      if (checked) {
        if (!newAllowed.includes(pageName)) newAllowed.push(pageName);
      } else {
        newAllowed = newAllowed.filter(p => p !== pageName);
        // If they can't view, they can't edit
        newEdit = newEdit.filter(p => p !== pageName);
      }
      
      return { ...prev, allowedPages: newAllowed, editPages: newEdit };
    });
  };

  const handleToggleEdit = (pageName, checked) => {
    setModalPermissions(prev => {
      let newEdit = [...prev.editPages];
      
      if (checked) {
        if (!newEdit.includes(pageName)) newEdit.push(pageName);
      } else {
        newEdit = newEdit.filter(p => p !== pageName);
      }
      
      return { ...prev, editPages: newEdit };
    });
  };

  const handleSave = () => {
    updatePermissions(selectedRole, modalPermissions);
    addAuditLog('Updated Access Permissions', `Updated page access & permissions for role '${selectedRole}'`);
    addToast(`Permissions updated for ${selectedRole}`, "success");
    closeModal();
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2 className="page-title">Access Management</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Granularly manage what different roles are allowed to view and edit in the system.
        </p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Pages Allowed</th>
              <th>Pages Editable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const allowedPages = permissions[user.role]?.allowedPages || [];
              const editPages = permissions[user.role]?.editPages || [];
              
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{user.name}</div>
                  </td>
                  <td>{user.username}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {allowedPages.length} / {ALL_PAGES.length}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {editPages.length}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => openModal(user.role)}
                    >
                      <MdSecurity /> Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRole && modalPermissions && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>Manage Permissions: {selectedRole}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={closeModal}><MdClose /></span>
              </div>
            </div>
            <div className="modal-body">
              
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Page Name</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>View</th>
                      <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Edit Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_PAGES.map(page => {
                      const canView = modalPermissions.allowedPages.includes(page);
                      const canEdit = modalPermissions.editPages.includes(page);
                      const isViewOnly = VIEW_ONLY_PAGES.includes(page);

                      return (
                        <tr key={page} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: '500', fontSize: '0.9rem' }}>{page}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <label className="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={canView}
                                onChange={(e) => handleToggleView(page, e.target.checked)}
                              />
                              <span className="slider"></span>
                            </label>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {!isViewOnly ? (
                              <label className="toggle-switch">
                                <input 
                                  type="checkbox" 
                                  checked={canEdit}
                                  disabled={!canView}
                                  onChange={(e) => handleToggleEdit(page, e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', display: 'flex', alignItems: 'center', height: '24px' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={closeModal} style={{ padding: '8px 16px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button onClick={handleSave} className="btn primary-btn" style={{ padding: '8px 24px' }}>Save Permissions</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
