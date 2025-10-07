import supabase from './supabaseClient';

export async function seedDemoData(): Promise<{ inserted: number; errors: string[] }>{
  const errors: string[] = [];
  let inserted = 0;

  try {
    // NOTE: Skipping client-side seeding for profiles due to RLS on most setups
    errors.push('profiles not seeded (RLS) – run SQL seed or relax policy for demo');

    // Donors
    const { error: dErr } = await supabase.from('donors').insert([
      { name: 'John Banda', email: 'john@example.com', phone: '0991 111 111', blood_type: 'O-', is_eligible: true },
      { name: 'Mary Phiri', email: 'mary@example.com', phone: '0992 222 222', blood_type: 'A+', is_eligible: true },
      { name: 'Peter Jere', email: 'peter@example.com', phone: '0993 333 333', blood_type: 'B-', is_eligible: false },
    ]);
    if (dErr) errors.push(dErr.message); else inserted += 3;

    // Inventory
    const { error: iErr } = await supabase.from('blood_inventory').insert([
      { blood_type: 'O-', quantity_units: 6, status: 'available', expiry_date: isoDaysFromNow(20) },
      { blood_type: 'A+', quantity_units: 14, status: 'available', expiry_date: isoDaysFromNow(35) },
      { blood_type: 'B-', quantity_units: 4, status: 'reserved', expiry_date: isoDaysFromNow(8) },
      { blood_type: 'AB+', quantity_units: 2, status: 'expired', expiry_date: isoDaysFromNow(-2) },
    ]);
    if (iErr) errors.push(iErr.message); else inserted += 4;

    // Requests
    const { error: rErr } = await supabase.from('blood_requests').insert([
      { blood_type: 'O-', quantity: 5, status: 'pending' },
      { blood_type: 'A+', quantity: 3, status: 'approved' },
    ]);
    if (rErr) errors.push(rErr.message); else inserted += 2;

    // Donations
    const { error: drErr } = await supabase.from('donation_records').insert([
      { donor_name: 'John Banda', donation_date: isoDaysFromNow(-10), units: 1 },
      { donor_name: 'Mary Phiri', donation_date: isoDaysFromNow(-3), units: 1 },
    ]);
    if (drErr) errors.push(drErr.message); else inserted += 2;
  } catch (e: any) {
    errors.push(e.message || 'Unknown error');
  }

  return { inserted, errors };
}

export function setDemoMode(enabled: boolean) {
  localStorage.setItem('demo_mode', enabled ? 'true' : 'false');
}

export function isDemoMode(): boolean {
  return localStorage.getItem('demo_mode') === 'true';
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function cryptoRandomId(): string {
  try {
    // Browser crypto if available
    const arr = new Uint8Array(16);
    (window.crypto || (window as any).msCrypto).getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}


