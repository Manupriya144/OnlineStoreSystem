import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, role, authLoading } = useAuth();

  if (authLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (role?.trim().toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;