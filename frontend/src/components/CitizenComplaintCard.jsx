import {
  FaEdit,
  FaTrash,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function CitizenComplaintCard({
  complaint,
  onEdit,
  onDelete,
  onDownloadReport,
}) {
  const navigate = useNavigate();

  const canModify =
    complaint.status ===
    "Pending";

  return (
    <div className="glass-panel complaint-card">
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom:
            "16px",
        }}
      >
        <span
          className={`status-badge status-${complaint.status}`}
        >
          {complaint.status}
        </span>

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "14px",
          }}
        >
          <span
            className="text-muted"
            style={{
              fontSize:
                "0.8rem",
            }}
          >
            {complaint.createdAt
              ? new Date(
                  complaint.createdAt
                ).toLocaleDateString(
                  "en-GB"
                )
              : "No Date"}
          </span>

          {canModify && (
            <>
              <FaEdit
                style={{
                  cursor:
                    "pointer",
                  color:
                    "#60a5fa",
                }}
                onClick={() =>
                  onEdit(
                    complaint
                  )
                }
              />

              <FaTrash
                style={{
                  cursor:
                    "pointer",
                  color:
                    "#ef4444",
                }}
                onClick={() =>
                  onDelete(
                    complaint._id
                  )
                }
              />
            </>
          )}
        </div>
      </div>

      <h3
        style={{
          marginBottom:
            "12px",
        }}
      >
        {complaint.title}
      </h3>

      <p
        className="text-muted"
        style={{
          marginBottom:
            "16px",
        }}
      >
        {
          complaint.description
        }
      </p>

      {complaint.images
        ?.length > 0 && (
        <div
          style={{
            display:
              "flex",
            gap: "10px",
            overflowX:
              "auto",
            marginBottom:
              "16px",
          }}
        >
          {complaint.images.map(
            (
              img,
              idx
            ) => (
              <img
                key={idx}
                src={img}
                alt=""
                style={{
                  width:
                    "90px",
                  height:
                    "90px",
                  objectFit:
                    "cover",
                  borderRadius:
                    "12px",
                }}
              />
            )
          )}
        </div>
      )}

      <div
        style={{
          marginBottom:
            "20px",
        }}
      >
        <p>
          <strong>
            Category:
          </strong>{" "}
          {
            complaint.category
          }
        </p>

        <p>
          <strong>
            Priority:
          </strong>{" "}
          {
            complaint.priority
          }
        </p>

        {complaint.resolutionOTP && (
          <p style={{ marginTop: "10px", background: "rgba(234, 179, 8, 0.15)", padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
            <strong>Resolution OTP:</strong> <span style={{ letterSpacing: "1px", color: "#facc15", fontWeight: "700" }}>{complaint.resolutionOTP}</span>
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          className="btn-primary"
          onClick={() =>
            navigate(
              `/chat/${complaint._id}`
            )
          }
        >
          <FaComments />
          &nbsp; Open Chat
        </button>

        {complaint.status === "Resolved" && onDownloadReport && (
          <button
            className="btn-primary"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            onClick={() => onDownloadReport(complaint._id, complaint.title)}
          >
            Download Report
          </button>
        )}
      </div>
    </div>
  );
}

export default CitizenComplaintCard;