import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';

interface AppDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface DrawerItem {
  label: string;
  icon?: string;
  path: string;
  roles: string[]; // roles that can see this link
  showNotificationCount?: boolean; // flag to show notification count
}

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  // add other notification properties as needed
}

const drawerItems: DrawerItem[] = [
  { label: 'Admin Dashboard', icon: '🛠️', path: '/admin-dashboard', roles: ['admin'] },
  { label: 'Hospital Dashboard', icon: '🏥', path: '/hospital-dashboard', roles: ['hospital_staff'] },
  { label: 'Blood Bank Dashboard', icon: '🏦', path: '/bloodbank-dashboard', roles: ['blood_bank_staff'] },
  { label: 'Analytics', icon: '📈', path: '/analytics', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'User Management', icon: '👥', path: '/user-management', roles: ['admin'] },
  { label: 'Donors', icon: '🧑‍🤝‍🧑', path: '/registered-donors', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'Transfer Status', icon: '🚚', path: '/transfer-status', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'New Transfer', icon: '📤', path: '/transfer-request', roles: ['admin', 'blood_bank_staff'] },
  { label: 'Inventory', icon: '🩸', path: '/inventory', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'Add Inventory', icon: '➕', path: '/add-inventory', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'New Blood Request', icon: '📝', path: '/new-request', roles: ['hospital_staff'] },
  { label: 'Notifications', icon: '🔔', path: '/notifications', roles: ['admin', 'hospital_staff', 'blood_bank_staff'], showNotificationCount: true },
  { label: 'Profile', icon: '👤', path: '/profile', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
  { label: 'Settings', icon: '⚙️', path: '/settings', roles: ['admin', 'hospital_staff', 'blood_bank_staff'] },
];

const AppDrawer: React.FC<AppDrawerProps> = ({ isOpen, onToggle }) => {
  const [userRole, setUserRole] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setUserRole(localStorage.getItem('user_role') || '');
    fetchUnreadNotificationCount();
  }, []);

  // Function to fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      // Option 1: Fetch from API
      // const response = await fetch('/api/notifications/unread-count', {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   },
      // });
      // const data = await response.json();
      // setUnreadNotificationCount(data.count || 0);

      // Option 2: Get from localStorage (for demonstration)
      const notifications: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');
      const unreadCount = notifications.filter(notification => !notification.isRead).length;
      setUnreadNotificationCount(unreadCount);

      // Option 3: Mock data for demonstration
      // setUnreadNotificationCount(Math.floor(Math.random() * 10)); // Random count for demo
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setUnreadNotificationCount(0);
    }
  };

  // Function to refresh notification count (can be called from other components)
  const refreshNotificationCount = () => {
    fetchUnreadNotificationCount();
  };

  // Make refresh function available globally (optional)
  useEffect(() => {
    (window as any).refreshNotificationCount = refreshNotificationCount;
    return () => {
      delete (window as any).refreshNotificationCount;
    };
  }, []);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const logout = () => setConfirmOpen(true);
  const confirmLogout = () => {
    setConfirmOpen(false);
    localStorage.clear();
    navigate('/login');
  };
  const cancelLogout = () => setConfirmOpen(false);

  const navAndClose = (path: string) => {
    navigate(path);
    if (window.innerWidth <= 768) onToggle();
    
    // If navigating to notifications page, refresh count after a short delay
    if (path === '/notifications') {
      setTimeout(() => {
        refreshNotificationCount();
      }, 1000);
    }
  };

  if (!userRole) {
    return (
      <>
        {isOpen && <div className="drawer-overlay" onClick={onToggle} />}
        <div className={`drawer ${isOpen ? 'open' : ''}`}>
          <div className="drawer-content">
          <div className="drawer-header">
            <div className="drawer-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={require('../logo.svg').default} alt="App logo" width={24} height={24} />
              <span>Blood Bridge</span>
            </div>
              <button className="drawer-toggle" onClick={onToggle} aria-label="Close drawer">✕</button>
            </div>
            <div className="drawer-loading">
              <span>Loading user permissions...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Filter links by role
  const linksForRole = drawerItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onToggle} />}

      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-content">
          <div className="drawer-header">
            <div className="drawer-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={require('../logo.svg').default} alt="App logo" width={24} height={24} />
              <span>Blood Bridge</span>
            </div>
            <button className="drawer-toggle" onClick={onToggle} aria-label="Toggle navigation">✕</button>
          </div>

          <div className="drawer-nav">
            {linksForRole.map(link => (
              <DrawerLink 
                key={link.path} 
                label={link.label} 
                icon={link.icon} 
                onClick={() => navAndClose(link.path)}
                notificationCount={link.showNotificationCount ? unreadNotificationCount : undefined}
              />
            ))}
            <hr />
            <DrawerLink label="Logout" icon="🚪" onClick={logout} />
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

const DrawerLink: React.FC<{ 
  label: string; 
  icon?: string; 
  onClick: () => void;
  notificationCount?: number;
}> = ({ label, icon, onClick, notificationCount }) => (
  <div
    className="drawer-link"
    onClick={onClick}
    tabIndex={0}
    role="button"
    onKeyPress={e => { if (e.key === 'Enter') onClick(); }}
  >
    <div className="drawer-link-content">
      <span style={{ marginRight: 8 }}>{icon}</span>
      {label}
    </div>
    {notificationCount !== undefined && notificationCount > 0 && (
      <span className="notification-badge">
        {notificationCount > 99 ? '99+' : notificationCount}
      </span>
    )}
  </div>
);

export default AppDrawer;