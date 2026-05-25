import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    const role = user.role;
    const staffRole = user.staff_role;

    if (role === "admin") return <Navigate to="/admin" />;

    if (role === "staff") {
      if (staffRole === "kitchen") return <Navigate to="/kitchen" />;
      if (staffRole === "bar") return <Navigate to="/kitchen" />;
      if (staffRole === "cashier") return <Navigate to="/cashier" />;
      return <Navigate to="/staff" />;
    }

    return <Navigate to="/" />;
  }

  return children;
}