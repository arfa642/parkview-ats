import React, { createContext, useState, useEffect, useContext } from 'react';
import { dummyAssets, dummyEmployees, dummyAssignments, dummyTransfers, dummyReturns } from '../dummyData';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AssetContext = createContext();

export const useAssets = () => useContext(AssetContext);

export const DEPARTMENT_LIST = [
  'Accounts', 'Frontdesk Basement', 'Tax', 'SAP', 'IT', 'HR', 'Monitoring CCTV', 
  'Customer Services', 'Internal Auditor', 'Digital Marketing', 'AAK Foundation', 
  'Sales', 'Transfer', 'Recovery', 'Procurement', 'Transport', 'Zay Studio', 
  'Food & Form', 'CEO Office', 'Land', 'Legal', 'Building Control', 'Security', 
  'Billing', 'Admin', 'Possession', 'Engineering Site', '55C2'
];

const API_BASE_URL = 'http://localhost:5000/api';

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('ats_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDummyData, setIsDummyData] = useState(false);

  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const addAuditLog = (action, details) => {
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System',
      role: currentUser ? currentUser.role : 'System',
      action,
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('ats_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchData = async () => {
    try {
      let offline = false;
      const fetchWithCheck = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
      };
      
      const [assetsRes, empRes, assignRes, transRes, retRes] = await Promise.all([
        fetchWithCheck(`${API_BASE_URL}/assets`).catch(() => { offline = true; return null; }),
        fetchWithCheck(`${API_BASE_URL}/employees`).catch(() => { offline = true; return null; }),
        fetchWithCheck(`${API_BASE_URL}/assignments`).catch(() => { offline = true; return null; }),
        fetchWithCheck(`${API_BASE_URL}/transfers`).catch(() => { offline = true; return null; }),
        fetchWithCheck(`${API_BASE_URL}/returns`).catch(() => { offline = true; return null; })
      ]);
      const loadLocal = (key, fallback) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
      };

      const finalAssets = Array.isArray(assetsRes) ? assetsRes : loadLocal('ats_assets', dummyAssets);
      const finalEmployees = Array.isArray(empRes) ? empRes : loadLocal('ats_employees', dummyEmployees);
      const finalAssignments = Array.isArray(assignRes) ? assignRes : loadLocal('ats_assignments', dummyAssignments);
      const finalTransfers = Array.isArray(transRes) ? transRes : loadLocal('ats_transfers', dummyTransfers);
      const finalReturns = Array.isArray(retRes) ? retRes : loadLocal('ats_returns', dummyReturns);
      
      setAssets(finalAssets);
      setEmployees(finalEmployees);
      setAssignments(finalAssignments);
      setTransfers(finalTransfers);
      setReturns(finalReturns);
      
      setIsDummyData(offline);
    } catch (error) {
      console.error("Error fetching data from API:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Offline Persistence Sync
  useEffect(() => {
    if (assets.length > 0 && isDummyData) localStorage.setItem('ats_assets', JSON.stringify(assets));
  }, [assets, isDummyData]);
  
  useEffect(() => {
    if (employees.length > 0 && isDummyData) localStorage.setItem('ats_employees', JSON.stringify(employees));
  }, [employees, isDummyData]);

  useEffect(() => {
    if (assignments.length > 0 && isDummyData) localStorage.setItem('ats_assignments', JSON.stringify(assignments));
  }, [assignments, isDummyData]);

  useEffect(() => {
    if (transfers.length > 0 && isDummyData) localStorage.setItem('ats_transfers', JSON.stringify(transfers));
  }, [transfers, isDummyData]);

  useEffect(() => {
    if (returns.length > 0 && isDummyData) localStorage.setItem('ats_returns', JSON.stringify(returns));
  }, [returns, isDummyData]);

  const addAsset = async (newAsset) => {
    if (isDummyData) {
      setAssets(prev => [...prev, { ...newAsset, id: Date.now() }]);
      addToast('Asset added successfully (Offline)', 'success');
      addAuditLog('Created Asset', `Added new asset: ${newAsset.name} (${newAsset.tag})`);
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAsset) });
      fetchData();
      addToast('Asset added successfully!', 'success');
      addAuditLog('Created Asset', `Added new asset: ${newAsset.name} (${newAsset.tag})`);
    } catch (error) {
      console.warn("API offline", error);
    }
  };

  const updateAsset = (id, updatedData) => {
    setAssets(assets.map(asset => asset.id === id ? { ...asset, ...updatedData } : asset));
    addToast('Asset updated successfully!', 'success');
    addAuditLog('Updated Asset', `Modified details for asset ID: ${id}`);
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
    addToast('Asset deleted!', 'info');
    addAuditLog('Deleted Asset', `Removed asset ID: ${id}`);
  };

  const deleteMultipleAssets = (ids) => {
    setAssets(assets.filter(asset => !ids.includes(asset.id)));
    addToast(`${ids.length} assets deleted!`, 'info');
    addAuditLog('Deleted Multiple Assets', `Removed ${ids.length} assets`);
  };

  const addEmployee = async (newEmployee) => {
    if (isDummyData) {
      setEmployees(prev => [...prev, { ...newEmployee, id: Date.now() }]);
      addToast('Employee added successfully (Offline)', 'success');
      addAuditLog('Created Employee', `Added new employee: ${newEmployee.name}`);
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/employees`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEmployee) });
      fetchData();
      addToast('Employee added successfully!', 'success');
      addAuditLog('Created Employee', `Added new employee: ${newEmployee.name}`);
    } catch (error) {
      console.warn("API offline", error);
    }
  };

  const updateEmployee = (id, updatedData) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, ...updatedData } : emp));
    addToast('Employee updated successfully!', 'success');
    addAuditLog('Updated Employee', `Modified details for employee ID: ${id}`);
  };

  const deleteMultipleEmployees = (ids) => {
    setEmployees(employees.filter(emp => !ids.includes(emp.id)));
    addToast(`${ids.length} employees deleted!`, 'info');
    addAuditLog('Deleted Multiple Employees', `Removed ${ids.length} employees`);
  };

  const addAssignment = (newAssignment) => {
    setAssignments([...assignments, { ...newAssignment, id: Date.now(), status: 'Active', date: new Date().toISOString().split('T')[0] }]);
    setAssets(assets.map(asset => 
      asset.tag === newAssignment.assetTag ? { ...asset, status: 'Assigned' } : asset
    ));
    addToast(`Asset ${newAssignment.assetTag} assigned to ${newAssignment.employee}!`, 'success');
    addAuditLog('Assigned Asset', `Assigned ${newAssignment.assetTag} to ${newAssignment.employee}`);
  };

  const updateAssignment = (id, updatedData) => {
    setAssignments(assignments.map(assign => assign.id === id ? { ...assign, ...updatedData } : assign));
    addToast('Assignment updated successfully!', 'success');
    addAuditLog('Updated Assignment', `Modified assignment ID: ${id}`);
  };

  const deleteMultipleAssignments = (ids) => {
    setAssignments(assignments.filter(assign => !ids.includes(assign.id)));
    addToast(`${ids.length} assignments deleted!`, 'info');
    addAuditLog('Deleted Multiple Assignments', `Removed ${ids.length} assignments`);
  };

  const addTransfer = (newTransfer) => {
    setTransfers([...transfers, { ...newTransfer, id: Date.now(), date: new Date().toISOString().split('T')[0] }]);
    setAssignments(assignments.map(assign => 
      (assign.assetTag === newTransfer.assetTag && assign.status === 'Active') ? { ...assign, employee: newTransfer.toEmployee } : assign
    ));
    addToast(`Asset ${newTransfer.assetTag} transferred to ${newTransfer.toEmployee}!`, 'success');
    addAuditLog('Transferred Asset', `Transferred ${newTransfer.assetTag} from ${newTransfer.fromEmployee} to ${newTransfer.toEmployee}`);
  };

  const updateTransfer = (id, updatedData) => {
    setTransfers(transfers.map(tr => tr.id === id ? { ...tr, ...updatedData } : tr));
    addToast('Transfer updated successfully!', 'success');
    addAuditLog('Updated Transfer', `Modified transfer ID: ${id}`);
  };

  const deleteMultipleTransfers = (ids) => {
    setTransfers(transfers.filter(tr => !ids.includes(tr.id)));
    addToast(`${ids.length} transfers deleted!`, 'info');
    addAuditLog('Deleted Multiple Transfers', `Removed ${ids.length} transfers`);
  };

  const addReturn = (newReturn) => {
    setReturns([...returns, { ...newReturn, id: Date.now(), date: new Date().toISOString().split('T')[0] }]);
    setAssets(assets.map(asset => 
      asset.tag === newReturn.assetTag ? { ...asset, status: 'Available' } : asset
    ));
    setAssignments(assignments.map(assign => 
      (assign.assetTag === newReturn.assetTag && assign.status === 'Active') ? { ...assign, status: 'Returned' } : assign
    ));
    addToast(`Asset ${newReturn.assetTag} returned!`, 'success');
    addAuditLog('Returned Asset', `Asset ${newReturn.assetTag} returned by ${newReturn.employee}`);
  };

  const updateReturn = (id, updatedData) => {
    setReturns(returns.map(ret => ret.id === id ? { ...ret, ...updatedData } : ret));
    addToast('Return updated successfully!', 'success');
    addAuditLog('Updated Return', `Modified return ID: ${id}`);
  };

  const deleteMultipleReturns = (ids) => {
    setReturns(returns.filter(ret => !ids.includes(ret.id)));
    addToast(`${ids.length} returns deleted!`, 'info');
    addAuditLog('Deleted Multiple Returns', `Removed ${ids.length} returns`);
  };

  return (
    <AssetContext.Provider value={{ 
      assets, setAssets, addAsset, updateAsset, deleteAsset, deleteMultipleAssets,
      employees, setEmployees, addEmployee, updateEmployee, deleteMultipleEmployees,
      assignments, addAssignment, updateAssignment, deleteMultipleAssignments,
      transfers, addTransfer, updateTransfer, deleteMultipleTransfers,
      returns, addReturn, updateReturn, deleteMultipleReturns,
      auditLogs, addAuditLog,
      isDummyData
    }}>
      {children}
    </AssetContext.Provider>
  );
};
