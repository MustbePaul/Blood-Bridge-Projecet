import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';

const Settings: React.FC = () => {
  const [autoBackup, setAutoBackup] = useState(true);
  const [dataRetention, setDataRetention] = useState('7 years');
  const [auditLogs, setAuditLogs] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const navigate = useNavigate();

  const buildSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    onClick: () => void,
    rightElement?: React.ReactNode,
    showArrow: boolean = true
  ) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        background: '#fff',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
    >
      <div style={{ fontSize: '24px', marginRight: '16px', width: '24px', textAlign: 'center' }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>
          {title}
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
          {subtitle}
        </div>
      </div>
      {rightElement && (
        <div style={{ marginRight: '12px' }}>
          {rightElement}
        </div>
      )}
      {showArrow && (
        <div style={{ color: '#999', fontSize: '18px' }}>›</div>
      )}
    </div>
  );

  const buildToggle = (enabled: boolean, onChange: (value: boolean) => void) => (
    <div
      style={{
        width: '50px',
        height: '28px',
        background: enabled ? '#FF5252' : '#ccc',
        borderRadius: '14px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onClick={() => onChange(!enabled)}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: enabled ? '24px' : '2px',
          transition: 'left 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );

  const buildSelect = (value: string, options: string[], onChange: (value: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        background: '#fff',
        fontSize: '14px',
        color: '#333',
        cursor: 'pointer'
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header */}
        <div style={{
          background: '#FF5252',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ‹
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>System Settings</h1>
        </div>

        {/* Account Settings Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Account</h2>
          </div>
          
          {buildSettingItem(
            '👤',
            'Account Settings',
            'Manage your personal account preferences',
            () => navigate('/account-settings')
          )}
          
          {buildSettingItem(
            '🔐',
            'Security & Privacy',
            'Password, two-factor authentication, and privacy settings',
            () => navigate('/profile')
          )}
          
          {buildSettingItem(
            '👥',
            'User Management',
            'Manage system users and permissions',
            () => navigate('/profile')
          )}
        </div>

        {/* System Configuration Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>System Configuration</h2>
          </div>
          
          {buildSettingItem(
            '🏥',
            'Facility Management',
            'Configure hospitals and blood banks',
            () => navigate('/facilities')
          )}
          
          {buildSettingItem(
            '🩸',
            'Blood Type Settings',
            'Manage blood type configurations',
            () => navigate('/blood-types')
          )}
          
          {buildSettingItem(
            '📊',
            'Analytics Configuration',
            'Set up reporting and analytics parameters',
            () => navigate('/analytics')
          )}
        </div>

        {/* Data & Backup Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Data & Backup</h2>
          </div>
          
          {buildSettingItem(
            '💾',
            'Auto Backup',
            'Automatically backup system data',
            () => {},
            buildToggle(autoBackup, setAutoBackup),
            false
          )}
          
          {buildSettingItem(
            '🗓️',
            'Data Retention',
            'How long to keep system data',
            () => {},
            buildSelect(dataRetention, ['1 year', '3 years', '5 years', '7 years', 'Forever'], setDataRetention),
            false
          )}
          
          {buildSettingItem(
            '📝',
            'Audit Logs',
            'Track system activities and changes',
            () => {},
            buildToggle(auditLogs, setAuditLogs),
            false
          )}
        </div>

        {/* Notifications Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>System Notifications</h2>
          </div>
          
          {buildSettingItem(
            '🔔',
            'System Alerts',
            'Receive alerts about system issues',
            () => {},
            buildToggle(systemNotifications, setSystemNotifications),
            false
          )}
          
          {buildSettingItem(
            '⚠️',
            'Emergency Notifications',
            'Critical blood shortage and emergency alerts',
            () => navigate('/notifications')
          )}
          
          {buildSettingItem(
            '📧',
            'Email Settings',
            'Configure system email notifications',
            () => navigate('/email-settings')
          )}
        </div>

        {/* Maintenance Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Maintenance</h2>
            </div>
          
          {buildSettingItem(
            '🔧',
            'Maintenance Mode',
            'Put system in maintenance mode',
            () => {},
            buildToggle(maintenanceMode, setMaintenanceMode),
            false
          )}
          
          {buildSettingItem(
            '📊',
            'System Health',
            'Monitor system performance and status',
            () => navigate('/system-health')
          )}
          
          {buildSettingItem(
            '🔄',
            'System Updates',
            'Check for and install system updates',
            () => navigate('/updates')
          )}
        </div>

        {/* Advanced Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Advanced</h2>
          </div>
          
          {buildSettingItem(
            '⚙️',
            'API Configuration',
            'Manage external API integrations',
            () => navigate('/api-settings')
          )}
          
          {buildSettingItem(
            '🔒',
            'Security Policies',
            'Configure system security rules',
            () => navigate('/security-policies')
          )}
          
          {buildSettingItem(
            '📋',
            'Compliance Settings',
            'Healthcare compliance and regulations',
            () => navigate('/compliance')
          )}
        </div>

        {/* About Section */}
        <div style={{ margin: '20px', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>About</h2>
          </div>
          
          {buildSettingItem(
            'ℹ️',
            'System Information',
            'Version, build, and technical details',
            () => navigate('/system-info')
          )}
          
          {buildSettingItem(
            '📚',
            'Help & Documentation',
            'User guides and system documentation',
            () => navigate('/help')
          )}
          
          {buildSettingItem(
            '📞',
            'Support & Contact',
            'Get help and contact support team',
            () => navigate('/support')
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
          <p>Blood Bank Management System v1.0</p>
          <p>© 2024 All rights reserved</p>
        </div>
      </div>
    </ProtectedLayout>
  );
};

export default Settings; 