import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from '../utils/supabaseClient';

// Unified request row with metadata for updates
interface RequestRow {
  id: string;
  blood_type: string;
  quantity: number;
  status: string;
  hospital_id?: string | null;
  hospital_name?: string | null;
  created_at?: string | null;
  // metadata for update
  _source: 'blood_request' | 'blood_requests';
  _keyColumn: 'request_id' | 'id';
}

const ApproveRequests: React.FC = () => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try primary schema first: blood_request
      let list: RequestRow[] | null = null;
      let primaryError: any = null;
      try {
        const { data, error } = await supabase
          .from('blood_request')
          .select(`request_id, hospital_id, blood_type, quantity, status, created_at, hospitals ( hospital_name )`)
          .in('status', ['Pending', 'Approved']) // include pending/approved for context
          .order('created_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        list = (data || []).map((r: any) => ({
          id: r.request_id,
          blood_type: r.blood_type,
          quantity: r.quantity ?? 0,
          status: r.status ?? 'Pending',
          hospital_id: r.hospital_id,
          hospital_name: r.hospitals?.hospital_name ?? undefined,
          created_at: r.created_at,
          _source: 'blood_request',
          _keyColumn: 'request_id',
        }));
      } catch (e) {
        primaryError = e;
      }

      // Fallback schema: blood_requests
      if (!list || list.length === 0) {
        const { data, error } = await supabase
          .from('blood_requests')
          .select('*')
          .in('request_status', ['pending', 'approved'])
          .order('requested_at', { ascending: false })
          .limit(500);
        if (error) throw error;
        list = (data || []).map((r: any) => ({
          id: r.id ?? r.request_id ?? String(Math.random()),
          blood_type: r.blood_type,
          quantity: r.units_requested ?? r.quantity ?? 0,
          status: (r.request_status ?? r.status ?? 'pending'),
          hospital_id: (r as any).hospital_id ?? null,
          hospital_name: (r as any).hospital_name ?? undefined,
          created_at: r.requested_at ?? r.created_at ?? null,
          _source: 'blood_requests',
          _keyColumn: 'id',
        }));
        if ((!list || list.length === 0) && primaryError) throw primaryError;
      }

      setRequests(list || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    try {
      const ch1 = supabase
        .channel('blood_request-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_request' }, fetchRequests)
        .subscribe();
      const ch2 = supabase
        .channel('blood_requests-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests' }, fetchRequests)
        .subscribe();
      return () => {
        supabase.removeChannel(ch1);
        supabase.removeChannel(ch2);
      };
    } catch {
      return;
    }
  }, [fetchRequests]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return requests.filter((r) =>
      (r.id || '').toLowerCase().includes(term) ||
      (r.hospital_name || '').toLowerCase().includes(term) ||
      (r.blood_type || '').toLowerCase().includes(term) ||
      (r.status || '').toLowerCase().includes(term)
    );
  }, [requests, search]);

  const updateStatus = async (row: RequestRow, newStatus: 'Approved' | 'Rejected') => {
    setProcessingId(row.id);
    try {
      if (row._source === 'blood_request') {
        const { error } = await supabase
          .from('blood_request')
          .update({ status: newStatus })
          .eq(row._keyColumn, row.id);
        if (error) throw error;
      } else {
        // blood_requests fallback
        const mapped = newStatus.toLowerCase(); // 'approved' | 'rejected'
        const { error } = await supabase
          .from('blood_requests')
          .update({ request_status: mapped })
          .eq(row._keyColumn, row.id);
        if (error) throw error;
      }
      await fetchRequests();
    } catch (e: any) {
      alert(e?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Approve Requests</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
          />
          <button onClick={fetchRequests} disabled={loading} style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 10, borderRadius: 8 }}>{error}</div>
      )}

      {loading ? (
        <div>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div>No requests found.</div>
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
                <th style={{ textAlign: 'left', padding: 10 }}>Requested</th>
                <th style={{ textAlign: 'left', padding: 10 }}>Actions</th>
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
                  <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => updateStatus(r, 'Approved')}
                      disabled={processingId === r.id || r.status.toLowerCase() === 'approved'}
                      style={{ padding: '6px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: processingId === r.id ? 'not-allowed' : 'pointer' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(r, 'Rejected')}
                      disabled={processingId === r.id}
                      style={{ padding: '6px 10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: processingId === r.id ? 'not-allowed' : 'pointer' }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApproveRequests;
