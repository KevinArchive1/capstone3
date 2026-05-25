import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function EntryGuard({ children }) {
  const { hasEntered } = useAuth();

  if (!hasEntered) {
    return <Navigate to="/start" />;
  }

  return children;
}