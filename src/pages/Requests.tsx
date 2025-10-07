// Requests.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../utils/supabaseClient";

interface Request {
  id: string;
  hospital_id: string;
  blood_type: string;
  quantity_units: number;
  urgency: string;
  status: string;
  created_at: string;
  hospitals?: { name: string };
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
  Fulfilled: "bg-green-100 text-green-800",
};

const Requests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blood_request")
      .select("*, hospitals(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(
        data.map((r: any) => ({
          ...r,
          hospitals: r.hospitals,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Hospital Requests</h1>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <div className="p-8 border rounded-lg text-center text-slate-600">
          No requests found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow">
          <table className="min-w-full">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Hospital</th>
                <th className="px-4 py-3 text-left">Blood Type</th>
                <th className="px-4 py-3 text-left">Quantity</th>
                <th className="px-4 py-3 text-left">Urgency</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{r.id}</td>
                  <td className="px-4 py-3 text-sm">{r.hospitals?.name}</td>
                  <td className="px-4 py-3 text-sm">{r.blood_type}</td>
                  <td className="px-4 py-3 text-sm">{r.quantity_units}</td>
                  <td className="px-4 py-3 text-sm">{r.urgency}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        statusColors[r.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/request/${r.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Requests;
