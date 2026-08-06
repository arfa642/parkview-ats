import React, { createContext, useState, useEffect, useContext } from 'react';
import { dummyUsers } from '../dummyData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);

  const ALL_PAGES = ['Dashboard', 'Assets', 'Employees', 'Assignments', 'Transfers', 'Returns', 'Employee Assets', 'Reports', 'Audit Log', 'Import Data', 'Settings', 'Users', 'Access'];
  const BASIC_PAGES = ['Dashboard', 'Assets', 'Employees', 'Assignments', 'Transfers', 'Returns', 'Employee Assets', 'Reports'];
  const HR_EDIT_PAGES = ['Employees', 'Dashboard'];

  const defaultPermissions = {
    'HR': { allowedPages: [...BASIC_PAGES], editPages: [...HR_EDIT_PAGES] },
    'CEO': { allowedPages: [...BASIC_PAGES], editPages: [] },
    'Developer': { allowedPages: [...ALL_PAGES], editPages: [...ALL_PAGES] },
    'Executive': { allowedPages: [...ALL_PAGES], editPages: [...ALL_PAGES] }
  };

  const [permissions, setPermissions] = useState(defaultPermissions);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pvc_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    
    const savedPermissions = localStorage.getItem('pvc_permissions');
    if (savedPermissions) {
      try {
        const parsed = JSON.parse(savedPermissions);
        // Merge in case we added new permission types like allowedPages
        const merged = { ...defaultPermissions };
        for (const role in parsed) {
          if (merged[role]) {
            merged[role] = { ...merged[role], ...parsed[role] };
          }
        }
        
        // Force full page permissions for Executive and Developer
        merged['Executive'] = { allowedPages: [...ALL_PAGES], editPages: [...ALL_PAGES] };
        merged['Developer'] = { allowedPages: [...ALL_PAGES], editPages: [...ALL_PAGES] };
        
        setPermissions(merged);
        // Save the patched permissions back to storage
        localStorage.setItem('pvc_permissions', JSON.stringify(merged));
      } catch (e) {
        setPermissions(defaultPermissions);
      }
    } else {
      localStorage.setItem('pvc_permissions', JSON.stringify(defaultPermissions));
    }
    
    // Load users
    fetch(`${API_BASE_URL}/users`)
      .then(res => res.json())
      .then(async data => {
        if (data.length === 0) {
          // Initialize DB with dummyUsers if empty
          for (const u of dummyUsers) {
            await fetch(`${API_BASE_URL}/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: u.username, password: u.password, name: u.name, role: u.role })
            });
          }
          const res = await fetch(`${API_BASE_URL}/users`);
          const newData = await res.json();
          setUsers(newData);
        } else {
          setUsers(data);
        }
      })
      .catch(() => {
        setUsers(dummyUsers);
      });
  }, []);

  const login = async (roleOrUsername, password) => {
    // Simulate network delay to feel like a real login
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Use dynamic users array instead of dummyUsers
      const user = users.find(u => 
        (u.username.toLowerCase() === roleOrUsername.toLowerCase() || u.role.toLowerCase() === roleOrUsername.toLowerCase()) 
        && u.password === password
      );

      if (user) {
        const userData = { id: user.id, username: user.username, name: user.name, role: user.role };
        setCurrentUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('pvc_user', JSON.stringify(userData));
        return { success: true };
      } else {
        return { success: false, message: 'Invalid account or password' };
      }
    } catch (error) {
      console.error("Login API error:", error);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('pvc_user');
  };

  const updateProfile = async (newName, newPassword, oldPassword) => {
    const dummyUserIndex = users.findIndex(u => u.id === currentUser.id);
    if (dummyUserIndex === -1) return { success: false, message: 'User not found.' };
    
    const dummyUser = { ...users[dummyUserIndex] };
    
    if (newPassword) {
      if (dummyUser.password !== oldPassword) {
        return { success: false, message: 'Incorrect old password.' };
      }
      dummyUser.password = newPassword;
    }
    
    if (newName) {
      dummyUser.name = newName;
    }

    try {
      await fetch(`${API_BASE_URL}/users/${dummyUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyUser)
      });

      const updatedUsers = [...users];
      updatedUsers[dummyUserIndex] = dummyUser;
      setUsers(updatedUsers);

      const updatedUser = { ...currentUser };
      if (newName) updatedUser.name = newName;
      
      setCurrentUser(updatedUser);
      localStorage.setItem('pvc_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      return { success: false, message: 'API Error' };
    }
  };

  const addUser = async (newUser) => {
    await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    // Refetch to get new ID
    const res = await fetch(`${API_BASE_URL}/users`);
    const data = await res.json();
    setUsers(data);
    
    // Also ensure this role has default permissions
    if (!permissions[newUser.role]) {
      const updatedPerms = {
        ...permissions,
        [newUser.role]: { allowedPages: [...BASIC_PAGES], editPages: [] }
      };
      setPermissions(updatedPerms);
      localStorage.setItem('pvc_permissions', JSON.stringify(updatedPerms));
    }
  };

  const updateUser = async (id, updatedData) => {
    await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...updatedData } : u);
    setUsers(updatedUsers);
  };

  const deleteUser = async (id) => {
    await fetch(`${API_BASE_URL}/users`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] })
    });
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
  };

  const hasEditPermission = (pageName) => {
    if (!currentUser) return false;
    const userPerms = permissions[currentUser.role];
    if (!userPerms) return false;
    
    // Backwards compatibility for the old global canEdit property
    if (userPerms.canEdit === true) return true;
    
    return userPerms.editPages?.includes(pageName) || false;
  };

  const updatePermissions = (role, newPermissions) => {
    const updated = {
      ...permissions,
      [role]: { ...permissions[role], ...newPermissions }
    };
    setPermissions(updated);
    localStorage.setItem('pvc_permissions', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, permissions, users, addUser, updateUser, deleteUser, hasEditPermission, updatePermissions, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
