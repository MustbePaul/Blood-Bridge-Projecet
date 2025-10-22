import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Role } from '../rbac/rbac';
import { ROUTES } from './routes';
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

// Organized drawer items - Dashboards first, then grouped by functionality
const drawerItems: DrawerItem[] = [
  // === DASHBOARDS (Always at top) ===
  { label: 'Admin Dashboard', icon: '🛠️', path: ROUTES.adminDashboard, roles: ['admin'] },
  { label: 'Blood Bank Dashboard', icon: '🏦', path: ROUTES.bloodBankDashboard, roles: ['blood_bank_staff', 'blood_bank_admin'] },
  { label: 'Hospital Dashboard', icon: '🏥', path: ROUTES.hospitalDashboard, roles: ['hospital_staff'] },

  // === INVENTORY MANAGEMENT ===
  { label: 'View Inventory', icon: '📦', path: ROUTES.inventory, roles: ['blood_bank_staff','blood_bank_admin','hospital_staff'] },
  { label: 'Add Inventory', icon: '➕', path: ROUTES.addInventory, roles: ['blood_bank_staff','blood_bank_admin','hospital_staff'] },

  // === BLOOD REQUESTS & TRANSFERS ===
  { label: 'New Blood Request', icon: '📝', path: ROUTES.newRequest, roles: ['hospital_staff'] },
  { label: 'New Transfer Request', icon: '📤', path: ROUTES.transferRequest, roles: ['hospital_staff'] },
  { label: 'Order Tracking', icon: '📦', path: ROUTES.orderTracking, roles: ['hospital_staff'] },
  { label: 'Approve Requests', icon: '✅', path: ROUTES.approveRequests, roles: ['blood_bank_staff', 'blood_bank_admin'] },
  { label: 'Transfer Status', icon: '🚚', path: ROUTES.transferStatus, roles: ['hospital_staff','blood_bank_staff', 'blood_bank_admin'] },

  // === DONOR MANAGEMENT ===
  { label: 'Registered Donors', icon: '👥', path: ROUTES.DonorList, roles: ['blood_bank_staff', 'blood_bank_admin'] },

  // === ADMINISTRATION (System/Org Management) ===
  { label: 'User Management', icon: '👥', path: ROUTES.UserManagement, roles: ['admin', 'blood_bank_admin'] },
  { label: 'Hospitals', icon: '🏥', path: '/hospitals', roles: ['admin'] },
  { label: 'Blood Banks', icon: '🏦', path: ROUTES.Blood_banks, roles: ['admin'] },
  { label: 'Blood Types', icon: '🧬', path: ROUTES.Bloodtypes, roles: ['admin'] },

  // === ANALYTICS & MONITORING ===
  { label: 'Analytics', icon: '📈', path: ROUTES.analytics, roles: ['admin'] },
  { label: 'System Health', icon: '🖥️', path: ROUTES.systemHealth, roles: ['admin'] },

  // === PERSONAL & COMMON ===
  { label: 'Notifications', icon: '🔔', path: ROUTES.notifications, roles: ['admin','hospital_staff','blood_bank_staff','blood_bank_admin'], showNotificationCount: true },
  { label: 'Profile', icon: '👤', path: ROUTES.profile, roles: ['admin','hospital_staff','blood_bank_staff','blood_bank_admin'] },
  { label: 'Settings', icon: '⚙️', path: ROUTES.settings, roles: ['admin','hospital_staff','blood_bank_staff','blood_bank_admin'] },
];

const AppDrawer: React.FC<AppDrawerProps> = ({ isOpen, onToggle }) => {
  const [userRole, setUserRole] = useState<Role | ''>('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const navigate = useNavigate();

useEffect(() => {
    const raw = localStorage.getItem('user_role') || '';
    // Database stores: 'admin', 'blood_bank_staff', 'hospital_staff', 'donor'
    setUserRole(raw as Role);
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

  // Filter links by role and organize into sections
  const linksForRole = drawerItems.filter(item => item.roles.includes(userRole));

  // Function to render drawer sections with separators
  const renderDrawerSections = (links: DrawerItem[], currentRole: Role | '') => {
    const sections = [
      { name: 'DASHBOARDS', items: links.filter(link => link.path.includes('-dashboard')) },
      { name: 'INVENTORY', items: links.filter(link => link.path.includes('inventory')) },
      { name: 'REQUESTS & TRANSFERS', items: links.filter(link => 
        link.path.includes('request') || link.path.includes('transfer') || link.path.includes('approve') || link.path.includes('tracking')
      ) },
      { name: 'DONOR MANAGEMENT', items: links.filter(link => link.path.includes('donor')) },
      { name: 'ADMINISTRATION', items: links.filter(link => 
        link.path.includes('user-management') || link.path.includes('hospitals') || 
        link.path.includes('blood-banks') || link.path.includes('blood-types')
      ) },
      { name: 'ANALYTICS', items: links.filter(link => 
        link.path.includes('analytics') || link.path.includes('system-health')
      ) },
      { name: 'PERSONAL', items: links.filter(link => 
        link.path.includes('notification') || link.path.includes('profile') || link.path.includes('settings')
      ) },
    ];

    return sections.map((section, index) => {
      if (section.items.length === 0) return null;
      
      return (
        <div key={section.name}>
          {index > 0 && section.items.length > 0 && (
            <div style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: '#999', 
              padding: '8px 16px 4px', 
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {section.name}
            </div>
          )}
          {section.items.map(link => (
            <DrawerLink 
              key={link.path} 
              label={link.label} 
              icon={link.icon} 
              onClick={() => navAndClose(link.path)}
              notificationCount={link.showNotificationCount ? unreadNotificationCount : undefined}
            />
          ))}
        </div>
      );
    }).filter(Boolean);
  };

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
            {renderDrawerSections(linksForRole, userRole)}
            <hr />
            <DrawerLink label="Logout" icon="🚚" onClick={logout} />
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