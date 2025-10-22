import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error || !data.user) {
        throw new Error(error?.message || 'Invalid credentials');
      }

      const profileResult = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
        
      if (profileResult.error || !profileResult.data) {
        throw new Error(profileResult.error?.message || 'Could not fetch user role');
      }

      const userRole = profileResult.data.role as string;
      
      // Debug logging
      console.log('Login successful for user:', email);
      console.log('User role from database:', userRole);
      
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('is_logged_in', 'true');
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_id', data.user.id);
      
      console.log('Stored in localStorage:', {
        user_role: localStorage.getItem('user_role'),
        is_logged_in: localStorage.getItem('is_logged_in')
      });

      if (userRole === 'admin') {
        console.log('Navigating to admin dashboard');
        navigate('/admin-dashboard');
      } else if (userRole === 'blood_bank_admin' || userRole === 'blood_bank_staff') {
        console.log('Navigating to blood bank dashboard');
        navigate('/bloodbank-dashboard');
      } else if (userRole === 'hospital_staff') {
        console.log('Navigating to hospital dashboard');
        navigate('/hospital-dashboard');
      } else if (userRole === 'donor') {
        console.log('Navigating to donor profile');
        navigate('/donor/profile');
      } else {
        // Fallback
        console.log('Unknown role, redirecting to login:', userRole);
        navigate('/login');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '40px auto', 
      padding: 20, 
      border: '1px solid #eee', 
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      background: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', color: 'var(--color-primary)', marginBottom: 24 }}>Blood Bank Login</h2>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: 'var(--color-danger)', 
          padding: 12, 
          borderRadius: 4, 
          marginBottom: 16,
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
          style={{ 
            width: '90%', 
            padding: 12, 
            border: '1px solid #ddd', 
            borderRadius: 4,
            fontSize: 16
          }}
          placeholder="Enter your email"
        />
      </div>
      
      <div style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
          style={{ 
            width: '90%', 
            padding: 12, 
            border: '1px solid #ddd', 
            borderRadius: 4,
            fontSize: 16
          }}
          placeholder="Enter your password"
        />
      </div>
      
      <button
        onClick={handleLogin}
        disabled={isLoading}
        style={{ 
          width: '100%', 
          padding: 14, 
          background: 'var(--color-primary)', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 4,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      
      <button
        onClick={() => navigate('/register')}
        disabled={isLoading}
        style={{ 
          width: '90%', 
          marginTop: 16, 
          background: 'none', 
          color: 'var(--color-primary)', 
          border: 'none', 
          textDecoration: 'underline', 
          cursor: 'pointer',
          fontSize: 14
        }}
      >
        Don't have an account? Register
      </button>
      
      <button
        onClick={() => navigate('/donors')}
        disabled={isLoading}
        style={{ 
          width: '100%', 
          marginTop: 12, 
          background: 'var(--color-success)', 
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
      
    
        
     
    </div>
  );
};

export default Login; 