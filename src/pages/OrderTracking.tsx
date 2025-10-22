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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get user's assigned hospital for filtering
      const userId = getCurrentUserId();
      let userHospitalId: string | null = null;
      if (userId) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('hospital_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (!profErr && prof) userHospitalId = (prof as any).hospital_id ?? null;
      }

      // Primary schema: blood_request
      let list: RequestRow[] | null = null;
      let primaryError: any = null;
      try {
        let query = supabase
          .from('blood_request')
          .select(`request_id, hospital_id, blood_type, quantity, status, created_at, hospitals ( hospital_name )`)
          .order('created_at', { ascending: false })
          .limit(500);

        // Apply hospital filtering only if user's hospital has requests
        if (userHospitalId) {
          // First check if this hospital has any requests
          const { data: hospitalRequests, error: checkError } = await supabase
            .from('blood_request')
            .select('request_id')
            .eq('hospital_id', userHospitalId)
            .limit(1);
          
          // Only filter by hospital if there are requests for this hospital
          if (!checkError && hospitalRequests && hospitalRequests.length > 0) {
            query = query.eq('hospital_id', userHospitalId);
          } else {
            console.log('No requests found for user hospital, showing all requests');
          }
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
      } catch (e) {
        primaryError = e;
      }

      // Fallback schema: blood_requests
      if (!list || list.length === 0) {
        const { data, error } = await supabase
          .from('blood_request')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        list = (data || []).map((r: any) => ({
          id: r.id ?? r.request_id ?? String(Math.random()),
          hospital_id: (r as any).hospital_id ?? null,
          hospital_name: (r as any).hospital_name ?? undefined,
          blood_type: r.blood_type,
          quantity: r.units_requested ?? r.quantity ?? 0,
          status: r.request_status ?? r.status ?? 'pending',
          created_at: r.requested_at ?? r.created_at ?? null,
        }));
        // Apply hospital filtering only if user's hospital has requests in the dataset
        if (userHospitalId) {
          const hospitalRequests = list.filter((r) => r.hospital_id === userHospitalId);
          if (hospitalRequests.length > 0) {
            list = hospitalRequests;
          }
          // If no requests for user's hospital, show all (don't filter)
        }
        if ((!list || list.length === 0) && primaryError) throw primaryError;
      }

      setRequests(list || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch orders');
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
      const ch2 = supabase
        .channel('blood_request-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_request' }, fetchOrders)
        .subscribe();
      return () => {
        supabase.removeChannel(ch1);
        supabase.removeChannel(ch2);
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
          <button onClick={fetchOrders} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>Refresh</button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>{error}</div>
      )}

      {loading ? (
        <div>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div>No orders found.</div>
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
