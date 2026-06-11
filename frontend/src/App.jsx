import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute";

import CitizenDashboard from "./pages/CitizenDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LiveChat from "./pages/LiveChat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Citizen */}
        <Route
          path="/"
          element={
            <ProtectedRoute
              allowedRoles={[
                "citizen",
              ]}
            >
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute
              allowedRoles={[
                "staff",
              ]}
            >
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
              ]}
            >
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Chat */}
        <Route
          path="/chat/:complaintId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "citizen",
                "staff",
                "admin",
              ]}
            >
              <LiveChat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;