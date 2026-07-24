import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { MdMenu, MdWarningAmber } from 'react-icons/md';
import { useAssets } from '../context/AssetContext';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDummyData } = useAssets();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isDummyData) {
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isDummyData]);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-layout">
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <img 
          className="mobile-logo light-logo"
          src="/ml.png" 
          alt="PVC ATS Logo Light" 
        />
        <img 
          className="mobile-logo dark-logo"
          src="/md.png" 
          alt="PVC ATS Logo Dark" 
        />
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <MdMenu size={28} />
        </button>
      </div>

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="mobile-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <main className="main-content">
        {showBanner && (
          <div className="dummy-data-banner">
            <MdWarningAmber size={24} />
            <div className="banner-text">
              <strong>Database Connection Failed!</strong>
              <p>You are currently viewing offline demonstration dummy data.</p>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
