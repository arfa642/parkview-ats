import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';

export default function Returns() {
  const { assets, employees, assignments, returns, addReturn, deleteMultipleReturns, updateReturn } = useAssets();
  const { isReadOnly } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const activeAssignments = assignments.filter(a => a.status === 'Active');

  const [formData, setFormData] = useState({
    assetSelection: activeAssignments.length > 0 ? activeAssignments[0].assetTag : '',
    condition: 'Good',
    reason: ''
  });

  // Ctrl+A and Escape support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setIsSelectionMode(true);
        if (selectedIds.length === returns.length && returns.length > 0) {
          setSelectedIds([]);
        } else {
          setSelectedIds(returns.map(r => r.id));
        }
      } else if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [returns, selectedIds, isSelectionMode]);

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
    setFormData({
      assetSelection: activeAssignments.length > 0 ? activeAssignments[0].assetTag : '',
      condition: 'Good',
      reason: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const returnToEdit = returns.find(r => r.id === selectedIds[0]);
    if (returnToEdit) {
      setEditingId(returnToEdit.id);
      setFormData({
        assetSelection: returnToEdit.assetTag,
        condition: returnToEdit.condition,
        reason: returnToEdit.remarks
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} return record(s)?`)) {
      deleteMultipleReturns(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assetSelection) return;

    const currentAssignment = assignments.find(a => a.assetTag === formData.assetSelection && a.status === 'Active');
    const matchedAsset = assets.find(a => a.tag === formData.assetSelection) || { name: '', brand: '' };

    if (editingId) {
      updateReturn(editingId, {
        assetTag: formData.assetSelection,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        employee: currentAssignment ? currentAssignment.employee : 'Unknown',
        condition: formData.condition,
        remarks: formData.reason
      });
    } else {
      addReturn({
        assetTag: formData.assetSelection,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        employee: currentAssignment ? currentAssignment.employee : 'Unknown',
        condition: formData.condition,
        remarks: formData.reason
      });
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Returns</h1>
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
              <MdAdd /> Return Asset
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
                    checked={selectedIds.length === returns.length && returns.length > 0}
                    onChange={() => {
                      if (selectedIds.length === returns.length) setSelectedIds([]);
                      else setSelectedIds(returns.map(r => r.id));
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
              <th>Condition</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((ret) => {
              const matchedEmp = employees.find(e => e.name === (ret.employee || ret.empName)) || {};
              return (
              <tr 
                key={ret.id} 
                className={selectedIds.includes(ret.id) ? 'selected-row' : ''}
                onClick={() => { if(isSelectionMode) handleCheckboxChange(ret.id); }}
                style={{cursor: isSelectionMode ? 'pointer' : 'default'}}
              >
                {isSelectionMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(ret.id)}
                      onChange={() => {}} // handled by row click
                    />
                  </td>
                )}
                <td>{ret.id}</td>
                <td>{ret.assetTag}</td>
                <td>{ret.assetName}</td>
                <td>{ret.model}</td>
                <td>{ret.employee || ret.empName}</td>
                <td>{matchedEmp.empId || 'N/A'}</td>
                <td>{matchedEmp.department || 'N/A'}</td>
                <td>{ret.date}</td>
                <td>{ret.condition}</td>
                <td>{ret.remarks}</td>
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
                <h3>{editingId ? 'Edit Return' : 'Return Asset'}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setIsModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            
            <div className="modal-body text-center">
              <form onSubmit={handleSubmit} className="assign-form">
                <div className="form-group vertical">
                  <label>Select Asset:</label>
                  <select 
                    name="assetSelection" 
                    value={formData.assetSelection} 
                    onChange={handleInputChange}
                    className="search-input"
                  >
                    {assets.map(ast => (
                      <option key={ast.id} value={ast.tag}>
                        {ast.id} - {ast.tag} - {ast.brand}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group vertical mt-4">
                  <label>Condition:</label>
                  <select 
                    name="condition" 
                    value={formData.condition} 
                    onChange={handleInputChange}
                    className="search-input"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="form-group vertical mt-4">
                  <label>Reason of Return:</label>
                  <input 
                    type="text" 
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{backgroundColor: 'transparent', border: '1px solid #4b5563 !important', color: 'var(--text-primary)'}}
                  />
                </div>
                
                <div className="form-actions mt-4">
                  <button type="submit" className="btn return-action-btn w-full justify-center">
                    {editingId ? 'Update' : 'Return'}
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
