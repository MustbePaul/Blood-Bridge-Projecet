import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../utils/supabaseClient";

interface Facility {
  name: string;
}

interface Transfer {
  transfer_id: string;
  to_facility_id: string;
  from_facility_id: string;
  blood_type: string;
  units: number;
  urgency: string;
  reason: string;
  status: string;
  dispatched_at: string | null;
  received_at: string | null;
  request_date: string | null;
  // Joined aliases from the select
  from_facility?: Facility;
  to_facility?: Facility;
  // convenience single facility alias for destination
  facility?: Facility;
}

const TransferDetail: React.FC = () => {
  const { id: transferId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTransfer = useCallback(async () => {
    if (!transferId) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase
        .from("blood_transfers")
        .select(
          "*,from_facility:facilities!fk_from_facility(name),to_facility:facilities!fk_to_facility(name)"
        )
        .eq("transfer_id", transferId)
        .single();

      if (error) {
        // Handle 'No Rows Found' gracefully (PGRST116)
        if (error.code === "PGRST116" && error.details === "The result contains 0 rows") {
          setTransfer(null);
          return;
        }
        throw error;
      }

      // Map the returned aliased relationships into the Transfer shape
      setTransfer({
        ...(data as any),
        transfer_id: (data as any).transfer_id,
        facility: (data as any).to_facility as Facility | undefined,
        from_facility: (data as any).from_facility as Facility | undefined,
        to_facility: (data as any).to_facility as Facility | undefined,
        units: (data as any).units,
      });
    } catch (err: any) {
      console.error("Error fetching transfer details:", err);
      setErrorMsg("Failed to load transfer details. The ID might be invalid or permissions are restricted.");
      setTransfer(null);
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    fetchTransfer();
  }, [fetchTransfer]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (errorMsg) return <p className="text-center text-red-600">{errorMsg}</p>;
  if (!transfer) return <p className="text-center mt-10">Transfer not found</p>;

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl max-w-2xl mx-auto mt-10 border border-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Blood Transfer #{transfer.transfer_id.substring(0, 8)}...
      </h1>

      <div className="space-y-3 text-gray-700">
        <p>
          <strong>Destination:</strong> {transfer.to_facility?.name || transfer.to_facility_id}
        </p>
        <p>
          <strong>Source:</strong> {transfer.from_facility?.name || transfer.from_facility_id}
        </p>
        <p>
          <strong>Blood Type:</strong> {transfer.blood_type}
        </p>
        <p>
          <strong>Quantity:</strong> {transfer.units} units
        </p>
        <p>
          <strong>Urgency:</strong> {transfer.urgency}
        </p>
        <p>
          <strong>Requested:</strong> {transfer.request_date ? new Date(transfer.request_date).toLocaleDateString() : 'N/A'}
        </p>
        <p>
          <strong>Dispatched:</strong> {transfer.dispatched_at ? new Date(transfer.dispatched_at).toLocaleString() : 'Pending'}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className={`px-2 py-1 rounded text-white ${
              transfer.status === "delivered"
                ? "bg-green-600"
                : transfer.status === "dispatched" || transfer.status === "in_transit"
                ? "bg-blue-500"
                : "bg-yellow-500"
            }`}
          >
            {transfer.status}
          </span>
        </p>
      </div>
    </div>
  );
};

export default TransferDetail;