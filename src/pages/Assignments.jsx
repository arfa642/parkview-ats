import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';

export default function Assignments() {
  const { assets, employees, assignments, addAssignment, deleteMultipleAssignments, updateAssignment } = useAssets();
  const { isReadOnly } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Form State
  const [assetSearch, setAssetSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Ctrl+A and Escape support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setIsSelectionMode(true);
        if (selectedIds.length === assignments.length && assignments.length > 0) {
          setSelectedIds([]);
        } else {
          setSelectedIds(assignments.map(a => a.id));
        }
      } else if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assignments, selectedIds, isSelectionMode]);

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
    setAssetSearch('');
    setEmployeeSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const assignmentToEdit = assignments.find(a => a.id === selectedIds[0]);
    if (assignmentToEdit) {
      setEditingId(assignmentToEdit.id);
      setAssetSearch(assignmentToEdit.assetTag);
      setEmployeeSearch(assignmentToEdit.employee);
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} assignment(s)?`)) {
      deleteMultipleAssignments(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const assetTag = assetSearch.split(' - ')[1] || assetSearch;
    const employeeName = employeeSearch.split(' - ')[1] || employeeSearch;
    const matchedAsset = assets.find(a => a.tag === assetTag) || { brand: '' };

    if (editingId) {
      updateAssignment(editingId, {
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        employee: employeeName
      });
    } else {
      addAssignment({
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        employee: employeeName
      });
    }
    
    setIsModalOpen(false);
    setAssetSearch('');
    setEmployeeSearch('');
    setEditingId(null);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="page-content assignments-page">
      <div className="page-header">
        <h1>Asset Assignments</h1>
        {!isReadOnly && (
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
              <MdAdd /> Assign Asset
            </button>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {isSelectionMode && (
                <th style={{width: '40px'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === assignments.length && assignments.length > 0}
                    onChange={() => {
                      if (selectedIds.length === assignments.length) setSelectedIds([]);
                      else setSelectedIds(assignments.map(a => a.id));
                    }}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Serial No.</th>
              <th>Asset Name</th>
              <th>Model</th>
              <th>Employee</th>
              <th>Emp ID</th>
              <th>Emp Dept</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => {
              const matchedEmp = employees.find(e => e.name === assignment.employee) || {};
              return (
              <tr 
                key={assignment.id} 
                className={selectedIds.includes(assignment.id) ? 'selected-row' : ''}
                onClick={() => { if(isSelectionMode) handleCheckboxChange(assignment.id); }}
                style={{cursor: isSelectionMode ? 'pointer' : 'default'}}
              >
                {isSelectionMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(assignment.id)}
                      onChange={() => {}} // handled by row click
                    />
                  </td>
                )}
                <td>{assignment.id}</td>
                <td>{assignment.assetTag}</td>
                <td>{assignment.assetName}</td>
                <td>{assignment.model}</td>
                <td>{assignment.employee}</td>
                <td>{matchedEmp.empId || 'N/A'}</td>
                <td>{matchedEmp.department || 'N/A'}</td>
                <td>{assignment.date}</td>
                <td>{assignment.status}</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon"></span>
                <h3>{editingId ? 'Edit Assignment' : 'Assign Asset'}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setIsModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            
            <div className="modal-body text-center">
              <form onSubmit={handleSubmit} className="assign-form">
                <div className="form-group vertical">
                  <label>Select Asset:</label>
                  <input 
                    type="text" 
                    list="assets-list" 
                    className="search-input"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Search asset..."
                    required
                  />
                  <datalist id="assets-list">
                    {assets.map(asset => (
                      <option key={asset.id} value={`${asset.id} - ${asset.tag} - ${asset.brand}`} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group vertical mt-4">
                  <label>Select Employee:</label>
                  <input 
                    type="text" 
                    list="employees-list" 
                    className="search-input"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Search employee..."
                    required
                  />
                  <datalist id="employees-list">
                    {employees.map(emp => (
                      <option key={emp.id} value={`${emp.empId} - ${emp.name}`} />
                    ))}
                  </datalist>
                </div>
                
                <div className="form-actions mt-4">
                  <button type="submit" className="btn blue-btn w-full justify-center">
                    {editingId ? 'Update' : 'Assign'}
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
