import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import AdminComplaintCard from "../components/AdminComplaintCard";

function AdminDashboard() {
  const { user, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("Complaints"); // "Complaints" or "Users"
  
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    assignedComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    totalStaff: 0,
    totalCitizens: 0
  });

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phoneNo: "",
  });

  useEffect(() => {
    fetchComplaints();
    fetchStaffs();
    fetchStats();
    fetchAllUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/users/stats");
      setStats(res.data.data.stats);
    } catch (err) {
      console.error("Failed to fetch admin stats", err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints");
      setComplaints(res.data.data.complaints);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    }
  };

  const fetchStaffs = async () => {
    try {
      const res = await api.get("/users/staffs");
      setStaffs(res.data.data.staffs);
    } catch (err) {
      console.error("Failed to fetch staffs", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await api.get("/users/all");
      setAllUsers(res.data.data.users);
    } catch (err) {
      console.error("Failed to fetch all users", err);
    }
  };

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users/create-staff", staffForm);
      setShowStaffForm(false);
      setStaffForm({
        fullName: "",
        username: "",
        email: "",
        password: "",
        phoneNo: "",
      });
      fetchStaffs();
      fetchStats();
      fetchAllUsers();
      alert("Staff Created successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create staff");
    }
  };

  const assignComplaint = async (complaintId, staffId) => {
    if (!staffId) {
      return alert("Please select a staff member");
    }
    try {
      await api.patch(`/complaints/${complaintId}/assign`, { staffId });
      fetchComplaints();
      fetchStats();
      alert("Complaint assigned successfully!");
    } catch (err) {
      alert("Failed to assign complaint");
    }
  };

  const deleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      fetchComplaints();
      fetchStats();
    } catch (err) {
      alert("Failed to delete complaint");
    }
  };

  const handleDownloadReport = async (complaintId, title) => {
    try {
      const res = await api.post(`/complaints/${complaintId}/report`, {}, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${title.replace(/\s+/g, "_")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to generate and download report");
    }
  };

  const filteredComplaints = filter === "All"
    ? complaints
    : complaints.filter((c) => c.status === filter);

  return (
    <div className="container">
      {/* Header */}
      <div className="glass-panel dashboard-header">
        <div>
          <h1>Welcome Admin, {user?.fullName}</h1>
          <p className="text-muted">Monitor complaints, assign staff, and generate resolution reports</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", background: "#ef4444" }} onClick={logout}>
          Logout
        </button>
      </div>

      {/* Analytics Stats */}
      <div className="stats-grid" style={{ marginBottom: "32px" }}>
        <div className="stat-card">
          <h2>{stats.totalComplaints || 0}</h2>
          <p>Total Complaints</p>
        </div>
        <div className="stat-card">
          <h2>{stats.pendingComplaints || 0}</h2>
          <p>Pending</p>
        </div>
        <div className="stat-card">
          <h2>{stats.assignedComplaints || 0}</h2>
          <p>Assigned</p>
        </div>
        <div className="stat-card">
          <h2>{stats.inProgressComplaints || 0}</h2>
          <p>In Progress</p>
        </div>
        <div className="stat-card">
          <h2>{stats.resolvedComplaints || 0}</h2>
          <p>Resolved</p>
        </div>
        <div className="stat-card">
          <h2>{stats.totalStaff || 0}</h2>
          <p>Total Staff</p>
        </div>
        <div className="stat-card">
          <h2>{stats.totalCitizens || 0}</h2>
          <p>Total Citizens</p>
        </div>
      </div>

      {/* Tabs / Switcher */}
      <div className="filter-bar" style={{ marginBottom: "24px" }}>
        <button
          className={`filter-btn ${activeTab === "Complaints" ? "active" : ""}`}
          onClick={() => setActiveTab("Complaints")}
          style={{ padding: "12px 24px" }}
        >
          All Complaints
        </button>
        <button
          className={`filter-btn ${activeTab === "Users" ? "active" : ""}`}
          onClick={() => setActiveTab("Users")}
          style={{ padding: "12px 24px" }}
        >
          Users Directory ({allUsers.length})
        </button>
      </div>

      {activeTab === "Complaints" ? (
        <>
          {/* Create Staff & Filters Section */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
            <button
              className="btn-primary"
              style={{ width: "auto" }}
              onClick={() => setShowStaffForm(!showStaffForm)}
            >
              {showStaffForm ? "Cancel Staff Creation" : "Create Staff"}
            </button>

            <div style={{ display: "flex", gap: "10px" }}>
              {["All", "Pending", "Assigned", "In Progress", "Resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-btn ${filter === f ? "active" : ""}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Create Staff Form */}
          {showStaffForm && (
            <form className="glass-panel" onSubmit={createStaff} style={{ marginTop: "24px", maxWidth: "600px" }}>
              <h2 style={{ marginBottom: "20px" }}>Register Staff Account</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Bansuri Singh"
                    value={staffForm.fullName}
                    onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Username</label>
                  <input
                    className="input-field"
                    placeholder="e.g. bansuri_staff"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <label className="form-label">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="e.g. staff@municipality.gov"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Password</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="••••••••"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={staffForm.phoneNo}
                    onChange={(e) => setStaffForm({ ...staffForm, phoneNo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button className="btn-primary" type="submit" style={{ marginTop: "10px" }}>
                Submit Staff Registration
              </button>
            </form>
          )}

          {/* Complaints Grid */}
          <div className="dashboard-grid">
            {filteredComplaints.map((complaint) => (
              <AdminComplaintCard
                key={complaint._id}
                complaint={complaint}
                staffs={staffs}
                onAssign={assignComplaint}
                onDelete={deleteComplaint}
                onDownloadReport={handleDownloadReport}
              />
            ))}
            {filteredComplaints.length === 0 && (
              <div className="glass-panel text-center" style={{ gridColumn: "1/-1", padding: "40px" }}>
                <p className="text-muted">No complaints found matching this status.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Users Directory List */
        <div className="glass-panel" style={{ marginTop: "24px", overflowX: "auto" }}>
          <h2 style={{ marginBottom: "20px" }}>Registered Users & Staff</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", paddingBottom: "10px" }}>
                <th style={{ padding: "12px", color: "var(--text-muted)" }}>Full Name</th>
                <th style={{ padding: "12px", color: "var(--text-muted)" }}>Username</th>
                <th style={{ padding: "12px", color: "var(--text-muted)" }}>Email</th>
                <th style={{ padding: "12px", color: "var(--text-muted)" }}>Phone</th>
                <th style={{ padding: "12px", color: "var(--text-muted)" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "14px 12px" }}>{u.fullName}</td>
                  <td style={{ padding: "14px 12px", fontFamily: "monospace" }}>{u.username}</td>
                  <td style={{ padding: "14px 12px" }}>{u.email}</td>
                  <td style={{ padding: "14px 12px" }}>{u.phoneNo}</td>
                  <td style={{ padding: "14px 12px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        background:
                          u.role === "admin"
                            ? "rgba(239, 68, 68, 0.15)"
                            : u.role === "staff"
                            ? "rgba(168, 85, 247, 0.15)"
                            : "rgba(59, 130, 246, 0.15)",
                        color:
                          u.role === "admin"
                            ? "#f87171"
                            : u.role === "staff"
                            ? "#c084fc"
                            : "#60a5fa",
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;