import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import supabase from "../utils/supabaseClient";
import { isDemoMode } from "../utils/demoData";
import ProtectedLayout from "../components/ProtectedLayout";

// Types
interface InventoryItem {
  inventory_id: string;
  blood_type: string;
  quantity_units: number;
  expiry_date?: string;
  status?: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalInventory: number;
  totalDonors: number;
  pendingRequests: number;
  lowStockTypes: string[];
  recentDonations: number;
  bloodTypeDistribution: { type: string; units: number }[];
  donationsVsUsage: { month: string; donations: number; usage: number }[];
  inventory: InventoryItem[];
}

// Utility for expiry status
function getExpiryStatus(expiry_date?: string): "expired" | "soon" | "ok" {
  if (!expiry_date) return "ok";
  const d = new Date(expiry_date);
  const now = new Date();
  if (d < now) return "expired";
  if (d < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) return "soon"; // within 3 days
  return "ok";
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [bloodType, setBloodType] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const demo = isDemoMode();
        const [
          usersResult,
          inventoryResult,
          donorsResult,
          requestsResult,
          donationsResult,
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("blood_inventory").select("*"),
          supabase.from("donors").select("*", { count: "exact", head: true }),
          supabase.from("blood_request").select("*"),
          supabase.from("donation_records").select("*"),
        ]);

        if (!demo && usersResult.error)
          throw new Error(usersResult.error.message);
        if (!demo && inventoryResult.error)
          throw new Error(inventoryResult.error.message);
        if (!demo && donorsResult.error)
          throw new Error(donorsResult.error.message);
        if (!demo && requestsResult.error)
          throw new Error(requestsResult.error.message);
        if (!demo && donationsResult.error)
          throw new Error(donationsResult.error.message);

        const inventory: InventoryItem[] = inventoryResult.data || [];

        const totalInventory = inventory.reduce(
          (sum, item) => sum + (item.quantity_units ?? 0),
          0
        );

        const bloodTypeDistribution = inventory.reduce(
          (acc: { type: string; units: number }[], item) => {
            const existing = acc.find((x) => x.type === item.blood_type);
            if (existing) {
              existing.units += item.quantity_units ?? 0;
            } else {
              acc.push({ type: item.blood_type, units: item.quantity_units ?? 0 });
            }
            return acc;
          },
          []
        );

        const lowStockTypes = Array.from(
          new Set(
            inventory
              .filter((i) => (i.quantity_units ?? 0) < 10)
              .map((i) => i.blood_type)
          )
        );

        const pendingRequests =
          (requestsResult.data || []).filter((r) => r.status === "pending")
            .length || 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentDonations =
          (donationsResult.data || []).filter((d: any) => {
            const date = d.donation_date || d.created_at;
            return date && new Date(date) > thirtyDaysAgo;
          }).length || 0;

        // Mock chart (can later replace with real aggregated data)
        const donationsVsUsage = [
          { month: "Jan", donations: 120, usage: 100 },
          { month: "Feb", donations: 140, usage: 110 },
          { month: "Mar", donations: 90, usage: 95 },
          { month: "Apr", donations: 160, usage: 130 },
        ];

        setAnalytics({
          totalUsers: usersResult.count || 0,
          totalInventory,
          totalDonors: donorsResult.count || 0,
          pendingRequests,
          lowStockTypes,
          recentDonations,
          bloodTypeDistribution,
          donationsVsUsage,
          inventory,
        });
      } catch (e: any) {
        setError(e.message || "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading)
    return (
      <ProtectedLayout>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          Loading analytics...
        </div>
      </ProtectedLayout>
    );

  if (error)
    return (
      <ProtectedLayout>
        <div style={{ color: "red", textAlign: "center", marginTop: 40 }}>
          {error}
        </div>
      </ProtectedLayout>
    );

  if (!analytics)
    return (
      <ProtectedLayout>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          No analytics data available
        </div>
      </ProtectedLayout>
    );

  // Filter inventory by blood type
  const filteredInventory =
    bloodType === "All"
      ? analytics.inventory
      : analytics.inventory.filter((i) => i.blood_type === bloodType);

  // Low stock list
  const lowStock = analytics.inventory
    .filter((i) => (i.quantity_units ?? 0) < 10)
    .sort((a, b) => (a.quantity_units ?? 0) - (b.quantity_units ?? 0));

  return (
    <ProtectedLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        {/* Header */}
        <h1
          style={{
            backgroundColor: "#b71c1c",
            color: "#fff",
            padding: "15px 20px",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "20px",
            fontSize: "24px",
          }}
        >
          🩸 Smart Blood Bank – Analytics & Reports
        </h1>

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
            marginBottom: 30,
          }}
        >
          <KpiCard title="Total Users" value={analytics.totalUsers} />
          <KpiCard title="Available Units" value={analytics.totalInventory} />
          <KpiCard title="Registered Donors" value={analytics.totalDonors} />
          <KpiCard title="Pending Requests" value={analytics.pendingRequests} />
        </div>

        {/* Chart */}
        <div
          style={{
            marginBottom: 30,
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            border: "1px solid #b71c1c",
          }}
        >
          <h2 style={{ color: "#b71c1c", marginBottom: 20 }}>
            📊 Donations vs Usage
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.donationsVsUsage}>
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="donations" stroke="#b71c1c" />
              <Line type="monotone" dataKey="usage" stroke="#f44336" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alerts */}
        <div
          style={{
            marginBottom: 30,
            padding: 20,
            border: "1px solid #b71c1c",
            borderRadius: 8,
            background: "#ffebee",
          }}
        >
          <h2 style={{ color: "#b71c1c" }}>⚠️ Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p style={{ color: "#388e3c" }}>
              ✅ All blood types have sufficient stock.
            </p>
          ) : (
            <ul>
              {lowStock.map((item) => (
                <li
                  key={item.inventory_id}
                  style={{ color: "#b71c1c", fontWeight: "bold" }}
                >
                  {item.blood_type} is low ({item.quantity_units} units left!)
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inventory Table */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ color: "#b71c1c", marginBottom: 10 }}>
            📦 Inventory & Expiry
          </h2>
          <label style={{ marginRight: 10, color: "#b71c1c" }}>
            Filter by Blood Type:
          </label>
          <select
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value)}
            style={{
              padding: 5,
              border: "1px solid #b71c1c",
              borderRadius: 4,
              marginBottom: 15,
            }}
          >
            {["All", ...Array.from(new Set(analytics.inventory.map((i) => i.blood_type)))].map(
              (t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              )
            )}
          </select>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "center",
              border: "1px solid #b71c1c",
            }}
          >
            <thead>
              <tr style={{ background: "#ffcdd2" }}>
                <th style={{ border: "1px solid #b71c1c", padding: 8 }}>Type</th>
                <th style={{ border: "1px solid #b71c1c", padding: 8 }}>Units</th>
                <th style={{ border: "1px solid #b71c1c", padding: 8 }}>
                  Expiry
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const status = getExpiryStatus(item.expiry_date);
                return (
                  <tr key={item.inventory_id}>
                    <td style={{ border: "1px solid #b71c1c", padding: 8 }}>
                      {item.blood_type}
                    </td>
                    <td style={{ border: "1px solid #b71c1c", padding: 8 }}>
                      {item.quantity_units ?? 0}
                    </td>
                    <td
                      style={{
                        border: "1px solid #b71c1c",
                        padding: 8,
                        background:
                          status === "expired"
                            ? "#616161"
                            : status === "soon"
                            ? "#f44336"
                            : "transparent",
                        color:
                          status === "expired" || status === "soon"
                            ? "#fff"
                            : "#000",
                      }}
                    >
                      {item.expiry_date || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Export / Print */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={buttonStyle}>
            🖨️ Print Report
          </button>
          <button
            onClick={() => {
              const csv = [
                "Type,Units,Expiry",
                ...filteredInventory.map(
                  (i) => `${i.blood_type},${i.quantity_units},${i.expiry_date || "-"}`
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "inventory_report.csv";
              a.click();
            }}
            style={buttonStyle}
          >
            📥 Export CSV
          </button>
        </div>
      </div>
    </ProtectedLayout>
  );
};

// KPI Card Component
const KpiCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <div
    style={{
      background: "#ffcdd2",
      padding: 20,
      borderRadius: 8,
      textAlign: "center",
    }}
  >
    <h3 style={{ color: "#b71c1c" }}>{title}</h3>
    <p style={{ fontSize: 22, fontWeight: "bold" }}>{value.toLocaleString()}</p>
  </div>
);

// Shared button style
const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "#b71c1c",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

export default AnalyticsDashboard;
  