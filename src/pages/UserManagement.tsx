import React, { useEffect, useState, useMemo } from 'react';
import supabase from '../utils/supabaseClient';
import ProtectedLayout from '../components/ProtectedLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

type Role = 'admin' | 'hospital_staff' | 'blood_bank_staff';

interface ProfileRow {
  user_id: string;
  name: string | null;
  role: Role | string;
  phone_number: string | null;
  hospital_id?: string | null;
  blood_bank_id?: string | null;
  created_at?: string | null;
}

interface Hospital {
  id: string;
  name: string;
}

interface BloodBank {
  id: string;
  name: string;
}

const roles: Role[] = ['admin', 'hospital_staff', 'blood_bank_staff'];

const UserManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const { data: hospitalData } = await supabase.from('hospitals').select('*');
        const { data: bloodBankData } = await supabase.from('blood_banks').select('*');
        setHospitals(hospitalData || []);
        setBloodBanks(bloodBankData || []);
      } catch (e) {
        console.error('Failed to fetch facilities', e);
      }
    };
    fetchFacilities();
  }, []);

  // Fetch profiles
  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,name,role,phone_number,hospital_id,blood_bank_id,created_at');
      if (error) throw error;
      setProfiles(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Map assigned facility name
  const profilesWithFacility = useMemo(() => {
    return profiles.map(p => {
      let assignedFacilityName = '—';
      if (p.role === 'hospital_staff' && p.hospital_id) {
        assignedFacilityName = hospitals.find(h => h.id === p.hospital_id)?.name || '—';
      } else if (p.role === 'blood_bank_staff' && p.blood_bank_id) {
        assignedFacilityName = bloodBanks.find(b => b.id === p.blood_bank_id)?.name || '—';
      }
      return { ...p, assignedFacilityName };
    });
  }, [profiles, hospitals, bloodBanks]);

  // Filtered users
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return profilesWithFacility.filter(p =>
      (p.name || '').toLowerCase().includes(term) ||
      (p.role || '').toLowerCase().includes(term) ||
      (p.phone_number || '').toLowerCase().includes(term) ||
      (p.user_id || '').toLowerCase().includes(term) ||
      (p.assignedFacilityName || '').toLowerCase().includes(term)
    );
  }, [profilesWithFacility, search]);

  // Edit handlers
  const openEdit = (row: ProfileRow) => setEditing({ ...row });
  const closeEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updateData: Partial<ProfileRow> = {
        name: editing.name,
        role: editing.role,
        phone_number: editing.phone_number,
        hospital_id: editing.role === 'hospital_staff' ? editing.hospital_id || null : null,
        blood_bank_id: editing.role === 'blood_bank_staff' ? editing.blood_bank_id || null : null,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', editing.user_id);
      if (error) throw error;

      fetchProfiles();
      closeEdit();
    } catch (e: any) {
      alert(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user_id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('user_id', user_id);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.user_id !== user_id));
    } catch (e: any) {
      alert(e.message || 'Failed to delete user');
    }
  };

  return (
    <ProtectedLayout>
      <PageHeader
        title="User Management"
        description="Manage system users (roles, hospital or blood bank assignment)"
        actions={<Button variant="primary" onClick={fetchProfiles}>🔄 Refresh</Button>}
      />

      <Card>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <input
              type="text"
              placeholder="Search by name, role, phone, ID, or facility..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
            />
            <Button variant="secondary" onClick={() => setSearch('')}>🗑️ Clear</Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>Loading users...</div>
          ) : error ? (
            <div style={{ color: 'var(--color-danger)' }}>{error}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    <th style={{ padding: 12, textAlign: 'left' }}>User ID</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Role</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Facility</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Created At</th>
                    <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.user_id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{p.user_id}</td>
                      <td style={{ padding: 12 }}>{p.name || '—'}</td>
                      <td style={{ padding: 12 }}>{p.role}</td>
                      <td style={{ padding: 12 }}>{p.phone_number || '—'}</td>
                      <td style={{ padding: 12 }}>{p.assignedFacilityName || '—'}</td>
                      <td style={{ padding: 12 }}>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                      <td style={{ padding: 12 }}>
                        <Button variant="success" style={{ marginRight: 8 }} onClick={() => openEdit(p)}>✏️ Edit</Button>
                        <Button variant="danger" onClick={() => deleteUser(p.user_id)}>🗑️ Delete</Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)' }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 360, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #eee', fontWeight: 600 }}>Edit User</div>
            <div style={{ padding: 16, display: 'grid', gap: 12 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span>Name</span>
                <input
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Role</span>
                <select
                  value={editing.role}
                  onChange={e => setEditing({ ...editing, role: e.target.value })}
                  style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span>Phone</span>
                <input
                  value={editing.phone_number || ''}
                  onChange={e => setEditing({ ...editing, phone_number: e.target.value })}
                  style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                />
              </label>

              {(editing.role === 'hospital_staff' || editing.role === 'blood_bank_staff') && (
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{editing.role === 'hospital_staff' ? 'Hospital' : 'Blood Bank'}</span>
                  <select
                    value={editing.role === 'hospital_staff' ? editing.hospital_id ?? '' : editing.blood_bank_id ?? ''}
                    onChange={e => editing.role === 'hospital_staff'
                      ? setEditing({ ...editing, hospital_id: e.target.value })
                      : setEditing({ ...editing, blood_bank_id: e.target.value })}
                    style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                  >
                    <option value="">— Select —</option>
                    {editing.role === 'hospital_staff'
                      ? hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)
                      : bloodBanks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
              )}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={closeEdit} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
};

export default UserManagement;
