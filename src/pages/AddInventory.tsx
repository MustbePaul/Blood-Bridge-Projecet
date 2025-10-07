import React, { useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import supabase from '../utils/supabaseClient';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

interface AddInventoryProps {
  onInventoryAdded?: () => void; // optional callback to refresh inventory
}

const AddInventory: React.FC<AddInventoryProps> = ({ onInventoryAdded }) => {
  const [bloodType, setBloodType] = useState('A+');
  const [units, setUnits] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!units.trim() || isNaN(Number(units)) || Number(units) < 1) {
      setError('Enter a valid number of units');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('blood_inventory').insert({
        blood_type: bloodType,
        quantity_units: Number(units),
        expiry_date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 42 days from now
        status: 'available',
      });

      if (error) throw new Error(error.message);

      setSuccess(`Added ${bloodType} blood with ${units} units to inventory`);
      setUnits('');

      // Trigger refresh in InventoryList if callback provided
      if (onInventoryAdded) onInventoryAdded();
    } catch (e: any) {
      setError(e.message || 'Failed to add inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
      <h2>Add Blood to Inventory</h2>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red', marginBottom: 10 }}>{error}</p>}
        {success && <p style={{ color: 'green', marginBottom: 10 }}>{success}</p>}

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="bloodType">Blood Type</label>
          <select
            id="bloodType"
            value={bloodType}
            onChange={e => setBloodType(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            disabled={isSubmitting}
          >
            {bloodTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 30 }}>
          <label htmlFor="units">Number of Units</label>
          <input
            id="units"
            type="number"
            value={units}
            onChange={e => setUnits(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
            disabled={isSubmitting}
            min={1}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: 12,
            background: '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </ProtectedLayout>
  );
};

export default AddInventory;
