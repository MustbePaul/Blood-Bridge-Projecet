// src/pages/Bloodtypes.tsx
import React, { useEffect, useState } from "react";
import ProtectedLayout from "../components/ProtectedLayout";
import supabase from "../utils/supabaseClient";

interface BloodTypeData {
  blood_type: string;
  total_requests: number;
}

const BloodTypes: React.FC = () => {
  const [bloodTypes, setBloodTypes] = useState<BloodTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBloodTypes = async () => {
      const { data, error } = await supabase
        .from("blood_request")
        .select("blood_type")
      if (error) console.error(error);
      else {
        const counts: Record<string, number> = {};
        (data || []).forEach(d => {
          counts[d.blood_type || "Unknown"] = (counts[d.blood_type || "Unknown"] || 0) + 1;
        });
        setBloodTypes(Object.entries(counts).map(([blood_type, total_requests]) => ({ blood_type, total_requests })));
      }
      setLoading(false);
    };
    fetchBloodTypes();
  }, []);

  return (
    <ProtectedLayout>
      <div style={{ padding: "24px" }}>
        <h2>Blood Types Overview</h2>
        {loading ? <p>Loading...</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bloodTypes.map(bt => (
              <div key={bt.blood_type} style={{ padding:12, border:"1px solid #ddd", borderRadius:10 }}>
                <strong>{bt.blood_type}</strong>: {bt.total_requests} requests
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
};

export default BloodTypes;
