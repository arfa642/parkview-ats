import React, { createContext, useState, useEffect, useContext } from 'react';
import { dummyUsers } from '../dummyData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pvc_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (roleOrUsername, password) => {
    // Simulate network delay to feel like a real login
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const user = dummyUsers.find(u => 
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

  const updateProfile = (newName, newPassword, oldPassword) => {
    const dummyUser = dummyUsers.find(u => u.id === currentUser.id);
    if (newPassword) {
      if (!dummyUser || dummyUser.password !== oldPassword) {
        return { success: false, message: 'Incorrect old password.' };
      }
      dummyUser.password = newPassword;
    }
    
    if (dummyUser && newName) {
      dummyUser.name = newName;
    }

    const updatedUser = { ...currentUser };
    if (newName) updatedUser.name = newName;
    
    setCurrentUser(updatedUser);
    localStorage.setItem('pvc_user', JSON.stringify(updatedUser));
    return { success: true };
  };

  const isReadOnly = currentUser?.role === 'HR' || currentUser?.role === 'CEO';

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isReadOnly, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
