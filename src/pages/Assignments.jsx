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

export default function Assignments() {
  const { assets, employees, assignments, addAssignment, deleteMultipleAssignments, updateAssignment } = useAssets();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission('Assignments');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Form State
  const [assetSearch, setAssetSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);

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
    setAssignDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const assignmentToEdit = assignments.find(a => a.id === selectedIds[0]);
    if (assignmentToEdit) {
      setEditingId(assignmentToEdit.id);
      setAssetSearch(assignmentToEdit.assetTag);
      setEmployeeSearch(assignmentToEdit.employee);
      setAssignDate(assignmentToEdit.date || new Date().toISOString().split('T')[0]);
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
    
    const assetTag = assetSearch;
    const employeeName = employeeSearch;
    const matchedAsset = assets.find(a => a.tag === assetTag) || { brand: '' };

    const activeAssignment = assignments.find(a => a.assetTag === assetTag && a.status === 'Active');
    if (!editingId && activeAssignment) {
      alert("ERROR: This asset is already assigned and active! Please return it before assigning it again.");
      return;
    }

    if (editingId) {
      updateAssignment(editingId, {
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.model || matchedAsset.brand,
        employee: employeeName,
        date: assignDate
      });
    } else {
      addAssignment({
        assetTag: assetTag,
        assetName: matchedAsset.name,
        model: matchedAsset.model || matchedAsset.brand,
        employee: employeeName,
        date: assignDate
      });
    }
    
    setIsModalOpen(false);
    setAssetSearch('');
    setEmployeeSearch('');
    setAssignDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="page-content assignments-page">
      <div className="page-header">
        <h1>Asset Assignments</h1>
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
              <th>Category</th>
              <th>Brand & Model</th>
              <th>Employee</th>
              <th>Emp ID</th>
              <th>Emp Dept</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment, idx) => {
              const matchedEmp = employees.find(e => e.name === assignment.employee) || {};
              const matchedAsset = assets.find(a => a.tag === assignment.assetTag) || {};
              const bStr = matchedAsset.brand || '';
              const mStr = matchedAsset.model || assignment.model || '';
              const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || assignment.model || 'N/A';
              const category = matchedAsset.name || assignment.assetName || 'N/A';
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
                <td>{idx + 1}</td>
                <td>{assignment.assetTag}</td>
                <td style={{textTransform: 'capitalize'}}>{category}</td>
                <td style={{textTransform: 'capitalize'}}>{bm}</td>
                <td>{assignment.employee}</td>
                <td>{matchedEmp.empId || matchedEmp.id || 'N/A'}</td>
                <td>{matchedEmp.department || 'N/A'}</td>
                <td>{assignment.date ? new Date(assignment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
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
                  <Select 
                    options={assets
                      .filter(asset => {
                        if (!editingId) return asset.status === 'Available';
                        const editingAssignment = assignments.find(a => a.id === editingId);
                        return asset.status === 'Available' || (editingAssignment && editingAssignment.assetTag === asset.tag);
                      })
                      .map(asset => ({
                        value: asset.tag,
                        label: `${asset.id} - ${asset.tag} - ${asset.model || asset.brand}`
                      }))}
                    value={assetSearch ? { value: assetSearch, label: assetSearch } : null}
                    onChange={(option) => setAssetSearch(option ? option.value : '')}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    placeholder="Search asset..."
                    isClearable
                    required
                  />
                </div>

                <div className="form-group vertical mt-4">
                  <label>Select Employee:</label>
                  <Select 
                    options={employees.map(emp => ({
                      value: emp.name,
                      label: `${emp.empId || emp.id} - ${emp.name}`
                    }))}
                    value={employeeSearch ? { value: employeeSearch, label: employeeSearch } : null}
                    onChange={(option) => setEmployeeSearch(option ? option.value : '')}
                    styles={customStyles}
                    menuPortalTarget={document.body}
                    placeholder="Search employee..."
                    isClearable
                    required
                  />
                </div>

                <div className="form-group vertical mt-4">
                  <label>Assignment Date:</label>
                  <input 
                    type="date" 
                    className="search-input"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    required
                  />
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
