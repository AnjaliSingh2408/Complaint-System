import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (
    allowedRoles.length &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default ProtectedRoute;