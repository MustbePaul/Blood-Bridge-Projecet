// src/pages/DonorList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import { ROUTES } from '../components/routes';

interface Donor {
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

const PAGE_SIZE = 10;

const DonorList: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();

  const fetchDonors = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('donors')
        .select('*', { count: 'exact' })
        .order('last_donation_date', { ascending: false, nullsFirst: true })
        .range((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE - 1);

      if (error) {
        console.error('Error fetching donors:', error);
        setError('Failed to fetch donors. Please try again.');
      } else if (data) {
        // Prevent duplicates when paginating
        setDonors(prev => {
          const ids = new Set(prev.map(d => d.donor_id));
          const newDonors = data.filter(d => !ids.has(d.donor_id));
          return [...prev, ...newDonors];
        });
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonors(page);
  }, [fetchDonors, page]);

  // Initialize filteredDonors on load
  useEffect(() => {
    setFilteredDonors(donors);
  }, [donors]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      const filtered = donors.filter(
        d =>
          d.name?.toLowerCase().includes(search.toLowerCase()) ||
          d.blood_type?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredDonors(filtered);
      setPage(1); // Reset pagination
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, donors]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  return (
    <div style={{ padding: '2rem', background: '#fff5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#b71c1c' }}>Donor List</h1>

        <button
          onClick={() => navigate(ROUTES.donorRegistration)}
          aria-label="Register New Donor"
          style={{
            background: '#b71c1c',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            border: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          + Register New Donor
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or blood type..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoComplete="off"
        aria-label="Search donors by name or blood type"
        style={{
          padding: '0.75rem 1rem',
          width: '100%',
          maxWidth: 400,
          borderRadius: 8,
          border: '1px solid #f28b82',
          marginBottom: '2rem',
          outline: 'none',
          fontSize: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      />

      {/* Error */}
      {error && (
        <p style={{ color: 'red', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>
      )}

      {/* Donor Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}
        role="list"
      >
        {loading && donors.length === 0
          ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffecec',
                  height: 250,
                  borderRadius: 20,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))
          : filteredDonors.map(donor => (
              <div
                key={donor.donor_id}
                role="listitem"
                style={{
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  padding: '1.5rem',
                  borderRadius: 20,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b71c1c' }}>
                  {donor.name || 'Donor'}
                </h3>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#d32f2f',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 20,
                    marginTop: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  🩸 {donor.blood_type || 'N/A'}
                </span>
                <p style={{ marginTop: '0.5rem', color: '#555' }}>
                  <strong>Email:</strong> {donor.email || 'N/A'}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Phone:</strong> {donor.phone || 'N/A'}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>DOB:</strong> {formatDate(donor.date_of_birth)}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Gender:</strong> {donor.gender || 'N/A'}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Address:</strong> {donor.address || 'N/A'}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Emergency Contact:</strong> {donor.emergency_contact || 'N/A'} ({donor.emergency_phone || 'N/A'})
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Last Donation:</strong> {formatDate(donor.last_donation_date)}
                </p>
                <p style={{ color: '#555' }}>
                  <strong>Eligible:</strong> {donor.is_eligible ? 'Yes' : 'No'}
                </p>
                {donor.medical_conditions && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 10,
                      fontSize: '0.85rem',
                      color: '#555',
                    }}
                  >
                    <strong>Medical Conditions:</strong> {donor.medical_conditions}
                  </div>
                )}
                {donor.medications && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.7)',
                      borderRadius: 10,
                      fontSize: '0.85rem',
                      color: '#555',
                    }}
                  >
                    <strong>Medications:</strong> {donor.medications}
                  </div>
                )}
                <button
                  onClick={() => navigate(ROUTES.DonorDetails.replace(':id', donor.donor_id))}
                  aria-label={`View details of ${donor.name}`}
                  style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    background: '#b71c1c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  View Details
                </button>
              </div>
            ))}
      </div>

      {/* Load More */}
      {!loading && hasMore && donors.length > 0 && (
        <button
          onClick={() => setPage(prev => prev + 1)}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: '#b71c1c',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontWeight: 600,
            display: 'block',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Load More
        </button>
      )}

      {/* Empty State */}
      {!loading && filteredDonors.length === 0 && (
        <p style={{ color: '#b71c1c', fontStyle: 'italic', marginTop: '2rem' }}>
          No donors found. Try adjusting your search or registering a new donor.
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default DonorList;
