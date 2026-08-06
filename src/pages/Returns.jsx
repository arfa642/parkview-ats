import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose } from 'react-icons/md';
import Select from 'react-select';

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#1f2937',
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
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    textAlign: 'left',
  }),
  menuPortal: (base) => ({ 
    ...base, 
    zIndex: 9999 
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#374151' : '#1f2937',
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

export default function Returns() {
  const { assets, employees, assignments, returns, addReturn, deleteMultipleReturns, updateReturn } = useAssets();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission('Returns');
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
              <th>Category</th>
              <th>Brand & Model</th>
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
              const matchedEmp = employees.find(e => e.name?.toLowerCase().trim() === (ret.employee || ret.empName)?.toLowerCase().trim()) || {};
              const matchedAsset = assets.find(a => a.tag === ret.assetTag) || {};
              const brandStr = matchedAsset.brand || '';
              const modelStr = matchedAsset.model || ret.model || '';
              const brandAndModel = brandStr && modelStr ? 
                (modelStr.toLowerCase().includes(brandStr.toLowerCase()) ? modelStr : `${brandStr} ${modelStr}`) 
                : modelStr || brandStr || 'N/A';
              const category = matchedAsset.name || ret.assetName || 'N/A';
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
                <td style={{textTransform: 'capitalize'}}>{category}</td>
                <td style={{textTransform: 'capitalize'}}>{brandAndModel}</td>
                <td>{ret.employee || ret.empName}</td>
                <td>{matchedEmp.empId || matchedEmp.id || 'N/A'}</td>
                <td>{matchedEmp.department || 'N/A'}</td>
                <td>{ret.date ? new Date(ret.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
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
                  <Select 
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    options={assets.filter(a => activeAssignments.some(assign => assign.assetTag === a.tag)).map(ast => {
                      const assign = activeAssignments.find(a => a.assetTag === ast.tag);
                      const empName = assign ? assign.employeeName : 'Unknown';
                      const bStr = ast.brand || '';
                      const mStr = ast.model || '';
                      const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr;
                      return {
                        value: ast.tag,
                        label: `${ast.id} - ${ast.tag} - ${bm} (${empName})`
                      };
                    })}
                    value={formData.assetSelection ? {
                      value: formData.assetSelection,
                      label: (function() {
                        const ast = assets.find(a => a.tag === formData.assetSelection);
                        if(!ast) return formData.assetSelection;
                        const assign = activeAssignments.find(a => a.assetTag === ast.tag);
                        const empName = assign ? assign.employeeName : 'Unknown';
                        const bStr = ast.brand || '';
                        const mStr = ast.model || '';
                        const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr;
                        return `${ast.id} - ${ast.tag} - ${bm} (${empName})`;
                      })()
                    } : null}
                    onChange={(selected) => handleInputChange({ target: { name: 'assetSelection', value: selected ? selected.value : '' } })}
                    placeholder="Search assigned asset..."
                    isClearable
                  />
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
