import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import supabase from '../utils/supabaseClient';
import ConfirmDialog from '../components/ConfirmDialog';

const Profile: React.FC = () => {
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [originalFullName, setOriginalFullName] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    transferUpdates: true,
    inventoryAlerts: true,
    systemMaintenance: false,
    weeklyReports: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const role = localStorage.getItem('user_role') || '';
        setUserRole(role);

        // Prefer Supabase profile for name/phone/email
        const userId = localStorage.getItem('user_id') || '';
        if (userId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, phone_number')
            .eq('user_id', userId)
            .single();
          if (!error && data) {
            const fullNameValue = data.name || 'N/A';
            const phoneNumberValue = data.phone_number || 'N/A';
            
            setFullName(fullNameValue);
            setPhoneNumber(phoneNumberValue);
            setOriginalFullName(fullNameValue);
            setOriginalPhoneNumber(phoneNumberValue);
          }
        }

        // Email from auth session if available
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const email = sessionData.session?.user?.email || localStorage.getItem('user_email') || '';
          setUserEmail(email);
        } catch {
          setUserEmail(localStorage.getItem('user_email') || '');
        }

        const savedPrefs = localStorage.getItem('notification_preferences');
        if (savedPrefs) {
          try { setNotificationPrefs(JSON.parse(savedPrefs)); } catch {}
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [infoDialog, setInfoDialog] = useState<{open:boolean; title:string; message:string}>({open:false,title:'',message:''});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const handleSave = async () => {
    setIsEditing(false);
    try {
      const userId = localStorage.getItem('user_id') || '';
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: fullName, phone_number: phoneNumber })
          .eq('user_id', userId);
        if (error) throw error;
        
        // Update original values after successful save
        setOriginalFullName(fullName);
        setOriginalPhoneNumber(phoneNumber);
      }
      setInfoDialog({open:true,title:'Saved',message:'Profile updated successfully.'});
    } catch (e: any) {
      setInfoDialog({open:true,title:'Error',message:e.message || 'Failed to save profile'});
    }
  };

  const handleNotificationSave = async () => {
    try {
      // In a real app, this would save to the database
      // For now, we'll save to localStorage
      localStorage.setItem('notification_preferences', JSON.stringify(notificationPrefs));
      alert('Notification preferences updated successfully!');
    } catch (error: any) {
      alert('Failed to update notification preferences: ' + error.message);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values from database
    setFullName(originalFullName);
    setPhoneNumber(originalPhoneNumber);
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setInfoDialog({open:true,title:'Password',message:'Password updated successfully!'});
      setShowPasswordReset(false);

      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setInfoDialog({open:true,title:'Error',message:'Failed to update password: ' + error.message});
    }
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      const { error } = await supabase.auth.admin.deleteUser(
        localStorage.getItem('user_id') || ''
      );
      if (error) throw error;
      setInfoDialog({open:true,title:'Deleted',message:'Your account was deleted.'});
      localStorage.clear();
      navigate('/login');
    } catch (error: any) {
      setInfoDialog({open:true,title:'Error',message:'Failed to delete account: ' + error.message});
    }
  };

  return (
    <ProtectedLayout>
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ color: '#FF5252', marginBottom: 24 }}>User Profile</h1>
        
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: 24
        }}>
          <h2 style={{ marginBottom: 20, color: '#333' }}>Personal Information</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ color: '#666', fontSize: 16 }}>Loading profile information...</div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: 12, 
                      border: '1px solid #ddd', 
                      borderRadius: 4,
                      fontSize: 16
                    }}
                  />
                ) : (
                  <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>{fullName}</div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Email</label>
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, color: '#666' }}>
                  {userEmail} (cannot be changed)
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: 12, 
                      border: '1px solid #ddd', 
                      borderRadius: 4,
                      fontSize: 16
                    }}
                  />
                ) : (
                  <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>{phoneNumber}</div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Role</label>
                <div style={{ 
                  padding: 12, 
                  background: '#FF5252', 
                  color: '#fff', 
                  borderRadius: 4,
                  textTransform: 'capitalize',
                  fontWeight: 'bold'
                }}>
                  {userRole.replace('_', ' ')}
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleSave}
                      style={{ 
                        padding: '12px 24px', 
                        background: '#4CAF50', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      style={{ 
                        padding: '12px 24px', 
                        background: '#f44336', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 4,
                        fontSize: 16,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ 
                      padding: '12px 24px', 
                      background: '#1976d2', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4,
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: 20, color: '#333' }}>Account Actions</h2>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/account-settings')}
              style={{ 
                padding: '12px 24px', 
                background: '#FF9800', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4,
                fontSize: '16',
                cursor: 'pointer'
              }}
            >
              Account Settings
            </button>
            
            <button
              onClick={() => setShowPasswordReset(true)}
              style={{ 
                padding: '12px 24px', 
                background: '#9C27B0', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Change Password
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ 
                padding: '12px 24px', 
                background: '#f44336', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4,
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div style={{ 
          background: '#fff', 
          padding: 24, 
          borderRadius: 8, 
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: 24
        }}>
          <h2 style={{ marginBottom: 20, color: '#333' }}>🔔 Notification Preferences</h2>
          
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16, color: '#666', fontSize: '16px' }}>Communication Channels</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.emailNotifications}
                  onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>📧 Email Notifications</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.smsNotifications}
                  onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>📱 SMS Notifications</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.pushNotifications}
                  onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>🔔 Push Notifications</span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16, color: '#666', fontSize: '16px' }}>Notification Types</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.transferUpdates}
                  onChange={(e) => handleNotificationChange('transferUpdates', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>🚚 Transfer Request Updates</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.inventoryAlerts}
                  onChange={(e) => handleNotificationChange('inventoryAlerts', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>🩸 Inventory Alerts (Low Stock, Expiry)</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.systemMaintenance}
                  onChange={(e) => handleNotificationChange('systemMaintenance', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>🔧 System Maintenance Notices</span>
              </label>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notificationPrefs.weeklyReports}
                  onChange={(e) => handleNotificationChange('weeklyReports', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span>📊 Weekly Activity Reports</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleNotificationSave}
            style={{ 
              padding: '12px 24px', 
              background: '#4CAF50', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            💾 Save Notification Preferences
          </button>
        </div>

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              width: '90%'
            }}>
              <h3 style={{ marginBottom: 20 }}>Reset Password</h3>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  placeholder="Enter new password"
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
                  placeholder="Confirm new password"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handlePasswordReset}
                  style={{ padding: '8px 16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  Update Password
                </button>
                <button
                  onClick={() => setShowPasswordReset(false)}
                  style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Deletion Confirmation */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              width: '90%'
            }}>
              <h3 style={{ marginBottom: 20, color: '#f44336' }}>⚠️ Delete Account</h3>
              <p style={{ marginBottom: 20 }}>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={confirmDelete}
                  style={{ padding: '8px 16px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  Yes, Delete My Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ padding: '8px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={infoDialog.open}
          title={infoDialog.title}
          message={infoDialog.message}
          confirmText="OK"
          hideCancelButton
          onConfirm={() => setInfoDialog({open:false,title:'',message:''})}
        />
      </div>
    </ProtectedLayout>
  );
};

export default Profile; 