import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const roleOptions = ['hospital_staff', 'blood_bank_staff'];

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error || !data.user) throw new Error(error?.message || 'Registration failed');

      // Check if user needs email confirmation (only if email confirmation is enabled)
      if (data.user && !data.user.email_confirmed_at && data.user.email_confirmed_at !== null) {
        alert('Please check your email and confirm your account before logging in.');
        navigate('/login');
        return;
      }

      // Insert into 'profiles' table
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        name: fullName,
        role: selectedRole,
        phone_number: null,
        facility_id: null,
      });
      
      if (profileError) {
        console.error('Profile insert error:', profileError);
        if (profileError.message.includes('row-level security policy')) {
          throw new Error('Security policy error. Please contact administrator or check RLS policies.');
        }
        throw new Error(profileError.message);
      }

      if (data.user && !data.user.email_confirmed_at) {
        alert('Account created! Please check your email to confirm your account before logging in.');
      } else {
        alert('Account created successfully! You can now log in.');
      }
      navigate('/login');
    } catch (e: any) {
      console.error('Registration error:', e);
      alert(e.message || 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Register</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </div>
      <div style={{ marginBottom: 32 }}>
        <label>Role</label>
        <select
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          disabled={isLoading}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        >
          {roleOptions.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleRegister}
        disabled={isLoading}
        style={{ width: '100%', padding: 12, background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4 }}
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
      
      <button
        onClick={() => navigate('/donor-registration')}
        disabled={isLoading}
        style={{ 
          width: '100%', 
          marginTop: 12, 
          background: '#4CAF50', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 4,
          padding: 12,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 'bold'
        }}
      >
        🩸 Become a Blood Donor
      </button>
      
      <div style={{ marginTop: 16, padding: 12, background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 4, fontSize: 12 }}>
        <strong>Note:</strong> If you get a security policy error, you may need to:
        <br />1. Confirm your email first, or
        <br />2. Contact your administrator to set up RLS policies
      </div>
    </div>
  );
};

export default Register; 