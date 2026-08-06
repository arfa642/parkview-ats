import React, { useState } from 'react';
import { useAssets, DEPARTMENT_LIST } from '../context/AssetContext';

export default function Reports() {
  const { assets, assignments, transfers, returns, employees } = useAssets();
  
  const [reportType, setReportType] = useState('All Assets');
  const [department, setDepartment] = useState('All Departments');
  
  // Date inputs
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied dates for the filter button
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  // Auto-clear filter if inputs are cleared
  React.useEffect(() => {
    if (!fromDate && !toDate) {
      setAppliedFromDate('');
      setAppliedToDate('');
    }
  }, [fromDate, toDate]);

  const departments = ['All Departments', ...DEPARTMENT_LIST];

  const handleApplyDateFilter = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const getFilteredData = () => {
    let data = [];
    
    // 1. Gather Initial Data Base
    switch(reportType) {
      case 'All Assets':
        data = assets.map(a => {
          let dep = '';
          if (a.status === 'Assigned') {
            const activeAssign = assignments.find(assign => assign.assetTag === a.tag && assign.status === 'Active');
            if (activeAssign) {
              const emp = employees.find(e => e.name === activeAssign.employee);
              if (emp) dep = emp.department;
            }
          }
          return {...a, reportId: a.id, serialNumber: a.serialNumber || '', department: dep};
        });
        break;
      case 'Assignments':
        data = assignments.map(a => ({...a, reportId: a.id}));
        break;
      case 'Transfers':
        data = transfers.map(a => ({...a, reportId: a.id}));
        break;
      case 'Returns':
        data = returns.map(a => ({...a, reportId: a.id}));
        break;
      case 'Employee Assets':
        employees.forEach(emp => {
          const empAssignments = assignments.filter(a => a.employee === emp.name && a.status === 'Active');
          empAssignments.forEach(assign => {
            const asset = assets.find(a => a.tag === assign.assetTag) || {};
            data.push({
              reportId: assign.id,
              employeeName: emp.name,
              department: emp.department,
              assetTag: assign.assetTag,
              assetName: asset.name,
              model: assign.model,
              date: assign.date
            });
          });
        });
        break;
      default:
        data = assets.map(a => ({...a, reportId: a.id}));
    }

    // 2. Apply Department Filter
    if (department !== 'All Departments') {
      data = data.filter(item => {
        if (reportType === 'All Assets') {
          // If a specific dept is selected, we only show assets Assigned to an employee in that dept
          if (item.status === 'Available') return false; 
          const activeAssign = assignments.find(a => a.assetTag === item.tag && a.status === 'Active');
          if (!activeAssign) return false;
          const emp = employees.find(e => e.name === activeAssign.employee);
          return emp && emp.department === department;
        } else if (reportType === 'Employee Assets') {
          return item.department === department;
        } else if (reportType === 'Assignments' || reportType === 'Returns') {
          const emp = employees.find(e => e.name === item.employee);
          return emp && emp.department === department;
        } else if (reportType === 'Transfers') {
          // For transfers, check if the receiving employee is in the department
          const toEmpName = item.transferPath ? item.transferPath.split(' -> ')[1] : '';
          const emp = employees.find(e => e.name === toEmpName);
          return emp && emp.department === department;
        }
        return true;
      });
    }

    // 3. Apply Date Filter (if Apply button was clicked and dates exist)
    if (appliedFromDate && appliedToDate) {
      data = data.filter(item => {
        // If the item doesn't have a date (like generic All Assets without assignments), 
        // we exclude it if a date filter is explicitly applied, or include it? 
        // Usually, filtering by date means we only want items with dates in that range.
        if (!item.date) {
          // If it's All Assets, let's try to find its assignment date if Assigned
          if (reportType === 'All Assets' && item.status === 'Assigned') {
            const activeAssign = assignments.find(a => a.assetTag === item.tag && a.status === 'Active');
            if (activeAssign && activeAssign.date >= appliedFromDate && activeAssign.date <= appliedToDate) {
              return true;
            }
          }
          return false;
        }
        return item.date >= appliedFromDate && item.date <= appliedToDate;
      });
    }

    return data;
  };

  const filteredData = getFilteredData();

  const renderTable = () => {
    if (filteredData.length === 0) {
      return <div className="no-data-msg">No records found for the selected filters.</div>;
    }

    let headers = [];
    let renderRow = () => {};

    switch(reportType) {
      case 'All Assets':
        headers = ['Id', 'Serial No.', 'Category', 'Brand & Model', 'Specs', 'Location', 'Status', 'Remarks', 'Department'];
        renderRow = (item) => {
          const bStr = item.brand || '';
          const mStr = item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          return (
            <tr key={item.reportId}>
              <td>{item.reportId}</td>
              <td>{item.tag}</td>
              <td style={{textTransform: 'capitalize'}}>{item.name}</td>
              <td style={{textTransform: 'capitalize'}}>{bm}</td>
              <td>{item.specs}</td>
              <td>{item.location}</td>
              <td>{item.status}</td>
              <td>{item.remarks || ''}</td>
              <td>{item.department}</td>
            </tr>
          );
        };
        break;
      case 'Assignments':
        headers = ['ID', 'Serial No.', 'Category', 'Brand & Model', 'Employee', 'Date', 'Status'];
        renderRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return (
            <tr key={item.reportId}>
              <td>{item.reportId}</td>
              <td>{item.assetTag}</td>
              <td style={{textTransform: 'capitalize'}}>{matchedAsset.name}</td>
              <td style={{textTransform: 'capitalize'}}>{bm}</td>
              <td>{item.employee}</td>
              <td>{dateStr}</td>
              <td>{item.status}</td>
            </tr>
          );
        };
        break;
      case 'Transfers':
        headers = ['ID', 'Asset', 'Category', 'Brand & Model', 'Transfer Path', 'Date'];
        renderRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return (
            <tr key={item.reportId}>
              <td>{item.reportId}</td>
              <td>{item.assetTag}</td>
              <td style={{textTransform: 'capitalize'}}>{matchedAsset.name}</td>
              <td style={{textTransform: 'capitalize'}}>{bm}</td>
              <td>{item.transferPath}</td>
              <td>{dateStr}</td>
            </tr>
          );
        };
        break;
      case 'Returns':
        headers = ['ID', 'Asset', 'Category', 'Brand & Model', 'Employee', 'Emp ID', 'Date', 'Condition', 'Remarks'];
        renderRow = (item) => {
          const matchedEmp = employees.find(e => e.name?.toLowerCase().trim() === item.employee?.toLowerCase().trim()) || {};
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return (
            <tr key={item.reportId}>
              <td>{item.reportId}</td>
              <td>{item.assetTag}</td>
              <td style={{textTransform: 'capitalize'}}>{matchedAsset.name}</td>
              <td style={{textTransform: 'capitalize'}}>{bm}</td>
              <td>{item.employee}</td>
              <td>{matchedEmp.empId || matchedEmp.id || 'N/A'}</td>
              <td>{dateStr}</td>
              <td>{item.condition}</td>
              <td>{item.remarks}</td>
            </tr>
          );
        };
        break;
      case 'Employee Assets':
        headers = ['ID', 'Employee', 'Department', 'Asset Tag', 'Category', 'Brand & Model', 'Assign Date'];
        renderRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return (
            <tr key={`${item.reportId}-${item.assetTag}`}>
              <td>{item.reportId}</td>
              <td>{item.employeeName}</td>
              <td>{item.department}</td>
              <td>{item.assetTag}</td>
              <td style={{textTransform: 'capitalize'}}>{matchedAsset.name}</td>
              <td style={{textTransform: 'capitalize'}}>{bm}</td>
              <td>{dateStr}</td>
            </tr>
          );
        };
        break;
      default:
        return null;
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(renderRow)}
          </tbody>
        </table>
      </div>
    );
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    let headers = [];
    let getRow = () => [];

    switch(reportType) {
      case 'All Assets':
        headers = ['ID', 'Tag', 'Serial Number', 'Category', 'Brand & Model', 'Specs', 'Location', 'Status', 'Remarks', 'Department'];
        getRow = (item) => {
          const bStr = item.brand || '';
          const mStr = item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          return [item.reportId, item.tag, item.serialNumber, item.name, bm, item.specs, item.location, item.status, item.remarks || '', item.department];
        };
        break;
      case 'Assignments':
        headers = ['ID', 'Asset Tag', 'Category', 'Brand & Model', 'Employee', 'Date', 'Status'];
        getRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return [item.reportId, item.assetTag, matchedAsset.name, bm, item.employee, dateStr, item.status];
        };
        break;
      case 'Transfers':
        headers = ['ID', 'Asset Tag', 'Category', 'Brand & Model', 'Transfer Path', 'Date'];
        getRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return [item.reportId, item.assetTag, matchedAsset.name, bm, item.transferPath, dateStr];
        };
        break;
      case 'Returns':
        headers = ['ID', 'Asset Tag', 'Category', 'Brand & Model', 'Employee', 'Emp ID', 'Date', 'Condition', 'Remarks'];
        getRow = (item) => {
          const matchedEmp = employees.find(e => e.name?.toLowerCase().trim() === item.employee?.toLowerCase().trim()) || {};
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return [item.reportId, item.assetTag, matchedAsset.name, bm, item.employee, matchedEmp.empId || matchedEmp.id || 'N/A', dateStr, item.condition, item.remarks];
        };
        break;
      case 'Employee Assets':
        headers = ['ID', 'Employee Name', 'Department', 'Asset Tag', 'Category', 'Brand & Model', 'Assign Date'];
        getRow = (item) => {
          const matchedAsset = assets.find(a => a.tag === item.assetTag) || {};
          const bStr = matchedAsset.brand || '';
          const mStr = matchedAsset.model || item.model || '';
          const bm = bStr && mStr ? (mStr.toLowerCase().includes(bStr.toLowerCase()) ? mStr : `${bStr} ${mStr}`) : mStr || bStr || 'N/A';
          const dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
          return [item.reportId, item.employeeName, item.department, item.assetTag, matchedAsset.name, bm, dateStr];
        };
        break;
      default:
        break;
    }

    let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
    filteredData.forEach(item => {
      const row = getRow(item).map(val => `"${String(val || '').replace(/"/g, '""')}"`);
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType.replace(' ', '_')}_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-content reports-page">
      <div className="page-header no-print">
        <h1>Generate Reports</h1>
      </div>

      <div className="report-filters no-print">
        <div className="filter-box">
          <div className="filter-group">
            <label>Select Report Type:</label>
            <select 
              className="search-input blue-select" 
              value={reportType} 
              onChange={(e) => {
                setReportType(e.target.value);
                setAppliedFromDate('');
                setAppliedToDate('');
                setFromDate('');
                setToDate('');
              }}
            >
              <option value="All Assets">All Assets</option>
              <option value="Assignments">Assignments</option>
              <option value="Transfers">Transfers</option>
              <option value="Returns">Returns</option>
              <option value="Employee Assets">Employee Assets</option>
            </select>
          </div>

          <div className="filter-group">
              <label>Department:</label>
              <select 
                className="search-input yellow-select" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((dep, idx) => (
                  <option key={idx} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

          <div className="filter-actions ml-auto">
            <button className="btn return-action-btn" onClick={handlePrint}>Preview & Print</button>
            <button className="btn yellow-btn" onClick={exportToCSV}>Export to CSV</button>
          </div>
        </div>

        <div className="filter-box mt-4">
          <div className="filter-group">
            <label>From Date:</label>
            <input 
              type="date" 
              className="date-input" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date:</label>
            <input 
              type="date" 
              className="date-input" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button className="btn yellow-btn" onClick={handleApplyDateFilter}>Apply Date Filter</button>
          </div>
        </div>
      </div>

      <div className="report-content" id="printable-report">
        <div className="print-header" style={{display: 'none'}}>
          <h1 className="print-company-name">Park View City</h1>
          <h2 className="print-report-type">{reportType} Report</h2>
          <p className="print-meta">Period: {appliedFromDate && appliedToDate ? `${appliedFromDate} to ${appliedToDate}` : '2026-07-24 to 2026-07-24'} | Department: {department}</p>
        </div>
        
        {renderTable()}
        
        <div className="print-footer" style={{display: 'none'}}>
          <p className="print-timestamp">Generated on 2026-07-24 15:37:51</p>
          <p className="print-system-note">This is system generated does not require any sign stamp.</p>
        </div>
      </div>
    </div>
  );
}
