import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/start"); // go back to landing
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}