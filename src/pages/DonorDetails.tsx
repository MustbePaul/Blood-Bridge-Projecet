import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

interface DonorDetail {
  donor_id: string;
  name: string;
  email: string;
  phone: string;
  blood_type: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_conditions?: string;
  medications?: string;
  is_eligible?: boolean;
  last_donation_date?: string | null;
}

const theme = {
  primary: '#b71c1c',
  secondary: '#d32f2f',
  white: '#ffffff',
  textSecondary: '#555',
  border: '#f28b82'
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: `2px solid ${theme.border}`,
  fontSize: 16,
};

const DonorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [form, setForm] = useState<Partial<DonorDetail>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = (localStorage.getItem('user_role') || '') === 'admin';

  useEffect(() => {
    const fetchDonor = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('donors')
          .select('*')
          .eq('donor_id', id)
          .single();
        if (error) throw error;
        setDonor(data as DonorDetail);
        setForm(data as DonorDetail);
      } catch (e: any) {
        setError(e.message || 'Failed to load donor');
      } finally {
        setLoading(false);
      }
    };
    fetchDonor();
  }, [id]);

  const updateField = (k: keyof DonorDetail, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!donor) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        name: form.name ?? '',
        email: form.email ?? '',
        phone: form.phone ?? '',
        blood_type: form.blood_type ?? '',
        address: form.address ?? null,
        date_of_birth: form.date_of_birth ?? null,
        gender: form.gender ?? null,
        emergency_contact: form.emergency_contact ?? null,
        emergency_phone: form.emergency_phone ?? null,
        medical_conditions: form.medical_conditions ?? null,
        medications: form.medications ?? null,
        is_eligible: form.is_eligible ?? true,
      };
      const { error } = await supabase
        .from('donors')
        .update(payload)
        .eq('donor_id', donor.donor_id);
      if (error) throw error;
      setDonor({ ...(donor as DonorDetail), ...(payload as DonorDetail) });
    } catch (e: any) {
      setError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!donor) return <div style={{ padding: 24 }}>Donor not found</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16, border: '1px solid #ddd', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>← Back</button>
      <h1 style={{ color: theme.primary, marginBottom: 16 }}>Donor Details</h1>
      <div style={{ background: theme.white, padding: 20, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Full Name</label>
            <input style={fieldStyle} value={form.name || ''} onChange={(e) => updateField('name', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Email</label>
            <input style={fieldStyle} type="email" value={form.email || ''} onChange={(e) => updateField('email', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Phone</label>
            <input style={fieldStyle} value={form.phone || ''} onChange={(e) => updateField('phone', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Blood Type</label>
            <select style={fieldStyle} value={form.blood_type || ''} onChange={(e) => updateField('blood_type', e.target.value)} disabled={!isAdmin}>
              <option value="">Select Blood Type</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Date of Birth</label>
            <input style={fieldStyle} type="date" value={(form.date_of_birth || '').toString()} onChange={(e) => updateField('date_of_birth', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Gender</label>
            <select style={fieldStyle} value={form.gender || ''} onChange={(e) => updateField('gender', e.target.value)} disabled={!isAdmin}>
              <option value="">Select Gender</option>
              {['Male','Female','Other'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Address</label>
            <input style={fieldStyle} value={form.address || ''} onChange={(e) => updateField('address', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Emergency Contact</label>
            <input style={fieldStyle} value={form.emergency_contact || ''} onChange={(e) => updateField('emergency_contact', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Emergency Phone</label>
            <input style={fieldStyle} value={form.emergency_phone || ''} onChange={(e) => updateField('emergency_phone', e.target.value)} disabled={!isAdmin} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Medical Conditions</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.medical_conditions || ''} onChange={(e) => updateField('medical_conditions', e.target.value)} disabled={!isAdmin} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontWeight: 600, color: theme.textSecondary, display: 'block', marginBottom: 6 }}>Medications</label>
            <textarea style={{ ...fieldStyle, minHeight: 80 }} value={form.medications || ''} onChange={(e) => updateField('medications', e.target.value)} disabled={!isAdmin} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textSecondary }}>
              <input type="checkbox" checked={!!form.is_eligible} onChange={(e) => updateField('is_eligible', e.target.checked)} disabled={!isAdmin} />
              Eligible to Donate
            </label>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <button onClick={() => navigate(-1)} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: theme.primary, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDetails;
