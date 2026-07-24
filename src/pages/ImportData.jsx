import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useAssets } from '../context/AssetContext';
import './ImportData.css';

export default function ImportData() {
  const [dataType, setDataType] = useState('Assets');
  const { assets, setAssets, employees, setEmployees } = useAssets();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        processImportedData(data);
        
        // reset file input
        fileInputRef.current.value = '';
      } catch (err) {
        alert("Error parsing file. Please ensure it's a valid Excel (.xlsx) or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImportedData = (data) => {
    if (!data || data.length === 0) {
      alert("No data found in the file.");
      return;
    }

    // Case-insensitive key matcher
    const getVal = (row, keyToMatch) => {
      const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === keyToMatch.toLowerCase());
      return foundKey ? String(row[foundKey]).trim() : '';
    };

    let importedCount = 0;
    let skippedCount = 0;

    if (dataType === 'Assets') {
      const newAssets = [];
      const currentTags = new Set(assets.map(a => String(a.tag).toLowerCase()));
      
      data.forEach((row, index) => {
        const tag = getVal(row, 'tag');
        if (!tag) {
          skippedCount++;
          return;
        }

        if (currentTags.has(tag.toLowerCase())) {
          skippedCount++;
          return;
        }

        currentTags.add(tag.toLowerCase());
        newAssets.push({
          id: Date.now() + index,
          tag: tag,
          serialNumber: getVal(row, 'serial number'),
          name: getVal(row, 'asset name'),
          brand: getVal(row, 'brand & model'),
          specs: getVal(row, 'specs'),
          location: getVal(row, 'location'),
          remarks: getVal(row, 'remarks'),
          status: 'Available'
        });
      });

      if (newAssets.length > 0) {
        setAssets([...assets, ...newAssets]);
      }
      importedCount = newAssets.length;

    } else if (dataType === 'Employees') {
      const newEmployees = [];
      const currentIds = new Set(employees.map(e => String(e.empId).toLowerCase()));
      
      data.forEach((row, index) => {
        const empId = getVal(row, 'employee id');
        if (!empId) {
          skippedCount++;
          return;
        }

        if (currentIds.has(empId.toLowerCase())) {
          skippedCount++;
          return;
        }

        currentIds.add(empId.toLowerCase());
        newEmployees.push({
          id: Date.now() + index,
          empId: empId,
          name: getVal(row, 'name'),
          department: getVal(row, 'department'),
          designation: getVal(row, 'designation')
        });
      });

      if (newEmployees.length > 0) {
        setEmployees([...employees, ...newEmployees]);
      }
      importedCount = newEmployees.length;
    }

    alert(`Import Complete!\n\nSuccessfully Imported: ${importedCount}\nSkipped (Duplicates/Missing IDs): ${skippedCount}`);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className='page-content'>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontWeight: 'bold' }}>Import Data</h1>
      
      <div className="import-instructions-box">
        <h3 className="instruction-title">How to Import Data</h3>
        <ol className="instruction-list">
          <li>1. Create an Excel (.xlsx) or CSV file with your data.</li>
          <li>2. Ensure the first row contains exactly the preferred column names shown below.</li>
          <li>3. Select the Data Type below, pick your file, and click 'Import Data'.</li>
        </ol>

        <h4 className="instruction-subtitle">Preferred Field Names (Case-Insensitive):</h4>
        
        <ul className="field-list">
          <li>• For Assets: Tag, Serial Number, Asset Name, Brand & Model, Specs, Location, Remarks</li>
          <li>• For Employees: Employee ID, Name, Department, Designation</li>
        </ul>

        <p className="instruction-note">Note: Missing columns will be left blank. Duplicate tags or IDs will be skipped.</p>
      </div>

      <div className="import-actions">
        <label>Select Data Type:</label>
        <select 
          className="search-input yellow-select"
          value={dataType}
          onChange={(e) => setDataType(e.target.value)}
        >
          <option value="Assets">Assets</option>
          <option value="Employees">Employees</option>
        </select>
        
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          style={{ display: 'none' }} 
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        
        <button className="btn green-btn" onClick={triggerFileInput}>Browse & Import Excel</button>
      </div>
    </div>
  );
}
