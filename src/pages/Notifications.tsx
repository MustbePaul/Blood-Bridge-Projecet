import { useEffect, useState, useCallback } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import supabase from '../utils/supabaseClient';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  category: string;
}

const Notifications: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      const formattedNotifications = (data || []).map((n: any) => ({
        id: n.id || Math.random().toString(),
        message: n.message || 'No message',
        type: n.type || 'info',
        priority: n.priority || 'medium',
        created_at: n.created_at || new Date().toISOString(),
        read: n.read || false,
        category: n.category || 'System'
      }));
      
      setNotifications(formattedNotifications);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch notifications');
      // Create mock notifications for demo
      setNotifications([
        {
          id: '1',
          message: 'Blood type O- is running low. Please contact donors.',
          type: 'warning',
          priority: 'high',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          category: 'Inventory'
        },
        {
          id: '2',
          message: 'New blood request from Queen Elizabeth Central Hospital',
          type: 'info',
          priority: 'medium',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          category: 'Request'
        },
        {
          id: '3',
          message: 'System maintenance scheduled for tonight at 2 AM',
          type: 'info',
          priority: 'low',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read: false,
          category: 'System'
        },
        {
          id: '4',
          message: 'Critical: Blood bank temperature sensor malfunction detected',
          type: 'error',
          priority: 'critical',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          read: false,
          category: 'System'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'critical') return notification.priority === 'critical';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', id);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      // For demo purposes, just update locally
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('alerts')
        .update({ read: true })
        .in('id', notifications.map(n => n.id));
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      // For demo purposes, just update locally
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from('alerts')
        .delete()
        .eq('id', id);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      // For demo purposes, just update locally
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const clearAllNotifications = async () => {
    try {
      await supabase
        .from('alerts')
        .delete()
        .neq('id', '');

      setNotifications([]);
    } catch (error) {
      // For demo purposes, just update locally
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  return (
    <ProtectedLayout>
      <PageHeader
        title="🔔 Notifications"
        description={`${unreadCount} unread notifications${criticalCount > 0 ? `, ${criticalCount} critical` : ''}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="secondary"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
            <Button
              variant="secondary"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </Button>
            <Button
              variant="primary"
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <Card>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '8px 16px',
              background: filter === 'all' ? '#FF5252' : '#f5f5f5',
              color: filter === 'all' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              padding: '8px 16px',
              background: filter === 'unread' ? '#FF5252' : '#f5f5f5',
              color: filter === 'unread' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('critical')}
            style={{
              padding: '8px 16px',
              background: filter === 'critical' ? '#F44336' : '#f5f5f5',
              color: filter === 'critical' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Critical ({criticalCount})
          </button>
        </div>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <div style={{ fontSize: '16px', color: '#666' }}>Loading notifications...</div>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
            <div style={{ color: '#F44336', marginBottom: '16px' }}>{error}</div>
            <Button variant="primary" onClick={fetchNotifications}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description={filter === 'unread' ? "You're all caught up! No unread notifications." : 
                     filter === 'critical' ? "No critical notifications at this time." : 
                     "No notifications available."}
          icon={<span>🔔</span>}
          action={
            <Button variant="secondary" onClick={() => setFilter('all')}>
              View All Notifications
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredNotifications.map((notification) => (
            <Card key={notification.id}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                background: notification.read ? '#fff' : '#f8f9fa'
              }}>
                <div style={{ fontSize: '24px', marginTop: '4px' }}>
                  {getTypeIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {getPriorityIcon(notification.priority)}
                    </span>
                    <span style={{
                      background: getPriorityColor(notification.priority),
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {notification.priority.toUpperCase()}
                    </span>
                    <span style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      {notification.category}
                    </span>
                    {!notification.read && (
                      <span style={{
                        background: '#FF5252',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '50%',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: '16px',
                    color: '#333',
                    marginBottom: '8px',
                    fontWeight: notification.read ? '400' : '500'
                  }}>
                    {notification.message}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textDecoration: 'underline'
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#F44336',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textDecoration: 'underline'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
};

export default Notifications; 