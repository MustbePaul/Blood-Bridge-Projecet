import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from '../utils/supabaseClient';
import { getCurrentUserId } from '../utils/authUtils';

// Unified request shape for display
interface RequestRow {
  id: string;
  hospital_id?: string | null;
  hospital_name?: string | null;
  blood_type: string;
  quantity: number;
  status: string;
  created_at?: string | null;
}

const OrderTracking: React.FC = () => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDebugInfo({});

    try {
      const userId = getCurrentUserId();
      let userHospitalId: string | null = null;
      let userRole: string | null = null;

      // Debug info collection
      const debug: any = {
        userId,
        userHospitalId: null,
        userRole: null,
        profileError: null,
        queries: [],
        results: {}
      };

      if (userId) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('hospital_id, role')
          .eq('user_id', userId)
          .maybeSingle();
        
        debug.profileError = profErr;
        if (!profErr && prof) {
          userHospitalId = (prof as any).hospital_id ?? null;
          userRole = (prof as any).role ?? null;
          debug.userHospitalId = userHospitalId;
          debug.userRole = userRole;
        }
      }

      let list: RequestRow[] = [];

      // Strategy 1: Try the original query with JOIN
      try {
        debug.queries.push('Strategy 1: Original JOIN query');
        let query = supabase
          .from('blood_request')
          .select(`request_id, hospital_id, blood_type, quantity, status, created_at, hospitals ( hospital_name )`)
          .order('created_at', { ascending: false })
          .limit(500);

        // Only filter by hospital if user has hospital_id AND is hospital_staff
        if (userHospitalId && userRole === 'hospital_staff') {
          query = query.eq('hospital_id', userHospitalId);
          debug.queries.push(`Filtering by hospital_id: ${userHospitalId}`);
        }

        const { data, error } = await query;
        if (error) throw error;

        list = (data || []).map((r: any) => ({
          id: r.request_id,
          hospital_id: r.hospital_id,
          hospital_name: r.hospitals?.hospital_name ?? undefined,
          blood_type: r.blood_type,
          quantity: r.quantity ?? 0,
          status: r.status ?? 'Pending',
          created_at: r.created_at,
        }));

        debug.results.strategy1 = { count: list.length, hasData: list.length > 0 };
      } catch (e: any) {
        debug.results.strategy1 = { error: e.message };
      }

      // Strategy 2: If no results, try without JOIN
      if (list.length === 0) {
        try {
          debug.queries.push('Strategy 2: Simple query without JOIN');
          let query = supabase
            .from('blood_request')
            .select('request_id, hospital_id, blood_type, quantity, status, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

          // Only filter by hospital if user has hospital_id AND is hospital_staff
          if (userHospitalId && userRole === 'hospital_staff') {
            query = query.eq('hospital_id', userHospitalId);
          }

          const { data, error } = await query;
          if (error) throw error;

          list = (data || []).map((r: any) => ({
            id: r.request_id || r.id || String(Math.random()),
            hospital_id: r.hospital_id,
            hospital_name: undefined,
            blood_type: r.blood_type,
            quantity: r.quantity ?? r.units_requested ?? 0,
            status: r.status ?? r.request_status ?? 'pending',
            created_at: r.created_at ?? r.requested_at,
          }));

          debug.results.strategy2 = { count: list.length, hasData: list.length > 0 };
        } catch (e: any) {
          debug.results.strategy2 = { error: e.message };
        }
      }

      // Strategy 3: If still no results and user is admin, try to see all records
      if (list.length === 0 && (userRole === 'admin' || userRole === 'blood_bank_staff')) {
        try {
          debug.queries.push('Strategy 3: Admin/Blood Bank query (no hospital filter)');
          const { data, error } = await supabase
            .from('blood_request')
            .select('request_id, hospital_id, blood_type, quantity, status, created_at')
            .order('created_at', { ascending: false })
            .limit(500);

          if (error) throw error;

          list = (data || []).map((r: any) => ({
            id: r.request_id || r.id || String(Math.random()),
            hospital_id: r.hospital_id,
            hospital_name: undefined,
            blood_type: r.blood_type,
            quantity: r.quantity ?? r.units_requested ?? 0,
            status: r.status ?? r.request_status ?? 'pending',
            created_at: r.created_at ?? r.requested_at,
          }));

          debug.results.strategy3 = { count: list.length, hasData: list.length > 0 };
        } catch (e: any) {
          debug.results.strategy3 = { error: e.message };
        }
      }

      debug.finalResultCount = list.length;
      setDebugInfo(debug);
      setRequests(list || []);

    } catch (e: any) {
      setError(e?.message || 'Failed to fetch orders');
      console.error('OrderTracking fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    try {
      const ch1 = supabase
        .channel('blood_request-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_request' }, fetchOrders)
        .subscribe();
      
      return () => {
        supabase.removeChannel(ch1);
      };
    } catch {
      return;
    }
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return requests.filter((r) =>
      (r.id || '').toLowerCase().includes(term) ||
      (r.hospital_name || '').toLowerCase().includes(term) ||
      (r.blood_type || '').toLowerCase().includes(term) ||
      (r.status || '').toLowerCase().includes(term)
    );
  }, [requests, search]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Order Tracking</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
          />
          <button onClick={fetchOrders} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            Refresh
          </button>
          <button 
            onClick={() => setDebugMode(!debugMode)} 
            style={{ padding: '8px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            Debug
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>
          {error}
        </div>
      )}

      {debugMode && (
        <div style={{ marginBottom: 12, background: '#f3f4f6', border: '1px solid #d1d5db', padding: 10, borderRadius: 8 }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Debug Information</h3>
          <pre style={{ fontSize: 12, margin: 0, overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {loading ? (
        <div>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div>
          <p>No orders found.</p>
          {debugInfo.finalResultCount === 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: 10, borderRadius: 8, marginTop: 8 }}>
              <strong>Troubleshooting Tips:</strong>
              <ul style={{ margin: '8px 0' }}>
                <li>Check if you're assigned to a hospital in your profile</li>
                <li>Verify there are blood requests in the database</li>
                <li>Check if RLS policies are blocking access</li>
                <li>Click "Debug" button above to see detailed information</li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: 10 }}>ID</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Hospital</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Blood Type</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Quantity</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 10, fontFamily: 'monospace' }}>{r.id}</td>
                  <td style={{ padding: 10 }}>{r.hospital_name || r.hospital_id || '—'}</td>
                  <td style={{ padding: 10 }}>{r.blood_type}</td>
                  <td style={{ padding: 10 }}>{r.quantity}</td>
                  <td style={{ padding: 10 }}>{r.status}</td>
                  <td style={{ padding: 10 }}>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;