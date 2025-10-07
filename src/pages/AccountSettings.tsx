import React, { useState, useEffect } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import supabase from '../utils/supabaseClient';
import { getCurrentUserId, getCurrentUserEmail, getCurrentUserRole } from '../utils/authUtils';
import ConfirmDialog from '../components/ConfirmDialog';

const AccountSettings: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Light');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmInfoOpen, setConfirmInfoOpen] = useState<{ open: boolean; title: string; message: string }>(() => ({ open: false, title: '', message: '' }));

  useEffect(() => {
    // Fetch user profile from Supabase
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const userEmail = getCurrentUserEmail();
        const userRole = getCurrentUserRole();
        
        setEmail(userEmail || '');
        setRole(userRole || '');

        // Try to fetch additional profile data
        const userId = getCurrentUserId();
        if (userId && userId !== 'null' && userId.length > 10) {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, phone_number')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.log('Profile fetch error:', error);
            // Use fallback values
            setFullName('');
            setPhoneNumber('');
          } else if (data) {
            setFullName(data.name || '');
            setPhoneNumber(data.phone_number || '');
          }
        } else {
          // No user_id available, use fallback values
          setFullName('');
          setPhoneNumber('');
        }

        // Load notification preferences from localStorage
        const savedPrefs = localStorage.getItem('notification_preferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          setEmailNotifications(prefs.email || true);
          setSmsNotifications(prefs.SMS || false);
          setPushNotifications(prefs.push || true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setFullName('');
        setPhoneNumber('');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update profile in Supabase
      const userId = getCurrentUserId();
      if (!userId || userId === 'null' || userId.length <= 10) {
        throw new Error('User ID not found. Please log in again.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: fullName,
          phone_number: phoneNumber
        })
        .eq('user_id', userId);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setConfirmInfoOpen({ open: true, title: 'Saved', message: 'Profile updated successfully.' });
    } catch (error: any) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = () => {
    const prefs = {
      email: emailNotifications,
      SMS: smsNotifications,
      push: pushNotifications
    };
    
    localStorage.setItem('notification_preferences', JSON.stringify(prefs));
    setSuccess('Notification preferences saved!');
    setConfirmInfoOpen({ open: true, title: 'Saved', message: 'Notification preferences saved.' });
  };

  const handleChangePassword = () => {
    setConfirmInfoOpen({ open: true, title: 'Password', message: 'Password change flow would send a reset email.' });
  };

  const handleDeleteAccount = () => {
    setConfirmDeleteOpen(true);
  };

  const confirmDeleteAccount = async () => {
    setConfirmDeleteOpen(false);
    // Placeholder: implement actual deletion via secure admin endpoint as needed
    const userId = getCurrentUserId();
    if (!userId) {
      setError('User ID not found.');
      return;
    }
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      setConfirmInfoOpen({ open: true, title: 'Deleted', message: 'Your account was deleted.' });
      localStorage.clear();
      // Redirect can be handled after user closes dialog in a real flow
    } catch (e: any) {
      setError(e.message || 'Failed to delete account');
    }
  };

  const buildToggle = (enabled: boolean, onChange: (value: boolean) => void, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <span style={{ fontSize: '16px', color: '#333' }}>{label}</span>
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
    </div>
  );

  const buildSelect = (value: string, options: string[], onChange: (value: string) => void, label: string) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '16px',
          background: '#fff'
        }}
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  if (profileLoading) {
    return (
      <ProtectedLayout>
        <PageHeader title="Account Settings" description="Manage your account preferences" />
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', color: '#666' }}>Loading profile...</div>
          </div>
        </Card>

      {/* Confirmations */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
      <ConfirmDialog
        open={confirmInfoOpen.open}
        title={confirmInfoOpen.title}
        message={confirmInfoOpen.message}
        confirmText="OK"
        hideCancelButton
        onConfirm={() => setConfirmInfoOpen({ open: false, title: '', message: '' })}
      />
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <PageHeader
        title="Account Settings"
        description="Manage your account preferences and personal information"
      />

      {/* Profile Information */}
      <Card>
        <h2 style={{ color: '#333', marginBottom: '20px', marginTop: 0, borderBottom: '2px solid #FF5252', paddingBottom: '8px' }}>
          Profile Information
        </h2>
        
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #c8e6c9'
          }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                background: '#f5f5f5',
                color: '#666'
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>Email cannot be changed</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
              Role
            </label>
            <input
              type="text"
              value={role}
              disabled
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                background: '#f5f5f5',
                color: '#666'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setFullName('');
              setPhoneNumber('');
            }}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <h2 style={{ color: '#333', marginBottom: '20px', marginTop: 0, borderBottom: '2px solid #FF5252', paddingBottom: '8px' }}>
          Notification Preferences
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          {buildToggle(notificationsEnabled, setNotificationsEnabled, 'Enable Notifications')}
          {buildToggle(emailNotifications, setEmailNotifications, 'Email Notifications')}
          {buildToggle(smsNotifications, setSmsNotifications, 'SMS Notifications')}
          {buildToggle(pushNotifications, setPushNotifications, 'Push Notifications')}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            onClick={handleSaveNotifications}
          >
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* App Preferences */}
      <Card>
        <h2 style={{ color: '#333', marginBottom: '20px', marginTop: 0, borderBottom: '2px solid #FF5252', paddingBottom: '8px' }}>
          App Preferences
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {buildSelect(language, ['English', 'Chichewa', 'French'], setLanguage, 'Language')}
          {buildSelect(theme, ['Light', 'Dark', 'Auto'], setTheme, 'Theme')}
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <h2 style={{ color: '#333', marginBottom: '20px', marginTop: 0, borderBottom: '2px solid #FF5252', paddingBottom: '8px' }}>
          Security
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={handleChangePassword}
          >
            🔐 Change Password
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
          >
            🗑️ Delete Account
          </Button>
        </div>
      </Card>
    </ProtectedLayout>
  );
};

export default AccountSettings;