import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { ROUTES } from '../components/routes';

const BloodBankDashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    { id: 1, title: 'View Inventory', icon: '📦', route: ROUTES.inventory, color: '#4CAF50' },
    { id: 2, title: 'Add Blood Units', icon: '➕', route: ROUTES.addInventory, color: '#FF5252' },
    { id: 3, title: 'Approve Requests', icon: '✅', route: ROUTES.approveRequests, color: '#2196F3' }, // assuming this is the approve page
    { id: 4, title: 'Transfer Status', icon: '🚚', route: ROUTES.transferStatus, color: '#FF9800' },
    { id: 5, title: 'Donor Management', icon: '👥', route: ROUTES.DonorList, color: '#9C27B0' },
    { id: 6, title: 'Analytics', icon: '📊', route: ROUTES.analytics, color: '#607D8B' }
  ];

  return (
    <ProtectedLayout>
      <PageHeader
        title="Blood Bank Dashboard"
        description="Welcome, Blood Bank Staff! Manage inventory and approve blood requests here."
      />
      
      <Card>
        <h2 style={{ color: '#333', marginBottom: 20, marginTop: 0 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {quickActions.map(action => (
            <div
              key={action.id}
              onClick={() => navigate(action.route)}
              style={{
                background: action.color,
                color: '#fff',
                padding: '20px',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{action.icon}</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>{action.title}</div>
            </div>
          ))}
        </div>
      </Card>
    </ProtectedLayout>
  );
};

export default BloodBankDashboard;
