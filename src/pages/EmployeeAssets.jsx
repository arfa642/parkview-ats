import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { useAuth } from '../context/AuthContext';
import { MdSearch, MdOutlineAssignmentReturn, MdClose } from 'react-icons/md';

export default function EmployeeAssets() {
  const { employees, assets, assignments, addReturn } = useAssets();
  const { hasEditPermission } = useAuth();
  const canEdit = hasEditPermission('Returns');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnAsset, setReturnAsset] = useState(null);
  const [formData, setFormData] = useState({ condition: 'Good', reason: '' });

  // Group assignments by employee
  const employeeAssetsData = employees.map(emp => {
    // Find all active assignments for this employee
    const empAssignments = assignments.filter(a => a.employee === emp.name && a.status === 'Active');
    
    const assetsDetails = empAssignments.map(assign => {
      const asset = assets.find(a => a.tag === assign.assetTag) || {};
      return {
        tag: assign.assetTag,
        assetName: asset.name,
        brand: assign.model || asset.model || asset.brand,
        specs: asset.specs,
        assignDate: assign.date
      };
    });

    return { ...emp, assetsDetails };
  }).filter(emp => emp.assetsDetails.length > 0); // Only show employees with assigned assets

  // Filter based on search term (search by employee name, id, or asset tag)
  const filteredData = employeeAssetsData.filter(emp => {
    const term = searchTerm.toLowerCase();
    const matchEmp = emp.name.toLowerCase().includes(term) || (emp.empId || emp.id).toString().toLowerCase().includes(term);
    const matchAsset = emp.assetsDetails.some(a => a.tag.toLowerCase().includes(term) || (a.assetName && a.assetName.toLowerCase().includes(term)));
    return matchEmp || matchAsset;
  });

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Serial No.', 'Category', 'Brand & Model', 'Specs', 'Assign Date'];
    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(emp => {
      emp.assetsDetails.forEach(asset => {
        const row = [
          `"${emp.name}"`,
          `"${emp.empId || emp.id}"`,
          `"${emp.department}"`,
          `"${emp.designation}"`,
          `"${asset.tag}"`,
          `"${asset.assetName}"`,
          `"${asset.brand}"`,
          `"${asset.specs}"`,
          `"${asset.assignDate}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_assets.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Employee Assets</h1>
      </div>

      <div className="employee-assets-toolbar">
        <div className="search-bar search-bar-long">
          <MdSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employee or asset..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn yellow-btn" onClick={exportToCSV}>
          Export to CSV
        </button>
      </div>

      <div className="employee-cards-container">
        {filteredData.map(emp => (
          <div key={emp.id} className="employee-card">
            <div className="employee-header">
              <h2>{emp.name}</h2>
              <span className="emp-details">
                ID: {emp.empId || emp.id} | {emp.department} | {emp.designation}
              </span>
            </div>
            
            <div className="employee-assets-table-wrapper">
              <table className="employee-assets-table">
                <thead>
                  <tr>
                    <th>Serial No.</th>
                    <th>Category</th>
                    <th>Brand & Model</th>
                    <th>Specs</th>
                    <th>Assign Date</th>
                    {canEdit && <th style={{textAlign: 'right', width: '100px'}}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {emp.assetsDetails.map((asset, idx) => (
                    <tr key={idx}>
                      <td>{asset.tag}</td>
                      <td style={{textTransform: 'capitalize'}}>{asset.assetName}</td>
                      <td>{asset.brand}</td>
                      <td>{asset.specs}</td>
                      <td>{asset.assignDate ? new Date(asset.assignDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                      {canEdit && (
                        <td style={{textAlign: 'right'}}>
                          <button 
                            className="btn red-btn" 
                            style={{padding: '4px 8px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                            onClick={() => {
                              setReturnAsset({ ...asset, employee: emp.name });
                              setFormData({ condition: 'Good', reason: '' });
                              setReturnModalOpen(true);
                            }}
                            title="Return Asset"
                          >
                            <MdOutlineAssignmentReturn /> Return
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="no-data-msg">No employee assets found.</div>
        )}
      </div>

      {returnModalOpen && returnAsset && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon"></span>
                <h3>Quick Return Asset</h3>
              </div>
              <div className="modal-controls">
                <span className="control-btn close" onClick={() => setReturnModalOpen(false)}><MdClose /></span>
              </div>
            </div>
            
            <div className="modal-body text-center">
              <div style={{marginBottom: '15px', padding: '10px', backgroundColor: '#374151', borderRadius: '4px', textAlign: 'left', color: '#f9fafb'}}>
                <p><strong>Employee:</strong> {returnAsset.employee}</p>
                <p><strong>Asset Tag:</strong> {returnAsset.tag}</p>
                <p><strong>Category:</strong> <span style={{textTransform: 'capitalize'}}>{returnAsset.assetName}</span></p>
                <p><strong>Brand & Model:</strong> {returnAsset.brand}</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                addReturn({
                  assetTag: returnAsset.tag,
                  assetName: returnAsset.assetName,
                  model: returnAsset.brand,
                  employee: returnAsset.employee,
                  condition: formData.condition,
                  remarks: formData.reason
                });
                setReturnModalOpen(false);
                setReturnAsset(null);
              }}>
                
                <div className="form-group vertical mt-4" style={{ textAlign: 'left' }}>
                  <label>Condition:</label>
                  <select 
                    name="condition" 
                    value={formData.condition} 
                    onChange={(e) => setFormData({...formData, condition: e.target.value})}
                    style={{backgroundColor: '#1f2937', border: '1px solid #4b5563', color: 'white', width: '100%', padding: '10px', borderRadius: '6px', outline: 'none'}}
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="form-group vertical mt-4" style={{ textAlign: 'left' }}>
                  <label>Reason / Remarks:</label>
                  <input 
                    type="text" 
                    name="reason" 
                    value={formData.reason} 
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Enter reason for return..."
                    style={{backgroundColor: '#1f2937', border: '1px solid #4b5563', color: 'white', width: '100%', padding: '10px', borderRadius: '6px', outline: 'none'}}
                  />
                </div>
                
                <div className="form-actions mt-4">
                  <button type="submit" className="btn red-btn w-full justify-center">
                    Confirm Return
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
