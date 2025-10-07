import { useState, useEffect } from 'react';
import supabase from '../utils/supabaseClient';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import { cacheFacilities, getCachedFacilities, getCachedData, CACHE_KEYS } from '../utils/offlineCache';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const TransferRequest: React.FC = () => {
  const [bloodType, setBloodType] = useState('O+');
  const [units, setUnits] = useState('');
  const [reason, setReason] = useState('');
  const [fromFacility, setFromFacility] = useState('');
  const [toFacility, setToFacility] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await getCachedData(
          CACHE_KEYS.FACILITIES,
          async () => {
            const { data, error } = await supabase
              .from('facilities')
              .select('id, name, type')
              .order('name');

            if (error) throw error;
            return data || [];
          }
        );

        setFacilities(data);
        cacheFacilities(data);
      } catch (e: any) {
        console.error('Failed to fetch facilities:', e.message);
        const cachedData = getCachedFacilities();
        if (cachedData) setFacilities(cachedData);
      }
    };

    fetchFacilities();
  }, []);

  const resetForm = () => {
    setBloodType('O+');
    setUnits('');
    setReason('');
    setFromFacility('');
    setToFacility('');
    setUrgency('normal');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!bloodType || !units || !reason || !fromFacility || !toFacility) {
      setError('Please fill in all required fields');
      return;
    }

    if (isNaN(Number(units)) || Number(units) < 1) {
      setError('Please enter a valid number of units');
      return;
    }

    if (fromFacility === toFacility) {
      setError('From and To facilities must be different');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user ID
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;

      if (!userId) throw new Error('User not authenticated');

      const payload = {
        blood_type: bloodType,
        units: Number(units),
        reason: reason.trim(), // ✅ Trim whitespace/newlines
        from_facility_id: fromFacility,
        to_facility_id: toFacility,
        urgency,
        status: 'pending', // ✅ Must match DB check constraint
        request_date: new Date().toISOString(),
        requested_by: userId
      };

      console.log('Insert payload:', payload);

      const { data, error } = await supabase
        .from('blood_transfers')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      setSuccess('Transfer request submitted successfully');
      resetForm();
      console.log('Inserted transfer:', data);

    } catch (e: any) {
      setError(e.message || 'Failed to submit transfer request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <PageHeader title="Blood Transfer Request" subtitle="Request inter-facility transfer of blood units" />

        <Card>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: 12,
                borderRadius: 4,
                marginBottom: 20,
                border: '1px solid #ffcdd2'
              }}>{error}</div>
            )}

            {success && (
              <div style={{
                background: '#e8f5e8',
                color: '#2e7d32',
                padding: 12,
                borderRadius: 4,
                marginBottom: 20,
                border: '1px solid #c8e6c9'
              }}>{success}</div>
            )}

            <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 20,
    marginBottom: 20
  }}
>
  {/* Blood Type */}
  <div>
    <label>Blood Type *</label>
    <select
      value={bloodType}
      onChange={e => setBloodType(e.target.value)}
      disabled={isSubmitting}
      required
      style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }}
    >
      {bloodTypes.map(type => <option key={type} value={type}>{type}</option>)}
    </select>
  </div>

  {/* Units */}
  <div>
    <label>Number of Units *</label>
    <input
      type="number"
      value={units}
      onChange={e => setUnits(e.target.value)}
      disabled={isSubmitting}
      min="1"
      required
      placeholder="Enter number of units"
      style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }}
    />
  </div>

  {/* Urgency */}
  <div>
    <label>Urgency Level</label>
    <select
      value={urgency}
      onChange={e => setUrgency(e.target.value)}
      disabled={isSubmitting}
      style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4, boxSizing: 'border-box' }}
    >
      <option value="low">Low - Routine</option>
      <option value="normal">Normal - Standard</option>
      <option value="high">High - Urgent</option>
      <option value="critical">Critical - Emergency</option>
    </select>
  </div>
</div>


            {/* From Facility */}
            <div style={{ marginBottom: 20 }}>
              <label>From Facility *</label>
              <select value={fromFacility} onChange={e => setFromFacility(e.target.value)} disabled={isSubmitting} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                <option value="">Select source facility</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
              </select>
            </div>

            {/* To Facility */}
            <div style={{ marginBottom: 20 }}>
              <label>To Facility *</label>
              <select value={toFacility} onChange={e => setToFacility(e.target.value)} disabled={isSubmitting} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
                <option value="">Select destination facility</option>
                {facilities.filter(f => f.id !== fromFacility).map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
              </select>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 30 }}>
              <label>Reason for Transfer *</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} disabled={isSubmitting} required placeholder="Provide reason..." style={{ width: '90%', padding: 12, border: '1px solid #ddd', borderRadius: 4, minHeight: 100, resize: 'vertical' }} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button type="submit" disabled={isSubmitting}> {isSubmitting ? 'Submitting...' : 'Submit Transfer Request'} </Button>
              <Button type="button" variant="ghost" onClick={resetForm} disabled={isSubmitting}>Clear</Button>
            </div>
          </form>
        </Card>

        <Card header={<strong style={{ color: '#1976d2' }}>ℹ️ Important Information</strong>}>
          <ul style={{ paddingLeft: 20 }}>
            <li>Transfer requests will be reviewed by the destination facility</li>
            <li>You will receive notifications about the request status</li>
            <li>Critical requests will be prioritized for faster processing</li>
            <li>Ensure blood type compatibility before submitting</li>
          </ul>
        </Card>
      </div>
    </ProtectedLayout>
  );
};

export default TransferRequest;
