import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import CitizenComplaintCard from "../components/CitizenComplaintCard";

function CitizenDashboard() {
  const { user, setUser, logout } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Geolocation states
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Profile Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
  });
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/users/stats");
      setStats(res.data.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats", err);
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

  const getLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error(error);
        setLocationError("Permission denied or GPS error. Coordinates could not be fetched automatically.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      alert("We need your coordinates to geo-tag this complaint. Please enable location permissions.");
      return;
    }

    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("description", formData.description);
    fd.append("address", formData.address);
    fd.append("latitude", location.latitude);
    fd.append("longitude", location.longitude);
    images.forEach((img) => fd.append("images", img));

    try {
      if (editingId) {
        await api.patch(`/complaints/${editingId}`, fd,
          {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        });
      } else {
        await api.post("/complaints", fd,
          {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: "", description: "", address: "" });
      setImages([]);
      fetchComplaints();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit complaint.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await api.delete(`/complaints/${id}`);
      fetchComplaints();
      fetchStats();
    } catch (err) {
      alert("Failed to delete complaint");
    }
  };

  const handleEdit = (comp) => {
    setEditingId(comp._id);
    setFormData({
      title: comp.title,
      description: comp.description,
      address: comp.location?.address || "",
    });
    // Set coordinates if editing
    if (comp.location?.coordinates) {
      setLocation({
        longitude: comp.location.coordinates[0],
        latitude: comp.location.coordinates[1],
      });
    }
    setShowForm(true);
  };

  const handleProfileEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch("/users/edit-profile", profileData);
      setUser(res.data.data.user);
      setShowProfileModal(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
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
      alert("Failed to download report.");
    }
  };

  const filtered = filter === "All"
    ? complaints
    : complaints.filter((c) => c.status === filter);

  return (
    <div className="container">
      {/* Header */}
      <div className="glass-panel dashboard-header">
        <div>
          <h1>Welcome, {user?.fullName}</h1>
          <p className="text-muted">Manage and track your complaints efficiently</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn-primary"
            style={{ background: "rgba(255, 255, 255, 0.1)", color: "white" }}
            onClick={() => {
              setProfileData({ fullName: user?.fullName || "", email: user?.email || "" });
              setShowProfileModal(true);
            }}
          >
            Edit Profile
          </button>
          <button className="btn-primary" style={{ background: "#ef4444" }} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2>{stats.totalComplaints || 0}</h2>
          <p>Total</p>
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
          <h2>{stats.resolvedComplaints || 0}</h2>
          <p>Resolved</p>
        </div>
      </div>

      {/* Latest Complaint Prominent Section */}
      {stats.latestComplaint && (
        <div className="glass-panel" style={{ marginTop: "32px", borderLeft: "4px solid var(--primary)", padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "8px", color: "var(--primary)" }}>Latest Complaint</h3>
          <p style={{ fontWeight: "600", fontSize: "1rem" }}>{stats.latestComplaint.title}</p>
          <p className="text-muted" style={{ margin: "8px 0", fontSize: "0.95rem" }}>{stats.latestComplaint.description}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              Filed on: {new Date(stats.latestComplaint.createdAt).toLocaleDateString("en-GB")}
            </span>
            <span className={`status-badge status-${stats.latestComplaint.status}`} style={{ fontSize: "0.85rem" }}>
              {stats.latestComplaint.status}
            </span>
          </div>
        </div>
      )}

      {/* Action and Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "40px", flexWrap: "wrap", gap: "20px" }}>
        <button
          className="btn-primary"
          style={{ width: "auto" }}
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) getLocation();
          }}
        >
          {showForm ? "Close Form" : "+ Register Complaint"}
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

      {/* Register/Edit Form */}
      {showForm && (
        <form className="glass-panel" onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
          <h2 style={{ marginBottom: "20px" }}>{editingId ? "Edit Complaint" : "Register New Complaint"}</h2>
          
          <label className="form-label">Complaint Title</label>
          <input
            className="input-field"
            placeholder="e.g. Broken streetlight, leaking pipe"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <label className="form-label">Description</label>
          <textarea
            className="input-field"
            placeholder="Describe the issue in detail..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ minHeight: "120px" }}
            required
          />

          <label className="form-label">Location Address</label>
          <input
            className="input-field"
            placeholder="e.g. Flat 12B, Park Avenue"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          {/* Geo-tag feedback */}
          <div style={{ marginBottom: "20px", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", fontSize: "0.9rem" }}>
            {locationLoading ? (
              <span style={{ color: "#3b82f6" }}>⏳ Querying GPS location from browser...</span>
            ) : location ? (
              <span style={{ color: "#10b981" }}>
                ✅ Geo-tag Successful! Coordinates captured: Lat {location.latitude.toFixed(5)}, Lng {location.longitude.toFixed(5)}
              </span>
            ) : locationError ? (
              <span style={{ color: "#ef4444" }}>⚠️ {locationError}</span>
            ) : (
              <span>⏳ Geolocation request pending.</span>
            )}
          </div>

          <label className="form-label">Images (Optional, Max 5)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: "block", marginBottom: "20px" }}
            onChange={(e) => setImages([...e.target.files])}
          />

          <button className="btn-primary" type="submit" disabled={locationLoading || !location}>
            {locationLoading ? "Fetching GPS Location..." : editingId ? "Save Changes" : "Submit Complaint"}
          </button>
        </form>
      )}

      {/* Complaints Grid */}
      <div className="dashboard-grid">
        {filtered.map((complaint) => (
          <CitizenComplaintCard
            key={complaint._id}
            complaint={complaint}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownloadReport={handleDownloadReport}
          />
        ))}
        {filtered.length === 0 && (
          <div className="glass-panel text-center" style={{ gridColumn: "1/-1", padding: "40px" }}>
            <p className="text-muted">No complaints found matching this status.</p>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      {showProfileModal && (
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
          <form className="glass-panel" onSubmit={handleProfileEdit} style={{ width: "100%", maxWidth: "450px", position: "relative" }}>
            <h2 style={{ marginBottom: "20px" }}>Edit Profile</h2>
            
            <label className="form-label">Full Name</label>
            <input
              className="input-field"
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              required
            />

            <label className="form-label">Email Address</label>
            <input
              className="input-field"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              required
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="button" className="btn-primary" style={{ background: "rgba(255,255,255,0.1)", color: "white" }} onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CitizenDashboard;