import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  // 🔒 Not logged in
  if (!user) {
    return <Navigate to="/start" />;
  }

  const role = user.role;

  // 🔥 FORCE ROLE-BASED AREA
  if (role === "admin" && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin" />;
  }

  if (role === "staff") {
    const staffRole = user.staff_role;
    if (staffRole === "kitchen" && !location.pathname.startsWith("/kitchen")) {
      return <Navigate to="/kitchen" />;
    }
    if (staffRole === "bar" && !location.pathname.startsWith("/kitchen")) {
      return <Navigate to="/kitchen" />;
    }
    if (staffRole === "cashier" && !location.pathname.startsWith("/cashier")) {
      return <Navigate to="/cashier" />;
    }
    if (staffRole === "waiter" && !location.pathname.startsWith("/staff")) {
      return <Navigate to="/staff" />;
    }
  }

  if (role === "kitchen" && !location.pathname.startsWith("/kitchen")) {
    return <Navigate to="/kitchen" />;
  }

  // 👤 customer stays in user app
  if (role === "customer" && location.pathname.startsWith("/admin")) {
    return <Navigate to="/" />;
  }

  // // 🔒 Optional role restriction
  // if (allowedRoles && !allowedRoles.includes(role)) {
  //   return <Navigate to="/start" />;
  // }

  return children;
}