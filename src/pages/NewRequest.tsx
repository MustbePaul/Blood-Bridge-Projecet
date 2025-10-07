import React, { useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import supabase from '../utils/supabaseClient';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const NewRequest: React.FC = () => {
  const [bloodType, setBloodType] = useState('O+');
  const [units, setUnits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!units || isNaN(Number(units)) || Number(units) < 1) {
      setError('Enter a valid number of units');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('blood_requests').insert({
        blood_type: bloodType,
        units_requested: Number(units),
        request_status: 'pending',
        // requested_at can be defaulted by DB; include if you want explicit timestamp
        requested_at: new Date().toISOString()
      });
      if (error) throw new Error(error.message);
      setSuccess(`Request for ${bloodType} blood (${units} units) submitted`);
      setUnits('');
      setBloodType('O+');
    } catch (e: any) {
      setError(e.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <PageHeader
          title="New Blood Request"
          subtitle="Submit a request for blood units for your facility"
        />
        <Card>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ 
                background: '#ffebee', color: '#c62828', padding: 12, borderRadius: 4, marginBottom: 16, border: '1px solid #ffcdd2' 
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ 
                background: '#e8f5e8', color: '#2e7d32', padding: 12, borderRadius: 4, marginBottom: 16, border: '1px solid #c8e6c9' 
              }}>
                {success}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Blood Type Needed</label>
                <select
                  value={bloodType}
                  onChange={e => setBloodType(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6 }}
                  disabled={isSubmitting}
                >
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Units Required</label>
                <input
                  type="number"
                  value={units}
                  onChange={e => setUnits(e.target.value)}
                  style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 6 }}
                  disabled={isSubmitting}
                  min={1}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Button type="submit" disabled={isSubmitting} iconLeft={<span>📤</span>}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setUnits(''); setBloodType('O+'); }} iconLeft={<span>🧹</span>}>
                Clear
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </ProtectedLayout>
  );
};

export default NewRequest; 