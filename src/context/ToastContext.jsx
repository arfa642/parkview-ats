import React, { createContext, useState, useContext, useCallback } from 'react';
import { MdCheckCircle, MdError, MdInfo } from 'react-icons/md';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter(toast => toast.id !== id));
    }, 3000); // 3 second duration
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--nav-hover)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderLeft: `4px solid ${toast.type === 'success' ? '#22c55e' : toast.type === 'error' ? '#ef4444' : '#3b82f6'}`,
            animation: 'slideIn 0.3s ease-out forwards'
          }}>
            {toast.type === 'success' && <MdCheckCircle color="#22c55e" size={20} />}
            {toast.type === 'error' && <MdError color="#ef4444" size={20} />}
            {toast.type === 'info' && <MdInfo color="#3b82f6" size={20} />}
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{toast.message}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
