import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';

export default function Transfers() {
  const { assets, employees, assignments, transfers, addTransfer, deleteMultipleTransfers, updateTransfer } = useAssets();
  const { isReadOnly } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const activeAssignments = assignments.filter(a => a.status === 'Active');

  const [formData, setFormData] = useState({
    assetSelection: activeAssignments.length > 0 ? activeAssignments[0].assetTag : '',
    toEmployee: employees.length > 0 ? employees[0].name : ''
  });

  // Ctrl+A and Escape support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setIsSelectionMode(true);
        if (selectedIds.length === transfers.length && transfers.length > 0) {
          setSelectedIds([]);
        } else {
          setSelectedIds(transfers.map(t => t.id));
        }
      } else if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transfers, selectedIds, isSelectionMode]);

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
      toEmployee: employees.length > 0 ? employees[0].name : ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const transferToEdit = transfers.find(t => t.id === selectedIds[0]);
    if (transferToEdit) {
      setEditingId(transferToEdit.id);
      setFormData({
        assetSelection: transferToEdit.assetTag,
        toEmployee: transferToEdit.transferPath.split(' -> ')[1] || ''
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} transfer record(s)?`)) {
      deleteMultipleTransfers(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assetSelection || !formData.toEmployee) return;

    const currentAssignment = assignments.find(a => a.assetTag === formData.assetSelection && a.status === 'Active');
    const matchedAsset = assets.find(a => a.tag === formData.assetSelection) || { name: '', brand: '' };
    
    if (!editingId && currentAssignment && currentAssignment.employee === formData.toEmployee) {
      alert("SELF TRANSFER NOT ALLOWED: The asset is already assigned to this employee.");
      return;
    }

    const transferPath = `${currentAssignment ? currentAssignment.employee : 'Unknown'} -> ${formData.toEmployee}`;

    if (editingId) {
      updateTransfer(editingId, {
        assetTag: formData.assetSelection,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        transferPath: transferPath,
        fromEmployee: currentAssignment ? currentAssignment.employee : 'Unknown',
        toEmployee: formData.toEmployee
      });
    } else {
      addTransfer({
        assetTag: formData.assetSelection,
        assetName: matchedAsset.name,
        model: matchedAsset.brand,
        transferPath: transferPath,
        fromEmployee: currentAssignment ? currentAssignment.employee : 'Unknown',
        toEmployee: formData.toEmployee
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
        <h1>Asset Transfers</h1>
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
              <MdAdd /> New Transfer
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
                    checked={selectedIds.length === transfers.length && transfers.length > 0}
                    onChange={() => {
                      if (selectedIds.length === transfers.length) setSelectedIds([]);
                      else setSelectedIds(transfers.map(t => t.id));
                    }}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Serial No.</th>
              <th>Asset Name</th>
              <th>Model</th>
              <th>Transfer Path</th>
              <th>From Employee</th>
              <th>From Emp ID</th>
              <th>From Emp Dept</th>
              <th>To Employee</th>
              <th>To Emp ID</th>
              <th>To Emp Dept</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => {
              const fromEmpName = transfer.fromEmployee || (transfer.transferPath ? transfer.transferPath.split(' -> ')[0] : 'Unknown');
              const matchedFromEmp = employees.find(e => e.name === fromEmpName) || {};
              const matchedToEmp = employees.find(e => e.name === transfer.toEmployee) || {};
              return (
              <tr 
                key={transfer.id} 
                className={selectedIds.includes(transfer.id) ? 'selected-row' : ''}
                onClick={() => { if(isSelectionMode) handleCheckboxChange(transfer.id); }}
                style={{cursor: isSelectionMode ? 'pointer' : 'default'}}
              >
                {isSelectionMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(transfer.id)}
                      onChange={() => {}} // handled by row click
                    />
                  </td>
                )}
                <td>{transfer.id}</td>
                <td>{transfer.assetTag}</td>
                <td style={{textTransform: 'capitalize'}}>{transfer.assetName}</td>
                <td>{transfer.model}</td>
                <td>{transfer.transferPath}</td>
                <td>{fromEmpName}</td>
                <td>{matchedFromEmp.empId || 'N/A'}</td>
                <td>{matchedFromEmp.department || 'N/A'}</td>
                <td>{transfer.toEmployee || 'N/A'}</td>
                <td>{matchedToEmp.empId || 'N/A'}</td>
                <td>{matchedToEmp.department || 'N/A'}</td>
                <td>{transfer.date}</td>
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
                <h3>{editingId ? 'Edit Transfer' : 'Transfer Asset'}</h3>
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
                  <label>To Employee:</label>
                  <select 
                    name="toEmployee" 
                    value={formData.toEmployee} 
                    onChange={handleInputChange}
                    className="search-input"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.empId} - {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions mt-4">
                  <button type="submit" className="btn blue-btn w-full justify-center">
                    {editingId ? 'Update' : 'Transfer'}
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
