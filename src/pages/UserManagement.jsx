import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MdEdit, MdDelete, MdAdd, MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function UserManagement() {
  const { currentUser, users, addUser, updateUser, deleteUser, hasEditPermission } = useAuth();
  const { addToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', role: '', password: '' });
  const [visiblePasswordId, setVisiblePasswordId] = useState(null);

  const canEdit = hasEditPermission('Users') || currentUser?.role === 'Executive' || currentUser?.role === 'Developer';

  if (!canEdit && currentUser?.role !== 'Executive' && currentUser?.role !== 'Developer') {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, username: user.username, role: user.role, password: user.password });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', role: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.role || !formData.password) {
      addToast("All fields are required.", "error");
      return;
    }

    if (editingUser) {
      if ((editingUser.role === 'Executive' || editingUser.role === 'Developer') && formData.role !== editingUser.role && currentUser.role !== 'Developer') {
        addToast("Cannot change the role of an Executive or Developer.", "error");
        return;
      }
      updateUser(editingUser.id, formData);
      addToast("User updated successfully.", "success");
    } else {
      // Check if username exists
      if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        addToast("Username already exists.", "error");
        return;
      }
      addUser(formData);
      addToast("User added successfully.", "success");
    }
    closeModal();
  };

  const handleDelete = (id, role) => {
    if (role === 'Executive' || role === 'Developer') {
      addToast("Cannot delete Executive or Developer accounts.", "error");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
      addToast("User deleted.", "success");
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">User Management</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage login accounts for the system.
          </p>
        </div>
        <button className="btn primary-btn" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdAdd /> Add User
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th style={{ textAlign: 'center' }}>Password</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: visiblePasswordId === user.id ? 'normal' : '2px' }}>
                      {visiblePasswordId === user.id ? user.password : '••••••••'}
                    </span>
                    {(currentUser?.role === 'Executive' || currentUser?.role === 'Developer') && (
                      <button 
                        onClick={() => setVisiblePasswordId(visiblePasswordId === user.id ? null : user.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        title={visiblePasswordId === user.id ? "Hide Password" : "Show Password"}
                      >
                        {visiblePasswordId === user.id ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexDirection: 'row' }}>
                    <button 
                      onClick={() => openModal(user)} 
                      title="Edit"
                      style={{ 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '0'
                      }}
                    >
                      <MdEdit size={18} />
                    </button>
                    {(user.role !== 'Executive' && user.role !== 'Developer') && (
                      <button 
                        onClick={() => handleDelete(user.id, user.role)} 
                        title="Delete"
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none',
                          padding: '6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MdDelete size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>{editingUser ? 'Edit User' : 'Add User'}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={closeModal}><MdClose /></span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="modal-body asset-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. John Doe"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  placeholder="e.g. jdoe123"
                  className="form-control"
                  disabled={editingUser && (editingUser.role === 'Executive' || editingUser.role === 'Developer')}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="form-control"
                  disabled={editingUser && (editingUser.role === 'Executive' || editingUser.role === 'Developer')}
                >
                  <option value="">Select Role</option>
                  <option value="HR">HR</option>
                  <option value="CEO">CEO</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Developer">Developer</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="text" 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Enter a secure password"
                  className="form-control"
                />
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={closeModal} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>Cancel</button>
                <button type="submit" className="btn primary-btn">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
