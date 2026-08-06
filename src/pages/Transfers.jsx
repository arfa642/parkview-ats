import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';
import Select from 'react-select';

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#1f2937', // Solid dark color
    borderColor: '#374151',
    color: '#f9fafb',
    minHeight: '40px',
    boxShadow: 'none',
    textAlign: 'left',
    '&:hover': {
      borderColor: '#9ca3af'
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    justifyContent: 'flex-start',
    textAlign: 'left',
    padding: '0 8px',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#f9fafb',
    textAlign: 'left',
    margin: 0,
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#1f2937', // Solid dark color
    border: '1px solid #374151',
    textAlign: 'left',
  }),
  menuPortal: (base) => ({ 
    ...base, 
    zIndex: 9999 
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#374151' : '#1f2937', // Solid dark colors
    color: '#f9fafb',
    cursor: 'pointer',
    textAlign: 'left',
    justifyContent: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    '&:active': {
      backgroundColor: '#d4af37',
    }
  }),
  input: (provided) => ({
    ...provided,
    color: '#f9fafb',
    textAlign: 'left',
    margin: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
    textAlign: 'left',
  }),
};

export default function Transfers() {
  const { assets, employees, assignments, transfers, addTransfer, deleteMultipleTransfers, updateTransfer } = useAssets();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission('Transfers');
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

    const assetTag = formData.assetSelection;
    const toEmployeeName = formData.toEmployee;

    const currentAssignment = assignments.find(a => a.assetTag === assetTag && a.status === 'Active');
    const matchedAsset = assets.find(a => a.tag === assetTag) || { name: '', brand: '' };
    
    if (!editingId && currentAssignment && currentAssignment.employee === toEmployeeName) {
      alert("SELF TRANSFER NOT ALLOWED: The asset is already assigned to this employee.");
      return;
    }

    const transferPath = `${currentAssignment ? currentAssignment.employee : 'Unknown'} -> ${toEmployeeName}`;

    if (editingId) {
      updateTransfer(editingId, {
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.model || matchedAsset.brand,
        transferPath: transferPath,
        fromEmployee: currentAssignment ? currentAssignment.employee : 'Unknown',
        toEmployee: toEmployeeName
      });
    } else {
      addTransfer({
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.model || matchedAsset.brand,
        transferPath: transferPath,
        fromEmployee: currentAssignment ? currentAssignment.employee : 'Unknown',
        toEmployee: toEmployeeName
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
        {canEdit && (
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
              <th>Category</th>
              <th>Brand & Model</th>
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
              const matchedFromEmp = employees.find(e => e.name?.toLowerCase().trim() === fromEmpName?.toLowerCase().trim()) || {};
              const matchedToEmp = employees.find(e => e.name?.toLowerCase().trim() === transfer.toEmployee?.toLowerCase().trim()) || {};
              const matchedAsset = assets.find(a => a.tag === transfer.assetTag) || {};
              const brandStr = matchedAsset.brand || '';
              const modelStr = matchedAsset.model || transfer.model || '';
              const brandAndModel = brandStr && modelStr ? 
                (modelStr.toLowerCase().includes(brandStr.toLowerCase()) ? modelStr : `${brandStr} ${modelStr}`) 
                : modelStr || brandStr || 'N/A';
              const category = matchedAsset.name || transfer.assetName || 'N/A';
              
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
                <td style={{textTransform: 'capitalize'}}>{category}</td>
                <td style={{textTransform: 'capitalize'}}>{brandAndModel}</td>
                <td>{transfer.transferPath}</td>
                <td>{fromEmpName}</td>
                <td>{matchedFromEmp.empId || matchedFromEmp.id || 'N/A'}</td>
                <td>{matchedFromEmp.department || 'N/A'}</td>
                <td>{transfer.toEmployee || 'N/A'}</td>
                <td>{matchedToEmp.empId || matchedToEmp.id || 'N/A'}</td>
                <td>{matchedToEmp.department || 'N/A'}</td>
                <td>{transfer.date ? new Date(transfer.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
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
                  <Select 
                    options={assignments.filter(a => a.status === 'Active').map(assign => {
                      const ast = assets.find(a => a.tag === assign.assetTag) || {};
                      const bStr = ast.brand || '';
                      const mStr = ast.model || '';
                      const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr;
                      return {
                        value: assign.assetTag,
                        label: `${ast.id || assign.id} - ${assign.assetTag} - ${bm} (${assign.employee})`
                      };
                    })}
                    value={formData.assetSelection ? { 
                      value: formData.assetSelection, 
                      label: (function() {
                        const assign = assignments.find(a => a.assetTag === formData.assetSelection && a.status === 'Active');
                        const ast = assets.find(a => a.tag === formData.assetSelection) || {};
                        const bStr = ast.brand || '';
                        const mStr = ast.model || '';
                        const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr;
                        return `${ast.id || ''} - ${formData.assetSelection} - ${bm} (${assign ? assign.employee : 'Unknown'})`;
                      })()
                    } : null}
                    onChange={(option) => handleInputChange({ target: { name: 'assetSelection', value: option ? option.value : '' } })}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    placeholder="Search assigned asset..."
                    isClearable
                    required
                  />
                </div>

                <div className="form-group vertical mt-4">
                  <label>To Employee:</label>
                  <Select 
                    options={employees.map(emp => ({
                      value: emp.name,
                      label: `${emp.empId || emp.id} - ${emp.name}`
                    }))}
                    value={formData.toEmployee ? { 
                      value: formData.toEmployee, 
                      label: (function() {
                        const emp = employees.find(e => e.name === formData.toEmployee);
                        return emp ? `${emp.empId || emp.id} - ${emp.name}` : formData.toEmployee;
                      })()
                    } : null}
                    onChange={(option) => handleInputChange({ target: { name: 'toEmployee', value: option ? option.value : '' } })}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    placeholder="Search employee..."
                    isClearable
                    required
                  />
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
