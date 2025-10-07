// src/pages/TransferStatus.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../components/routes";
import supabase from "../utils/supabaseClient";
import { cacheTransfers, getCachedTransfers } from "../utils/offlineCache";
import { format } from "date-fns";

interface Facility {
  id: string;
  name: string;
  type: string;
}

interface BloodTransfer {
  transfer_id: string;
  blood_type: string;
  units: number;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "failed";
  request_date: string | null;
  dispatched_at?: string | null;
  received_at?: string | null;
  from_facility_id: string;
  to_facility_id: string;
  from_facility?: Facility | null;
  to_facility?: Facility | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  dispatched: "bg-blue-100 text-blue-800",
  in_transit: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const statusOptions = ["pending", "dispatched", "in_transit", "delivered", "failed"];

const safeFormatDate = (value: unknown): string => {
  if (!value) return "N/A";
  const d = new Date(value as any);
  if (Number.isNaN(d.getTime())) return "N/A";
  try {
    return format(d, "yyyy-MM-dd HH:mm");
  } catch {
    return "N/A";
  }
};

const TransferStatus: React.FC = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<BloodTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("blood_transfers")
        .select("*")
        .order("request_date", { ascending: false })
        .limit(1000);

      if (error) throw new Error(error.message);

      const { data: facilities } = await supabase
        .from("facilities")
        .select("id, name, type");

      const facilityById = new Map<string, Facility>(
        (facilities || []).map((f: any) => [f.id as string, { id: f.id, name: f.name, type: f.type }])
      );

      const enriched: BloodTransfer[] =
        data?.map((t: any) => ({
          ...t,
          from_facility: facilityById.get(t.from_facility_id) || null,
          to_facility: facilityById.get(t.to_facility_id) || null,
        })) || [];

      setTransfers(enriched);
      cacheTransfers(enriched);
    } catch (e: any) {
      const cachedData = getCachedTransfers();
      if (cachedData) {
        setTransfers(cachedData);
        setError("Failed to fetch from server. Using cached data.");
      } else {
        setError(e?.message || "Failed to fetch transfers");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleStatusChange = async (transfer_id: string, newStatus: string) => {
    setUpdatingId(transfer_id);
    try {
      const { error } = await supabase
        .from("blood_transfers")
        .update({ status: newStatus })
        .eq("transfer_id", transfer_id);

      if (error) throw error;

      setTransfers((prev) =>
        prev.map((t) =>
          t.transfer_id === transfer_id ? { ...t, status: newStatus as any } : t
        )
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const tableRows = useMemo(() => {
    return transfers.map((t) => (
      <tr
        key={t.transfer_id}
        className="transition-colors hover:bg-blue-50 odd:bg-white even:bg-slate-50"
      >
        <td className="px-4 py-3 text-sm">{t.transfer_id}</td>
        <td className="px-4 py-3 text-sm">{t.blood_type}</td>
        <td className="px-4 py-3 text-sm">{t.units}</td>
        <td className="px-4 py-3 text-sm">{t.from_facility?.name || "N/A"}</td>
        <td className="px-4 py-3 text-sm">{t.to_facility?.name || "N/A"}</td>
        <td className="px-4 py-3 text-sm">
          <select
            value={t.status}
            onChange={(e) => handleStatusChange(t.transfer_id, e.target.value)}
            disabled={updatingId === t.transfer_id}
            className={`rounded-md px-2 py-1 text-xs font-semibold shadow-sm ${
              statusColors[t.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-sm">{safeFormatDate(t.request_date)}</td>
        <td className="px-4 py-3 text-sm">
          <button
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            onClick={() => navigate(ROUTES.requestDetails.replace(':id', t.transfer_id))}
          >
            View Details
          </button>
        </td>
      </tr>
    ));
  }, [transfers, updatingId, navigate]);

  return (
    <div className="p-6 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Blood Transfers</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : transfers.length === 0 ? (
        <div className="p-8 border rounded-lg text-center text-slate-600">
          No transfers found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Blood Type</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">From</th>
                <th className="px-4 py-3 text-left">To</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Request Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>{tableRows}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransferStatus;
