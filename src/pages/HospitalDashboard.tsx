import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { ROUTES } from '../components/routes';

const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    { id: 1, title: 'New Blood Request', icon: '🩸', route: ROUTES.newRequest, color: '#FF5252' },
    { id: 2, title: 'Track Orders', icon: '📋', route: ROUTES.orderTracking, color: '#2196F3' },
    { id: 3, title: 'View Inventory', icon: '📦', route: ROUTES.inventory, color: '#4CAF50' },
    { id: 4, title: 'Transfer Status', icon: '🚚', route: ROUTES.transferStatus, color: '#FF9800' },
    { id: 5, title: 'Donor List', icon: '👥', route: ROUTES.DonorList, color: '#9C27B0' },
    { id: 6, title: 'Notifications', icon: '🔔', route: ROUTES.notifications, color: '#F44336' },
  ];

  return (
    <ProtectedLayout>
      <PageHeader
        title="Hospital Dashboard"
        description="Welcome, Hospital Staff! Request blood, track orders, and view inventory."
      />

      <Card>
        <h2 style={{ color: '#333', marginBottom: 20, marginTop: 0 }}>Quick Actions</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {quickActions.map(action => (
            <div
              key={action.id}
              role="button"
              aria-label={action.title}
              tabIndex={0}
              onClick={() => navigate(action.route)}
              onKeyDown={e => e.key === 'Enter' && navigate(action.route)}
              style={{
                background: action.color,
                color: '#fff',
                padding: '20px',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{action.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{action.title}</div>
            </div>
          ))}
        </div>
      </Card>
    </ProtectedLayout>
  );
};

export default HospitalDashboard;
