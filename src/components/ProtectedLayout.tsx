import React, { useState } from 'react';
import AuthGuard from './AuthGuard';
import AppDrawer from './AppDrawer';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <AuthGuard>
      <div className="protected-layout">
        {/* Top Navigation Bar */}
        <div className="top-nav">
          <button 
            className="menu-toggle"
            onClick={toggleDrawer}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
          <div className="nav-title">Blood Bank Management</div>
        </div>

        {/* App Drawer */}
        <AppDrawer isOpen={isDrawerOpen} onToggle={toggleDrawer} />
        
        {/* Main Content */}
        <div className={`main-content ${isDrawerOpen ? 'drawer-open' : ''}`}>
          {children}
        </div>
      </div>
    </AuthGuard>
  );
};

export default ProtectedLayout; 