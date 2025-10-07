import { useEffect, useCallback, useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import supabase from '../utils/supabaseClient';
import { issueUnits, returnUnits, reserveUnits, getCurrentStaffContext } from '../utils/inventoryService';

interface BloodInventory {
  inventory_id: string;
  blood_type: string;
  quantity_units: number;
  expiry_date: string;
  status: 'available' | 'reserved' | 'expired';
  created_at?: string;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 8px',
  fontWeight: 'bold',
  color: '#555',
  borderBottom: '2px solid #ddd'
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  color: '#333'
};

const InventoryList: React.FC = () => {
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userRole, setUserRole] = useState<string>('');
  const [facilityId, setFacilityId] = useState<string>('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Resolve staff facility context
      const ctx = await getCurrentStaffContext();
      setUserRole(localStorage.getItem('user_role') || '');
      setFacilityId(ctx.facilityId || '');

      let query = supabase
        .from('blood_inventory')
        .select('*', { count: 'exact' })
        .order('blood_type');
      if (ctx.facilityId) {
        query = query.eq('facility_id', ctx.facilityId);
      }

      const { data, error, count } = await query;

      console.log('DEBUG - Supabase response:', { data, error, count });

      if (error) throw new Error(error.message);

      setInventory(data || []);
    } catch (e: any) {
      console.error('DEBUG - Fetch error:', e);
      setError(e.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('blood_inventory_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blood_inventory' },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInventory]);

  const refreshInventory = async () => await fetchInventory();

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.blood_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedInventory = filteredInventory.reduce((acc, item) => {
    const existing = acc.find(x => x.blood_type === item.blood_type);
    if (existing) {
      existing.units += item.quantity_units;
      existing.items.push(item);
    } else {
      acc.push({ blood_type: item.blood_type, units: item.quantity_units, items: [item] });
    }
    return acc;
  }, [] as { blood_type: string; units: number; items: BloodInventory[] }[]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#388e3c';
      case 'reserved': return '#f57c00';
      case 'expired': return '#d32f2f';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) =>
    new Date(expiryDate) < new Date();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const getExpiryStatus = (expiryDate: string) => {
    if (isExpired(expiryDate)) return { text: 'EXPIRED', color: '#d32f2f', background: '#ffebee' };
    if (isExpiringSoon(expiryDate)) return { text: 'EXPIRING SOON', color: '#f57c00', background: '#fff3e0' };
    return { text: 'VALID', color: '#388e3c', background: '#e8f5e9' };
  };

  if (loading) return (
    <ProtectedLayout>
      <div style={{ textAlign: 'center', fontSize: 16, marginTop: 40 }}>Loading inventory...</div>
    </ProtectedLayout>
  );

  if (error) return (
    <ProtectedLayout>
      <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ color: '#FF5252', marginBottom: 20 }}>Blood Inventory</h1>

        {/* Search & Filter */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 30 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Search Blood Type</label>
              <input
                type="text"
                placeholder="Search by blood type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 16 }}
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={refreshInventory}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 30 }}>
          <h2 style={{ color: '#1976d2', marginBottom: 16 }}>Inventory Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d32f2f' }}>
                {inventory.reduce((sum, i) => sum + i.quantity_units, 0)}
              </div>
              <div style={{ fontSize: 14, color: '#555' }}>Total Units</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#388e3c' }}>
                {inventory.filter(i => i.status === 'available').reduce((sum, i) => sum + i.quantity_units, 0)}
              </div>
              <div style={{ fontSize: 14, color: '#555' }}>Available Units</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f57c00' }}>
                {inventory.filter(i => i.status === 'reserved').reduce((sum, i) => sum + i.quantity_units, 0)}
              </div>
              <div style={{ fontSize: 14, color: '#555' }}>Reserved Units</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d32f2f' }}>
                {inventory.filter(i => i.status === 'expired').reduce((sum, i) => sum + i.quantity_units, 0)}
              </div>
              <div style={{ fontSize: 14, color: '#555' }}>Expired Units</div>
            </div>
          </div>
        </div>

        {/* Full Inventory Table */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 30, overflowX: 'auto' }}>
          <h2 style={{ color: '#1976d2', marginBottom: 16 }}>Full Inventory Table</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Blood Type</th>
                <th style={thStyle}>Quantity Units</th>
                <th style={thStyle}>Expiry Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const expiryStatus = getExpiryStatus(item.expiry_date);
                return (
                  <tr key={item.inventory_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{item.blood_type}</td>
                    <td style={tdStyle}>{item.quantity_units}</td>
                    <td style={{ ...tdStyle, color: expiryStatus.color }}>{formatDate(item.expiry_date)}</td>
                    <td style={{ ...tdStyle, color: getStatusColor(item.status), fontWeight: 'bold' }}>{getStatusText(item.status)}</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={async () => {
                            const units = 1;
                            try { await issueUnits(item.inventory_id, units, 'Issued to patient'); await refreshInventory(); } catch (e: any) { alert(e.message || 'Failed'); }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}
                        >Issue</button>
                        <button
                          onClick={async () => {
                            const units = 1;
                            try { await reserveUnits(item.inventory_id, units, 'Reserved for procedure'); await refreshInventory(); } catch (e: any) { alert(e.message || 'Failed'); }
                          }}
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#f57c00', color: '#fff', cursor: 'pointer' }}
                        >Reserve</button>
                        {userRole === 'hospital_staff' && (
                          <button
                            onClick={async () => {
                              const units = 1;
                              try { await returnUnits(item.inventory_id, units, 'Return to stock'); await refreshInventory(); } catch (e: any) { alert(e.message || 'Failed'); }
                            }}
                            style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#388e3c', color: '#fff', cursor: 'pointer' }}
                          >Return</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Grouped Inventory Cards */}
        {groupedInventory.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
            {groupedInventory.map(group => (
              <div key={group.blood_type} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#d32f2f' }}>🩸 {group.blood_type}</div>
                  <span style={{
                    background: group.units > 0 ? '#388e3c' : '#d32f2f',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>{group.units} units</span>
                </div>
                <div>
                  <h4 style={{ marginBottom: 12, fontSize: 16, fontWeight: 'bold', color: '#444' }}>Details</h4>
                  {group.items.map(item => {
                    const expiryStatus = getExpiryStatus(item.expiry_date);
                    return (
                      <div key={item.inventory_id} style={{ background: '#f9f9f9', padding: 12, borderRadius: 8, marginBottom: 10, borderLeft: `4px solid ${expiryStatus.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 'bold' }}>{item.quantity_units} unit{item.quantity_units !== 1 ? 's' : ''}</span>
                          <span style={{ background: getStatusColor(item.status), color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>
                            {getStatusText(item.status)}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, color: '#555' }}><strong>Expiry:</strong> {formatDate(item.expiry_date)}</div>
                        <div style={{ background: expiryStatus.background, color: expiryStatus.color, padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold', display: 'inline-block', marginTop: 6 }}>
                          {expiryStatus.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};

export default InventoryList;
