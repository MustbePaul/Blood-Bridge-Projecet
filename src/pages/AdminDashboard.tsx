// src/pages/AdminDashboard.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProtectedLayout from "../components/ProtectedLayout";
import supabase from "../utils/supabaseClient";
import { ROUTES } from "../components/routes";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

type RequestStatus = "Pending" | "Approved" | "Processing" | "Completed" | "Rejected";

interface StatCardData {
  totalUsers: number;
  bloodRequests: number;
  bloodBanks: number;
  hospitals: number;
  totalUnits: number;
  totalTypes: number;
  uniqueHospitals: number;
}

interface BloodRequest {
  request_id: string;
  hospital_id?: string;
  hospital_name?: string;
  blood_type: string;
  quantity: number;
  status: RequestStatus;
  request_date?: string;
  created_at?: string;
}

interface AreaChartPoint {
  name: string;
  Requests: number;
  Units: number;
}

interface BarChartPoint {
  name: string;
  Users: number;
  Requests: number;
}

interface BloodTypeData {
  name: string;
  value: number;
  color: string;
}

const fontStack = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

// -------------------- COMPONENTS --------------------

const StatCard: React.FC<{ title: string; count: number; color: string; icon: string; route?: string; navigate: Function }> = ({ title, count, color, icon, route, navigate }) => {
  return (
    <div
      style={{
        background: color, borderRadius: 14, width: 220, height: 140,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "#fff", cursor: route ? "pointer" : "default", boxShadow: "0px 6px 12px rgba(0,0,0,0.18)",
        transition: "transform 0.15s ease", fontFamily: fontStack
      }}
      onClick={() => route && navigate(route)}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <div style={{ fontSize: 34, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: "bold" }}>{count}</div>
      <div style={{ fontSize: 14, textAlign: "center" }}>{title}</div>
    </div>
  );
};

const RecentRequests: React.FC<{
  requests: BloodRequest[];
  processingRequestId: string | null;
  handleProcessRequest: (id: string) => void;
  navigate: Function;
}> = ({ requests, processingRequestId, handleProcessRequest, navigate }) => {

  const getStatusColor = (status: RequestStatus) => ({
    Pending: "#90A4AE",
    Approved: "#42A5F5",
    Processing: "#FFCA28",
    Completed: "#66BB6A",
    Rejected: "#EF5350",
  }[status] || "#90A4AE");

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 18, color: "#FF5252" }}>Recent Blood Requests</h3>
      {requests.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", padding: 20 }}>No recent blood requests</div>
      ) : (
        requests.map(req => (
          <div key={req.request_id} style={{
            border: "1px solid #eee", borderRadius: 10, padding: 12, marginBottom: 12,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: "bold", fontSize: 14 }}>
                {req.request_id.slice(0, 10).toUpperCase()}
                <span style={{
                  marginLeft: 8, padding: "2px 8px", borderRadius: 6, fontSize: 12,
                  color: "#fff", background: (req.quantity >= 6 ? "#D32F2F" : req.quantity > 3 ? "#FF7043" : "#9E9E9E")
                }}>
                  {(req.quantity >= 6 ? "Critical" : req.quantity > 3 ? "Urgent" : "Normal")}
                </span>
              </div>
              <div style={{ fontSize: 15 }}>{req.hospital_name || `Hospital ID: ${req.hospital_id ?? "N/A"}`}</div>
              <div style={{ fontSize: 13, color: "#666" }}>{req.blood_type} - {req.quantity} units</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ background: getStatusColor(req.status), color: "#fff", padding: "6px 10px", borderRadius: 8, fontSize: 12 }}>
                {req.status}
              </span>
<button
                  onClick={() => navigate(`/request/${req.request_id}`)}
                  style={{ background: "#fff", color: "#FF5252", border: "1px solid #FFCDD2", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}
                >
                  View
                </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const BloodTypeChart: React.FC<{ data: BloodTypeData[] }> = ({ data }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
    <h3 style={{ fontSize: 18, color: "#FF5252" }}>Blood Type Distribution</h3>
    <div style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%" cy="50%"
            outerRadius={80}
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
          >
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${value} requests`, "Count"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AreaChartCard: React.FC<{ data: AreaChartPoint[] }> = ({ data }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
    <h3 style={{ fontSize: 18, color: "#FF5252" }}>Monthly Activity</h3>
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="Requests" fill="#FF7043" stroke="#FF7043" fillOpacity={0.5} />
          <Area type="monotone" dataKey="Units" fill="#FFA726" stroke="#FFA726" fillOpacity={0.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const BarChartCard: React.FC<{ data: BarChartPoint[] }> = ({ data }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
    <h3 style={{ fontSize: 18, color: "#FF5252" }}>Users vs Requests</h3>
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Users" fill="#FF7043" />
          <Bar dataKey="Requests" fill="#FFA726" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// -------------------- MAIN DASHBOARD --------------------

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statData, setStatData] = useState<StatCardData>({
    totalUsers: 0, bloodRequests: 0, bloodBanks: 0, hospitals: 0,
    totalUnits: 0, totalTypes: 0, uniqueHospitals: 0,
  });
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [areaChartData, setAreaChartData] = useState<AreaChartPoint[]>([]);
  const [barChartData, setBarChartData] = useState<BarChartPoint[]>([]);
  const [bloodTypeData, setBloodTypeData] = useState<BloodTypeData[]>([]);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // -------------------- DATA FETCH --------------------
  const fetchStatistics = useCallback(async () => {
    const [usersRes, requestsRes, banksRes, hospitalsRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("blood_request").select("*", { count: "exact", head: true }),
      supabase.from("blood_banks").select("*", { count: "exact", head: true }),
      supabase.from("hospitals").select("*", { count: "exact", head: true }),
    ]);

    if (usersRes.error || requestsRes.error || banksRes.error || hospitalsRes.error)
      throw new Error("Failed to fetch basic counts");

    const { data: reqsDetailed, error: reqError } = await supabase
      .from("blood_request")
      .select("quantity, blood_type, hospitals(hospital_name)");

    if (reqError) throw reqError;

    const requests = reqsDetailed || [];
    const totalUnits = requests.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);
    const typesSet = new Set(requests.map((r: any) => r.blood_type).filter(Boolean));
    const hospSet = new Set(requests.map((r: any) => r.hospitals?.hospital_name).filter(Boolean));

    setStatData({
      totalUsers: usersRes.count ?? 0,
      bloodRequests: requestsRes.count ?? 0,
      bloodBanks: banksRes.count ?? 0,
      hospitals: hospitalsRes.count ?? 0,
      totalUnits,
      totalTypes: typesSet.size,
      uniqueHospitals: hospSet.size,
    });
  }, []);

  const fetchBloodRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("blood_request")
      .select("request_id, hospital_id, blood_type, quantity, status, request_date, created_at, hospitals(hospital_name)")
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) throw error;

    const formatted = (data || []).map((r: any) => ({
      request_id: r.request_id,
      hospital_id: r.hospital_id,
      blood_type: r.blood_type,
      quantity: r.quantity,
      status: r.status as RequestStatus,
      request_date: r.request_date,
      created_at: r.created_at,
      hospital_name: r.hospitals?.hospital_name,
    }));
    setBloodRequests(formatted);
    return formatted;
  }, []);

  const generateAreaChartData = useCallback((requestsList: BloodRequest[]) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthPoints: AreaChartPoint[] = months.map(m => ({ name: m, Requests: 0, Units: 0 }));
    requestsList.forEach(r => {
      const date = new Date(r.created_at || r.request_date || "");
      if (!isNaN(date.getTime())) {
        monthPoints[date.getMonth()].Requests += 1;
        monthPoints[date.getMonth()].Units += r.quantity || 0;
      }
    });
    return monthPoints.slice(0, new Date().getMonth() + 1);
  }, []);

  const fetchBarChartData = useCallback(async () => {
    const [usersRes, requestsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, created_at"),
      supabase.from("blood_request").select("request_id, created_at"),
    ]);
    const monthsMap: Record<string, { Users: number; Requests: number }> = {};
    (usersRes.data || []).forEach(u => {
      const key = new Date(u.created_at).toLocaleString("default", { month: "short", year: "numeric" });
      monthsMap[key] = monthsMap[key] || { Users: 0, Requests: 0 };
      monthsMap[key].Users++;
    });
    (requestsRes.data || []).forEach(r => {
      const key = new Date(r.created_at).toLocaleString("default", { month: "short", year: "numeric" });
      monthsMap[key] = monthsMap[key] || { Users: 0, Requests: 0 };
      monthsMap[key].Requests++;
    });
    return Object.keys(monthsMap).sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
      .map(k => ({ name: k, ...monthsMap[k] }));
  }, []);

  const computeBloodTypeDistribution = useCallback(async () => {
    const { data, error } = await supabase.from("blood_request").select("blood_type");
    if (error) throw error;
    const counts: Record<string, number> = {};
    (data || []).forEach(r => { counts[r.blood_type || "Unknown"] = (counts[r.blood_type || "Unknown"] || 0) + 1; });
    const COLORS = ['#FF7043','#FFA726','#FF5252','#EC407A','#AB47BC','#7E57C2','#5C6BC0','#42A5F5'];
    setBloodTypeData(Object.entries(counts).map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] })));
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchStatistics();
      const recentRequests = await fetchBloodRequests();
      setAreaChartData(generateAreaChartData(recentRequests));
      setBarChartData(await fetchBarChartData());
      await computeBloodTypeDistribution();
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics, fetchBloodRequests, generateAreaChartData, fetchBarChartData, computeBloodTypeDistribution]);

  const handleProcessRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    setBloodRequests(prev => prev.map(r => r.request_id === requestId ? { ...r, status: "Processing" } : r));
    const { error } = await supabase.from("blood_request").update({ status: "Processing" }).eq("request_id", requestId);
    if (error) await fetchBloodRequests();
    setProcessingRequestId(null);
  };

  // -------------------- SUBSCRIPTIONS --------------------
 // -------------------- SUBSCRIPTIONS CONTINUED --------------------
  useEffect(() => {
    const tables = ["profiles", "blood_request", "blood_banks", "hospitals"];
    const channels = tables.map(table =>
      supabase.channel(`${table}-changes`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => loadDashboardData())
        .subscribe()
    );

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, [loadDashboardData]);

  // -------------------- INITIAL LOAD --------------------
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

// -------------------- STAT CARDS --------------------
  // System Admin (IT) should see only system-level stats/links
  const statCards = [
    { title: "Total Users", count: statData.totalUsers, color: "#FF7043", icon: "👥", route: "/user-management" },
    { title: "Blood Banks", count: statData.bloodBanks, color: "#FF5252", icon: "🏦", route: "/blood-banks" },
    { title: "Hospitals", count: statData.hospitals, color: "#EC407A", icon: "🏥", route: "/hospitals" }
  ];

  if (loading) return (
    <ProtectedLayout>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: fontStack, fontSize: 18, color: "#666"
      }}>
        Loading dashboard...
      </div>
    </ProtectedLayout>
  );

  // -------------------- RENDER --------------------
  return (
    <ProtectedLayout>
      <div style={{ fontFamily: fontStack, background: "#f7f7f7", minHeight: "100vh", paddingBottom: 40 }}>
        <div style={{ margin: "18px 30px", paddingTop: 24 }}>

          {/* Welcome & controls */}
          <div style={{
            background: "#fff", borderRadius: 16, padding: "26px 30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 22,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
<div style={{ fontSize: 22, fontWeight: "bold", color: "#212121" }}>Welcome System Admin!</div>
              <div style={{ marginTop: 6, color: "#555" }}>
Manage organizations and users. Use the links below to configure the system.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => loadDashboardData()}
                style={{ background: "#FF5252", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" }}
              >🔄 Refresh</button>
              <button
                onClick={() => navigate("/reports")}
                style={{ background: "#fff", color: "#FF5252", border: "1px solid #FFCDD2", padding: "10px 14px", borderRadius: 8, cursor: "pointer" }}
              >View Reports</button>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
            {statCards.map(card => <StatCard key={card.title} {...card} navigate={navigate} />)}
          </div>

{/* Admin Management Links (system-level) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {[ 
              { title: 'Manage Hospitals', icon: '🏥', route: '/hospitals', color: '#EC407A' },
              { title: 'Manage Blood Banks', icon: '🏦', route: '/blood-banks', color: '#FF5252' },
              { title: 'User Management', icon: '👥', route: '/user-management', color: '#FF7043' },
              { title: 'System Health', icon: '🖥️', route: '/system-health', color: '#7E57C2' },
              { title: 'Settings', icon: '⚙️', route: '/settings', color: '#42A5F5' }
            ].map(link => (
              <div key={link.title} onClick={() => navigate(link.route)}
                style={{ background: link.color, color: '#fff', padding: 18, borderRadius: 14, cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ fontSize: 30, marginBottom: 8 }}>{link.icon}</div>
                <div style={{ fontWeight: 600 }}>{link.title}</div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && <div style={{
            marginTop: 18, background: "#fff3e0", color: "#f57c00",
            padding: 12, borderRadius: 8, border: "1px solid #ffb74d"
          }}>
            <strong>Notice:</strong> {error}
            <button
              onClick={() => loadDashboardData()}
              style={{ marginLeft: 10, padding: "6px 10px", background: "#f57c00", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
            >Retry</button>
          </div>}

        </div>
      </div>
    </ProtectedLayout>
  );
};

export default AdminDashboard;
