import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';
import { MdSearch } from 'react-icons/md';

export default function EmployeeAssets() {
  const { employees, assets, assignments } = useAssets();
  const [searchTerm, setSearchTerm] = useState('');

  // Group assignments by employee
  const employeeAssetsData = employees.map(emp => {
    // Find all active assignments for this employee
    const empAssignments = assignments.filter(a => a.employee === emp.name && a.status === 'Active');
    
    const assetsDetails = empAssignments.map(assign => {
      const asset = assets.find(a => a.tag === assign.assetTag) || {};
      return {
        tag: assign.assetTag,
        assetName: asset.name,
        brand: assign.model || asset.brand,
        specs: asset.specs,
        assignDate: assign.date
      };
    });

    return { ...emp, assetsDetails };
  }).filter(emp => emp.assetsDetails.length > 0); // Only show employees with assigned assets

  // Filter based on search term (search by employee name, id, or asset tag)
  const filteredData = employeeAssetsData.filter(emp => {
    const term = searchTerm.toLowerCase();
    const matchEmp = emp.name.toLowerCase().includes(term) || emp.empId.toLowerCase().includes(term);
    const matchAsset = emp.assetsDetails.some(a => a.tag.toLowerCase().includes(term) || (a.assetName && a.assetName.toLowerCase().includes(term)));
    return matchEmp || matchAsset;
  });

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Department', 'Designation', 'Serial No.', 'Asset Name', 'Brand & Model', 'Specs', 'Assign Date'];
    let csvContent = headers.join(',') + '\n';

    filteredData.forEach(emp => {
      emp.assetsDetails.forEach(asset => {
        const row = [
          `"${emp.name}"`,
          `"${emp.empId}"`,
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
                ID: {emp.empId} | {emp.department} | {emp.designation}
              </span>
            </div>
            
            <div className="employee-assets-table-wrapper">
              <table className="employee-assets-table">
                <thead>
                  <tr>
                    <th>Serial No.</th>
                    <th>Asset Name</th>
                    <th>Brand & Model</th>
                    <th>Specs</th>
                    <th>Assign Date</th>
                  </tr>
                </thead>
                <tbody>
                  {emp.assetsDetails.map((asset, idx) => (
                    <tr key={idx}>
                      <td>{asset.tag}</td>
                      <td style={{textTransform: 'capitalize'}}>{asset.assetName}</td>
                      <td>{asset.brand}</td>
                      <td>{asset.specs}</td>
                      <td>{asset.assignDate}</td>
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
    </div>
  );
}
