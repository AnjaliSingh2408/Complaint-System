import { FaTrash, FaComments, FaFileAlt } from "react-icons/fa";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminComplaintCard({
  complaint,
  staffs,
  onAssign,
  onDelete,
  onDownloadReport,
}) {
  const [selectedStaff, setSelectedStaff] = useState("");
  const navigate = useNavigate();

  return (
    <div className="glass-panel complaint-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span className={`status-badge status-${complaint.status}`}>
          {complaint.status}
        </span>

        <FaTrash
          style={{
            color: "#ef4444",
            cursor: "pointer",
          }}
          onClick={() => onDelete(complaint._id)}
        />
      </div>

      <h3 style={{ marginBottom: "12px" }}>{complaint.title}</h3>

      <p className="text-muted" style={{ marginBottom: "16px" }}>
        {complaint.description}
      </p>

      {complaint.images?.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            marginBottom: "16px",
          }}
        >
          {complaint.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
          ))}
        </div>
      )}

      <div style={{ marginBottom: "20px", fontSize: "0.95rem" }}>
        <p>
          <strong>Citizen:</strong> {complaint.submittedBy?.fullName || "Anonymous"}
        </p>
        <p>
          <strong>Category:</strong> {complaint.category}
        </p>
        <p>
          <strong>Priority:</strong> {complaint.priority}
        </p>
        {complaint.assignedTo && (
          <p>
            <strong>Assigned To:</strong> {complaint.assignedTo?.fullName || "Staff"}
          </p>
        )}
        {complaint.location?.address && (
          <p>
            <strong>Location:</strong>{" "}
            {complaint.location.address}
          </p>
        )}
      </div>

      {complaint.status === "Pending" && (
        <div style={{ marginBottom: "16px" }}>
          <select
            className="input-field"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            style={{ marginBottom: "10px" }}
          >
            <option value="">Select Staff</option>
            {staffs.map((staff) => (
              <option key={staff._id} value={staff._id}>
                {staff.fullName}
              </option>
            ))}
          </select>

          <button
            className="btn-primary"
            onClick={() => onAssign(complaint._id, selectedStaff)}
          >
            Assign Staff
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button className="btn-primary" onClick={() => navigate(`/chat/${complaint._id}`)}>
          <FaComments />
          &nbsp; Open Chat
        </button>

        {complaint.status === "Resolved" && onDownloadReport && (
          <button
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            onClick={() => onDownloadReport(complaint._id, complaint.title)}
          >
            <FaFileAlt />
            &nbsp; Generate AI Report
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminComplaintCard;