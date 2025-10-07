import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';


interface SystemMetrics {
  databaseConnections: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskSpace: number;
  uptime: number;
  lastBackup: string;
  securityStatus: 'secure' | 'warning' | 'critical';
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  lastChecked: string;
  message: string;
}

const SystemHealth: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    databaseConnections: 0,
    activeUsers: 0,
    systemLoad: 0,
    memoryUsage: 0,
    diskSpace: 0,
    uptime: 0,
    lastBackup: '',
    securityStatus: 'secure'
  });
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSystemMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate system metrics (in a real app, these would come from system monitoring)
      const mockMetrics: SystemMetrics = {
        databaseConnections: Math.floor(Math.random() * 50) + 10,
        activeUsers: Math.floor(Math.random() * 100) + 20,
        systemLoad: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskSpace: Math.random() * 100,
        uptime: Date.now() - new Date('2024-01-01').getTime(),
        lastBackup: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        securityStatus: Math.random() > 0.8 ? 'warning' : 'secure'
      };
      
      setMetrics(mockMetrics);
      
      // Perform health checks
      const checks: HealthCheck[] = [
        {
          service: 'Database',
          status: 'healthy',
          responseTime: Math.random() * 100 + 10,
          lastChecked: new Date().toISOString(),
          message: 'Database connection stable'
        },
        {
          service: 'Authentication Service',
          status: 'healthy',
          responseTime: Math.random() * 50 + 5,
          lastChecked: new Date().toISOString(),
          message: 'Auth service responding normally'
        },
        {
          service: 'File Storage',
          status: 'healthy',
          responseTime: Math.random() * 200 + 20,
          lastChecked: new Date().toISOString(),
          message: 'Storage service operational'
        },
        {
          service: 'Email Service',
          status: Math.random() > 0.9 ? 'warning' : 'healthy',
          responseTime: Math.random() * 300 + 50,
          lastChecked: new Date().toISOString(),
          message: Math.random() > 0.9 ? 'High response time detected' : 'Email service normal'
        }
      ];
      
      setHealthChecks(checks);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchSystemMetrics, autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  };

  const formatUptime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${minutes}m`;
  };

  const buildMetricCard = (title: string, value: string | number, unit: string, color: string, icon: string) => (
    <div style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      textAlign: 'center',
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
        {value}{unit}
      </div>
      <div style={{ fontSize: '14px', color: '#666' }}>{title}</div>
    </div>
  );

  const buildHealthCheckItem = (check: HealthCheck) => (
    <div key={check.service} style={{
      background: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${getStatusColor(check.status)}`,
      marginBottom: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: '20px', marginRight: '12px' }}>
            {getStatusIcon(check.status)}
          </div>
          <div>
            <div style={{ fontWeight: '500', color: '#333' }}>{check.service}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date(check.lastChecked).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {check.responseTime.toFixed(0)}ms
          </div>
          <div style={{ fontSize: '12px', color: getStatusColor(check.status) }}>
            {check.status.toUpperCase()}
          </div>
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
        {check.message}
      </div>
    </div>
  );

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#FF5252', margin: 0 }}>System Health Monitor</h1>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>Real-time system performance and health status</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                padding: '10px 20px',
                background: autoRefresh ? '#4CAF50' : '#9E9E9E',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchSystemMetrics}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#FF5252',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '🔄 Refreshing...' : '🔄 Refresh Now'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading system metrics...</div>
        ) : (
          <>
            {/* System Metrics Grid */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#333', marginBottom: '20px' }}>System Metrics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {buildMetricCard('Database Connections', metrics.databaseConnections, '', '#2196F3', '🔌')}
                {buildMetricCard('Active Users', metrics.activeUsers, '', '#4CAF50', '👥')}
                {buildMetricCard('System Load', metrics.systemLoad.toFixed(1), '%', '#FF9800', '📊')}
                {buildMetricCard('Memory Usage', metrics.memoryUsage.toFixed(1), '%', '#9C27B0', '💾')}
                {buildMetricCard('Disk Space', metrics.diskSpace.toFixed(1), '%', '#607D8B', '💿')}
                {buildMetricCard('Uptime', formatUptime(metrics.uptime), '', '#00BCD4', '⏱️')}
              </div>
            </div>

            {/* Security Status */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Security Status</h2>
              <div style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getStatusColor(metrics.securityStatus)}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '24px', marginRight: '16px' }}>
                      {getStatusIcon(metrics.securityStatus)}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '500', color: '#333' }}>
                        Security Status: {metrics.securityStatus.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        Last updated: {new Date().toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Last backup: {new Date(metrics.lastBackup).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(metrics.lastBackup).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Health Checks */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Service Health Checks</h2>
              <div style={{ display: 'grid', gap: '12px' }}>
                {healthChecks.map(buildHealthCheckItem)}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Quick Actions</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/settings')}
                  style={{
                    padding: '12px 24px',
                    background: '#FF5252',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ⚙️ System Settings
                </button>
                <button
                  onClick={() => navigate('/notifications')}
                  style={{
                    padding: '12px 24px',
                    background: '#FF9800',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  🔔 View Alerts
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  style={{
                    padding: '12px 24px',
                    background: '#2196F3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  📊 Performance Analytics
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  );
};

export default SystemHealth;
