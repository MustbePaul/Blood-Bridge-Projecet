// Front-end forms and validators for Hospital, Blood Bank, and Donor flows.
// No external libs required; adjust or integrate with your framework's form layer.

export const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const;
export type BloodType = typeof BLOOD_TYPES[number];

// 1) Hospital: Blood Request Form
export type HospitalRequestForm = {
  blood_type: BloodType | '';
  quantity: number | '';
  needed_by: string; // ISO date (YYYY-MM-DD)
  notes?: string;
};

export function validateHospitalRequest(form: HospitalRequestForm) {
  const errors: Partial<Record<keyof HospitalRequestForm, string>> = {};
  if (!BLOOD_TYPES.includes(form.blood_type as BloodType)) {
    errors.blood_type = 'Select a valid blood type';
  }
  const qty = typeof form.quantity === 'string' ? parseInt(form.quantity, 10) : form.quantity;
  if (!qty || qty <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }
  if (!form.needed_by) {
    errors.needed_by = 'Required';
  } else {
    const today = new Date();
    const needed = new Date(form.needed_by);
    if (isNaN(needed.getTime())) {
      errors.needed_by = 'Invalid date';
    } else if (needed < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      errors.needed_by = 'Date must be today or later';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// 2) Inventory: Create/Update Unit
export type InventoryForm = {
  unit_code: string;
  blood_type: BloodType | '';
  status: 'available' | 'reserved' | 'expired' | '';
  expiry_date: string; // ISO date
};

export function validateInventory(form: InventoryForm) {
  const errors: Partial<Record<keyof InventoryForm, string>> = {};
  if (!form.unit_code || form.unit_code.trim().length < 3) {
    errors.unit_code = 'Unit code is required';
  }
  if (!BLOOD_TYPES.includes(form.blood_type as BloodType)) {
    errors.blood_type = 'Select a valid blood type';
  }
  if (!['available','reserved','expired'].includes(form.status)) {
    errors.status = 'Select a valid status';
  }
  if (!form.expiry_date) {
    errors.expiry_date = 'Required';
  } else {
    const d = new Date(form.expiry_date);
    if (isNaN(d.getTime())) {
      errors.expiry_date = 'Invalid date';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// 3) Donor: Profile Update (address, emergency, medical, consent)
export type DonorProfileForm = {
  name: string;
  phone: string;
  address?: string;
  dob?: string; // ISO date
  gender?: 'male' | 'female' | 'other' | '';
  emergency_contact?: string;
  emergency_phone?: string;
  medical_conditions?: string;
  medications?: string;
  consent_contact?: boolean; // ok to be contacted
};

export function validateDonorProfile(form: DonorProfileForm) {
  const errors: Partial<Record<keyof DonorProfileForm, string>> = {};
  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Name is required';
  }
  // basic phone sanity check; adjust for your locale
  if (!form.phone || !/^[0-9+()\-\s]{7,}$/.test(form.phone)) {
    errors.phone = 'Enter a valid phone number';
  }
  if (form.dob) {
    const d = new Date(form.dob);
    if (isNaN(d.getTime())) errors.dob = 'Invalid date';
  }
  if (form.emergency_phone && !/^[0-9+()\-\s]{7,}$/.test(form.emergency_phone)) {
    errors.emergency_phone = 'Enter a valid phone number';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

// 4) Tiny helpers to split forms and labels for better UX ("differentiate the form properly")
export const hospitalRequestFields = [
  { name: 'blood_type', label: 'Blood Type', type: 'select', options: BLOOD_TYPES },
  { name: 'quantity', label: 'Units Needed', type: 'number', min: 1 },
  { name: 'needed_by', label: 'Needed By', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea' }
] as const;

export const inventoryFields = [
  { name: 'unit_code', label: 'Unit Code', type: 'text' },
  { name: 'blood_type', label: 'Blood Type', type: 'select', options: BLOOD_TYPES },
  { name: 'status', label: 'Status', type: 'select', options: ['available','reserved','expired'] },
  { name: 'expiry_date', label: 'Expiry Date', type: 'date' }
] as const;

export const donorProfileFields = [
  { name: 'name', label: 'Full Name', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'tel' },
  { name: 'address', label: 'Address', type: 'text' },
  { name: 'dob', label: 'Date of Birth', type: 'date' },
  { name: 'gender', label: 'Gender', type: 'select', options: ['male','female','other'] },
  { name: 'emergency_contact', label: 'Emergency Contact', type: 'text' },
  { name: 'emergency_phone', label: 'Emergency Phone', type: 'tel' },
  { name: 'medical_conditions', label: 'Medical Conditions', type: 'textarea' },
  { name: 'medications', label: 'Medications', type: 'textarea' },
  { name: 'consent_contact', label: 'Consent to be Contacted', type: 'checkbox' }
] as const;

// 5) Thin query helpers (client-side). Ensure you pass the user's JWT to Supabase client.
export type Filters = Record<string, unknown>;

export function hospitalRequestsFilter(orgId: string) {
  // Use with Supabase: .eq('hospital_id', orgId)
  return { hospital_id: orgId } satisfies Filters;
}

export function bankRequestsFilter(bankId: string) {
  // Use with Supabase: .eq('assigned_blood_bank_id', bankId)
  return { assigned_blood_bank_id: bankId } satisfies Filters;
}

export function inventoryByFacilityFilter(facilityId: string) {
  // Use with Supabase: .eq('facility_id', facilityId)
  return { facility_id: facilityId } satisfies Filters;
}

// NOTE: UI gating (TS) must be paired with server-side RLS. Do not rely on CSS-only hiding.
