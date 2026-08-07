import React, { useState, useEffect } from 'react';
import { useAssets, DEPARTMENT_LIST } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose, MdSearch } from 'react-icons/md';

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteMultipleEmployees } = useAssets();
  const { hasEditPermission } = useAuth();
  const canManageEmployees = hasEditPermission('Employees');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  
  // Form State
  const initialFormState = { empId: '', name: '', department: 'Accounts', designation: '' };
  const [formData, setFormData] = useState(initialFormState);

  // Extract ALL departments (combining predefined lists + existing employee departments)
  const predefinedDepartments = (() => {
    try {
      const saved = localStorage.getItem('pv_ats_predefined_lists');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departments && Array.isArray(parsed.departments)) {
          return parsed.departments;
        }
      }
    } catch (e) {}
    return DEPARTMENT_LIST;
  })();

  const departmentOptions = Array.from(new Set([
    ...predefinedDepartments,
    ...DEPARTMENT_LIST,
    ...employees.map(e => e.department).filter(Boolean)
  ])).sort();

  const filteredEmployees = employees.filter(emp => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      emp.name.toLowerCase().includes(term) || 
      emp.empId.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term) ||
      emp.designation.toLowerCase().includes(term);

    const matchesDept = selectedDepartment === 'ALL' || 
      (emp.department && emp.department.toLowerCase() === selectedDepartment.toLowerCase());

    return matchesSearch && matchesDept;
  });

  // Ctrl+A and Escape support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setIsSelectionMode(true);
        if (selectedIds.length === employees.length && employees.length > 0) {
          setSelectedIds([]);
        } else {
          setSelectedIds(employees.map(emp => emp.id));
        }
      } else if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [employees, selectedIds, isSelectionMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(selId => selId !== id) : [...prev, id]
    );
  };

  const toggleSelectionMode = (action) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    } else {
      if (action === 'delete' && selectedIds.length > 0) {
        handleDelete();
      } else if (action === 'edit' && selectedIds.length === 1) {
        openEditModal();
      }
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const empToEdit = employees.find(emp => emp.id === selectedIds[0]);
    if (empToEdit) {
      setEditingId(empToEdit.id);
      setFormData({
        empId: empToEdit.empId || empToEdit.id || '',
        name: empToEdit.name || '',
        department: empToEdit.department || 'Accounts',
        designation: empToEdit.designation || ''
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} employee(s)?`)) {
      deleteMultipleEmployees(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateEmployee(editingId, {
        empId: formData.empId,
        name: formData.name,
        department: formData.department,
        designation: formData.designation
      });
    } else {
      addEmployee({
        empId: formData.empId,
        name: formData.name,
        department: formData.department,
        designation: formData.designation
      });
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="page-content employees-page">
      <div className="page-header">
        <h1>Employee Management</h1>
        {canManageEmployees && (
          <div className="header-actions">
            {isSelectionMode && (
              <button 
                className="btn" 
                style={{backgroundColor: '#4b5563', color: 'white'}} 
                onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
              >
                Cancel
              </button>
            )}
            <button 
              className={`btn ${isSelectionMode && selectedIds.length === 0 ? 'disabled-btn' : 'red-btn'}`} 
              onClick={() => toggleSelectionMode('delete')}
            >
              <MdDelete /> {isSelectionMode && selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}
            </button>
            <button 
              className={`btn ${isSelectionMode && selectedIds.length !== 1 ? 'disabled-btn' : 'yellow-btn'}`}
              onClick={() => toggleSelectionMode('edit')}
            >
              <MdEdit /> Edit
            </button>
            <button className="btn yellow-btn" onClick={openAddModal}>
              <MdAdd /> Add Employee
            </button>
          </div>
        )}
      </div>

      <div className="toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '250px' }}>
          <MdSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employees..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Department Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Department:</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--search-bg)',
              color: 'var(--text-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Departments ({employees.length})</option>
            {departmentOptions.map(dept => {
              const count = employees.filter(e => e.department?.toLowerCase() === dept.toLowerCase()).length;
              return (
                <option key={dept} value={dept}>
                  {dept} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="table-container mt-4">
        <table className="data-table">
          <thead>
            <tr>
              {isSelectionMode && (
                <th style={{width: '40px'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={() => {
                      if (selectedIds.length === filteredEmployees.length) setSelectedIds([]);
                      else setSelectedIds(filteredEmployees.map(emp => emp.id));
                    }}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className={selectedIds.includes(emp.id) ? 'selected-row' : ''}
                onClick={() => { if(isSelectionMode) handleCheckboxChange(emp.id); }}
                style={{cursor: isSelectionMode ? 'pointer' : 'default'}}
              >
                {isSelectionMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(emp.id)}
                      onChange={() => {}} // handled by row click
                    />
                  </td>
                )}
                <td>{emp.empId || emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon"></span>
                <h3>{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setIsModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="asset-form">
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" name="empId" value={formData.empId} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <select name="department" value={formData.department} onChange={handleInputChange}>
                    {DEPARTMENT_LIST.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} required />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn yellow-btn submit-btn">
                    {editingId ? 'Update Employee' : 'Save Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
