// src/pages/Hospitals.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from '../utils/supabaseClient';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';

interface HospitalRow {
  hospital_id: string;
  hospital_name: string;
}

const Hospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [editing, setEditing] = useState<HospitalRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<HospitalRow | null>(null);

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('hospital_id, hospital_name')
        .order('hospital_name', { ascending: true });
      if (error) throw error;
      setHospitals((data as HospitalRow[]) || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsAdmin((localStorage.getItem('user_role') || '') === 'admin');
    fetchHospitals();

    // Optional: Realtime updates
    let channel: any;
    try {
      channel = supabase
        .channel('hospitals-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, fetchHospitals)
        .subscribe();
    } catch {
      // ignore errors
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchHospitals]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return hospitals.filter((h) =>
      h.hospital_name.toLowerCase().includes(term) ||
      h.hospital_id.toLowerCase().includes(term)
    );
  }, [hospitals, search]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormOpen(true);
  };

  const openEdit = (row: HospitalRow) => {
    setEditing(row);
    setFormName(row.hospital_name || '');
    setFormOpen(true);
  };

  const saveHospital = async () => {
    const trimmed = formName.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      // Uniqueness check (case-insensitive)
      const { data: existing, error: existErr } = await supabase
        .from('hospitals')
        .select('hospital_id')
        .ilike('hospital_name', trimmed)
        .limit(1);
      if (existErr) throw existErr;
      if (existing && existing.length > 0 && (!editing || existing[0].hospital_id !== editing.hospital_id)) {
        throw new Error('A hospital with this name already exists.');
      }

      if (editing) {
        const { error } = await supabase
          .from('hospitals')
          .update({ hospital_name: trimmed })
          .eq('hospital_id', editing.hospital_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hospitals')
          .insert({ hospital_name: trimmed });
        if (error) throw error;
      }
      setFormOpen(false);
      setEditing(null);
      setFormName('');
      await fetchHospitals();
    } catch (e: any) {
      setError(e?.message || 'Failed to save hospital');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: HospitalRow) => setDeleteTarget(row);

  const doDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.hospital_id;
    setError(null);
    try {
      const { error } = await supabase
        .from('hospitals')
        .delete()
        .eq('hospital_id', id);
      if (error) throw error;
      setDeleteTarget(null);
      await fetchHospitals();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete hospital');
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <PageHeader
        title="Hospitals"
        description="Browse and manage registered hospitals"
        actions={(
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchHospitals}
              style={{ background: '#FF5252', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
            {isAdmin && (
              <button
                onClick={openCreate}
                style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}
              >
                ➕ Add Hospital
              </button>
            )}
          </div>
        )}
      />

      <Card>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <input
              type="text"
              placeholder="Search hospitals by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <button
              onClick={() => setSearch('')}
              style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
            >
              🗑️ Clear
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>Loading hospitals...</div>
          ) : error ? (
            <div style={{ color: '#c62828', background: '#ffebee', border: '1px solid #ffcdd2', padding: 12, borderRadius: 8 }}>
              {error}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {filtered.map((h) => (
                <div key={h.hospital_id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 14, background: '#fff' }}>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                    {h.hospital_name || 'Unnamed Hospital'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#777' }}>
                    ID: {h.hospital_id}
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => openEdit(h)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(h)}
                        style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filtered.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#777', padding: 20 }}>
                  No hospitals found
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit modal */}
      {formOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 420 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>{editing ? 'Edit Hospital' : 'Add Hospital'}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Hospital Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                placeholder="Enter hospital name"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setFormOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveHospital} disabled={saving || !formName.trim()} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Hospital"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.hospital_name}"?` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Hospitals;
