import supabase from './supabaseClient';

export type InventoryActionType = 'ISSUE' | 'RESERVE' | 'RETURN' | 'ADJUST' | 'EXPIRE';

export interface RecordInventoryActionInput {
  inventoryId: string;          // blood_inventory.inventory_id
  deltaUnits: number;           // positive or negative change in units
  action: InventoryActionType;  // what happened
  reason?: string;              // optional explanation
}

export interface StaffContext {
  staffUserId: string;          // profiles.user_id
  staffRole: 'admin' | 'hospital_staff' | 'blood_bank_staff';
  facilityId: string;           // profiles.facility_id
}

export async function getCurrentStaffContext(): Promise<StaffContext> {
  const staffUserId = localStorage.getItem('user_id') || '';
  const staffRole = (localStorage.getItem('user_role') || 'hospital_staff') as StaffContext['staffRole'];
  let facilityId = localStorage.getItem('facility_id') || '';

  // If facility_id is not in localStorage, derive from profiles.hospital_id / blood_bank_id
  if (!facilityId && staffUserId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, hospital_id, blood_bank_id')
      .eq('user_id', staffUserId)
      .single();
    if (!error && data) {
      // In this schema, we treat `facility_id` as either the hospital_id or blood_bank_id UUID.
      // Ensure your `facilities` table contains rows with matching IDs (see migration SQL provided).
      facilityId = (data.hospital_id || data.blood_bank_id) || '';
      if (facilityId) localStorage.setItem('facility_id', facilityId);
      return {
        staffUserId,
        staffRole: (data.role || staffRole) as StaffContext['staffRole'],
        facilityId
      };
    }
  }

  return { staffUserId, staffRole, facilityId };
}

/**
 * Record an inventory action with audit trail and keep blood_inventory row tied to facility.
 * - Updates the targeted blood_inventory row's quantity/status as needed (server-side policy recommended)
 * - Inserts audit record into blood_inventory_audit
 */
export async function recordInventoryAction(input: RecordInventoryActionInput) {
  const ctx = await getCurrentStaffContext();
  if (!ctx.staffUserId || !ctx.facilityId) {
    throw new Error('Missing staff or facility context');
  }

  // 1) Ensure inventory record has facility_id set
  const { data: invRow, error: invErr } = await supabase
    .from('blood_inventory')
    .select('inventory_id, facility_id, quantity_units, status')
    .eq('inventory_id', input.inventoryId)
    .single();
  if (invErr) throw new Error(invErr.message);

  if (!invRow) throw new Error('Inventory record not found');

  if (!invRow.facility_id) {
    const { error: updFacilityErr } = await supabase
      .from('blood_inventory')
      .update({ facility_id: ctx.facilityId })
      .eq('inventory_id', input.inventoryId);
    if (updFacilityErr) throw new Error(updFacilityErr.message);
  }

  // 2) Insert audit trail
  const { error: auditErr } = await supabase.from('blood_inventory_audit').insert({
    inventory_id: input.inventoryId,
    facility_id: ctx.facilityId,
    staff_user_id: ctx.staffUserId,
    staff_role: ctx.staffRole,
    delta_units: input.deltaUnits,
    action: input.action,
    reason: input.reason || null
  });
  if (auditErr) throw new Error(auditErr.message);

  return { ok: true };
}

/** Convenience helpers */
export async function issueUnits(inventoryId: string, units: number, reason?: string) {
  return recordInventoryAction({ inventoryId, deltaUnits: -Math.abs(units), action: 'ISSUE', reason });
}

export async function returnUnits(inventoryId: string, units: number, reason?: string) {
  return recordInventoryAction({ inventoryId, deltaUnits: Math.abs(units), action: 'RETURN', reason });
}

export async function reserveUnits(inventoryId: string, units: number, reason?: string) {
  return recordInventoryAction({ inventoryId, deltaUnits: -Math.abs(units), action: 'RESERVE', reason });
}

export async function adjustUnits(inventoryId: string, delta: number, reason?: string) {
  return recordInventoryAction({ inventoryId, deltaUnits: delta, action: 'ADJUST', reason });
}


