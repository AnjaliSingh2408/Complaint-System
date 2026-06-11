import {
  FaComments,
  FaCheckCircle,
  FaHammer,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ComplaintMap from "../components/ComplaintMap";

function StaffComplaintCard({
  complaint,
  onUpdateStatus,
  onOpenResolveModal,
}) {
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

        <span className="text-muted" style={{ fontSize: "0.8rem" }}>
          {complaint.createdAt
            ? new Date(complaint.createdAt).toLocaleDateString("en-GB")
            : "No Date"}
        </span>
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

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Complaint ID:</strong> {complaint._id}
        </p>
        <p>
          <strong>Citizen:</strong> {complaint.submittedBy?.fullName || "Anonymous"}
        </p>
        {complaint.submittedBy?.email && (
          <p>
            <strong>Email:</strong> {complaint.submittedBy?.email}
          </p>
        )}
        <p>
          <strong>Category:</strong> {complaint.category}
        </p>
        <p>
          <strong>Priority:</strong> {complaint.priority}
        </p>
        {/* Location Address */}
        {complaint.location?.address && (
          <p>
            <strong>Location:</strong>{" "}
            {complaint.location.address}
          </p>
        )}

        {/* Map */}
        {complaint.location?.coordinates && (
          <ComplaintMap
            complaint={complaint}
          />
        )}

        {/* Open in Maps Button */}
        {complaint.location?.coordinates && (
          <button
            className="btn-primary"
            style={{
              marginTop: "12px",
              width: "100%",
            }}
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${complaint.location.coordinates[1]},${complaint.location.coordinates[0]}`,
                "_blank"
              )
            }
          >
            📍 Open in Google Maps
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          style={{ flex: 1, minWidth: "100px" }}
          onClick={() => navigate(`/chat/${complaint._id}`)}
        >
          <FaComments />
          &nbsp; Chat
        </button>

        {complaint.status === "Assigned" && (
          <button
            className="btn-primary"
            style={{ flex: 1, minWidth: "120px", background: "linear-gradient(135deg, #a855f7, #7e22ce)" }}
            onClick={() => onUpdateStatus(complaint._id, "In Progress")}
          >
            <FaHammer />
            &nbsp; Start Work
          </button>
        )}

        {complaint.status === "In Progress" && (
          <button
            className="btn-primary"
            style={{ flex: 1, minWidth: "120px", background: "linear-gradient(135deg, #10b981, #059669)" }}
            onClick={() => onOpenResolveModal(complaint)}
          >
            <FaCheckCircle />
            &nbsp; Resolve
          </button>
        )}
      </div>
    </div>
  );
}

export default StaffComplaintCard;