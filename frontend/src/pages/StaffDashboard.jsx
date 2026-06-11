import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import StaffComplaintCard from "../components/StaffComplaintCard";

function StaffDashboard() {
  const { user, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    assignedComplaints: 0,
    resolvedComplaints: 0,
    pendingOTPComplaints: 0
  });

  const [activeTab, setActiveTab] = useState("Due"); // "Due" or "Resolved"

  // Modal states for resolution
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/users/stats");
      setStats(res.data.data.stats);
    } catch (err) {
      console.error("Failed to fetch staff stats", err);
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

  const updateStatus = async (complaintId, status, citizenOTP) => {
    try {
      await api.patch(`/complaints/${complaintId}/status`, {
        status,
        citizenOTP,
      });
      fetchComplaints();
      fetchStats();
      alert(`Complaint marked ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update complaint status");
      throw error; // Propagate up to keep modal open on failure
    }
  };

  // Open modal handler
  const handleOpenResolveModal = (complaint) => {
    setSelectedComplaint(complaint);
    // If the complaint already has an OTP generated, we show the input right away
    setOtpGenerated(!!complaint.resolutionOTP);
    setEnteredOtp("");
  };

  // Generate OTP handler
  const handleGenerateOTP = async () => {
    if (!selectedComplaint) return;
    setLoadingOtp(true);
    try {
      await api.post(`/complaints/${selectedComplaint._id}/generate-otp`);
      setOtpGenerated(true);
      alert("Resolution OTP sent to citizen's registered email/phone!");
      fetchComplaints();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  // Verify and Resolve handler
  const handleVerifyAndResolve = async (e) => {
    e.preventDefault();
    if (!enteredOtp.trim()) return alert("Please enter the OTP");

    try {
      await updateStatus(selectedComplaint._id, "Resolved", enteredOtp.trim());
      setSelectedComplaint(null); // Close modal on success
      setOtpGenerated(false);
      setEnteredOtp("");
    } catch (err) {
      // Keep modal open, error is handled in updateStatus
    }
  };

  // Filters: Due Complaints (Assigned or In Progress) vs Resolved
  const filtered = complaints.filter((c) => {
    if (activeTab === "Due") {
      return c.status === "Assigned" || c.status === "In Progress";
    }
    return c.status === "Resolved";
  });

  return (
    <div className="container">
      {/* Header */}
      <div className="glass-panel dashboard-header">
        <div>
          <h1>👷 Welcome Staff, {user?.fullName}</h1>
          <p className="text-muted">Review and resolve your assigned municipality issues</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", background: "#ef4444" }} onClick={logout}>
          Logout
        </button>
      </div>

      {/* Stats Section */}
      <div className="stats-grid" style={{ marginBottom: "32px" }}>
        <div className="stat-card">
          <h2>{stats.assignedComplaints || 0}</h2>
          <p>Assigned</p>
        </div>
        <div className="stat-card">
          <h2>{stats.resolvedComplaints || 0}</h2>
          <p>Resolved</p>
        </div>
        <div className="stat-card" style={{ borderLeft: stats.pendingOTPComplaints > 0 ? "4px solid #facc15" : "none" }}>
          <h2>{stats.pendingOTPComplaints || 0}</h2>
          <p>Pending OTP</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: "24px" }}>
        <button
          className={`filter-btn ${activeTab === "Due" ? "active" : ""}`}
          onClick={() => setActiveTab("Due")}
          style={{ padding: "12px 24px", fontSize: "1rem" }}
        >
          Due Complaints
        </button>
        <button
          className={`filter-btn ${activeTab === "Resolved" ? "active" : ""}`}
          onClick={() => setActiveTab("Resolved")}
          style={{ padding: "12px 24px", fontSize: "1rem" }}
        >
          Resolved
        </button>
      </div>

      {/* Complaints Grid */}
      <div className="dashboard-grid">
        {filtered.map((complaint) => (
          <StaffComplaintCard
            key={complaint._id}
            complaint={complaint}
            onUpdateStatus={updateStatus}
            onOpenResolveModal={handleOpenResolveModal}
          />
        ))}
        {filtered.length === 0 && (
          <div className="glass-panel text-center" style={{ gridColumn: "1/-1", padding: "40px" }}>
            <p className="text-muted">No complaints in this category.</p>
          </div>
        )}
      </div>

      {/* Resolution OTP Verification Modal */}
      {selectedComplaint && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(8px)"
        }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "450px" }}>
            <h2 style={{ marginBottom: "16px" }}>Resolve Complaint</h2>
            <p style={{ marginBottom: "24px", fontSize: "0.95rem" }}>
              <strong>Title:</strong> {selectedComplaint.title}<br />
              <strong>Citizen:</strong> {selectedComplaint.submittedBy?.fullName || "Anonymous"}
            </p>

            {!otpGenerated ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "20px", color: "var(--text-muted)" }}>
                  You need to generate a 6-digit resolution OTP. This will be sent to the citizen.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGenerateOTP}
                  disabled={loadingOtp}
                >
                  {loadingOtp ? "Generating..." : "Generate OTP"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyAndResolve}>
                <p style={{ marginBottom: "16px", color: "#10b981", fontWeight: "600" }}>
                  ✓ OTP has been generated & sent to the citizen.
                </p>
                <label className="form-label">Enter 6-Digit Resolution OTP</label>
                <input
                  className="input-field"
                  placeholder="e.g. 123456"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  maxLength={6}
                  required
                />
                
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                    onClick={() => {
                      setSelectedComplaint(null);
                      setOtpGenerated(false);
                      setEnteredOtp("");
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Verify & Resolve
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;