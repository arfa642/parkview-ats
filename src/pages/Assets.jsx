import React, { useState, useEffect } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdDelete, MdEdit, MdAdd, MdClose, MdCheckBox } from 'react-icons/md';

export default function Assets() {
  const { assets, addAsset, deleteMultipleAssets, updateAsset } = useAssets();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission('Assets');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Form State
  const initialFormState = { tag: '', name: 'Laptop', brand: '', specs: '', location: '', remarks: '' };
  const [formData, setFormData] = useState(initialFormState);

  // Group assets by category
  const categoryCounts = assets.reduce((acc, asset) => {
    const category = asset.name.toUpperCase();
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const categoryEntries = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Ctrl+A and Escape support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault(); 
        setIsSelectionMode(true);
        if (selectedIds.length === assets.length && assets.length > 0) {
          setSelectedIds([]); 
        } else {
          setSelectedIds(assets.map(a => a.id)); 
        }
      } else if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assets, selectedIds, isSelectionMode]);

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
    const assetToEdit = assets.find(a => a.id === selectedIds[0]);
    if (assetToEdit) {
      setEditingId(assetToEdit.id);
      setFormData({
        tag: assetToEdit.tag || '',
        serial: assetToEdit.serial || '',
        name: assetToEdit.name || 'Laptop',
        brand: assetToEdit.brand || '',
        specs: assetToEdit.specs || '',
        location: assetToEdit.location || '',
        remarks: assetToEdit.remarks || ''
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`)) {
      deleteMultipleAssets(selectedIds);
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateAsset(editingId, {
        tag: formData.tag,
        name: formData.name,
        brand: formData.brand,
        specs: formData.specs,
        location: formData.location,
        remarks: formData.remarks
      });
    } else {
      addAsset({
        tag: formData.tag,
        name: formData.name,
        brand: formData.brand,
        specs: formData.specs,
        location: formData.location,
        remarks: formData.remarks
      });
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingId(null);
    setSelectedIds([]); 
    setIsSelectionMode(false);
  };

  return (
    <div className="page-content assets-page">
      <div className="page-header">
        <h1>Asset Inventory</h1>
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
              <MdCheckBox /> Edit
            </button>
            <button className="btn primary-btn" onClick={openAddModal}>
              <MdAdd /> Add Asset
            </button>
          </div>
        )}
      </div>

      <div className="category-summary-container">
        {categoryEntries.map(([category, count]) => (
          <div key={category} className="category-pill">
            <span className="category-name">{category}</span>
            <span className="category-count">{count}</span>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {isSelectionMode && (
                <th style={{width: '40px'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === assets.length && assets.length > 0}
                    onChange={() => {
                      if (selectedIds.length === assets.length) setSelectedIds([]);
                      else setSelectedIds(assets.map(a => a.id));
                    }}
                  />
                </th>
              )}
              <th>ID</th>
              <th>Serial No.</th>
              <th>Category</th>
              <th>Brand & Model</th>
              <th>Specs</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr 
                key={asset.id} 
                className={selectedIds.includes(asset.id) ? 'selected-row' : ''}
                onClick={() => { if(isSelectionMode) handleCheckboxChange(asset.id); }}
                style={{cursor: isSelectionMode ? 'pointer' : 'default'}}
              >
                {isSelectionMode && (
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(asset.id)}
                      onChange={() => {}} // handled by row click
                    />
                  </td>
                )}
                <td>{index + 1}</td>
                <td>{asset.tag}</td>
                <td style={{textTransform: 'capitalize'}}>{asset.name}</td>
                <td>{asset.model || asset.brand}</td>
                <td>{asset.specs}</td>
                <td>{asset.status}</td>
                <td>{asset.location}</td>
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
                <h3>{editingId ? 'Edit Asset' : 'Add New Asset'}</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setIsModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            
            <div className="modal-body">
              <h2>Asset Details</h2>
              <form onSubmit={handleSubmit} className="asset-form">
                <div className="form-group">
                  <label>Serial No.</label>
                  <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="name" value={formData.name} onChange={handleInputChange}>
                    <option value="Laptop">Laptop</option>
                    <option value="PC">PC</option>
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Printer">Printer</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Misc.">Misc.</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Brand & Model</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Specs</label>
                  <input type="text" name="specs" value={formData.specs} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <input type="text" name="remarks" value={formData.remarks} onChange={handleInputChange} />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn yellow-btn submit-btn">
                    {editingId ? 'Update Asset' : 'Save Asset'}
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
