import { createContext, useContext, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

function getInitialUser() {
  const saved = localStorage.getItem("user");
  return saved ? JSON.parse(saved) : null;
}

function getInitialEntered() {
  return !!localStorage.getItem("entered");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [hasEntered, setHasEntered] = useState(getInitialEntered);

  function login(userData) {
    setUser(userData);
    setHasEntered(true);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("entered", "true");
    // Clear guest state on login
    localStorage.removeItem("guest_key");
    localStorage.removeItem("guest_user_id");
    localStorage.removeItem("guest_expires_at");
    localStorage.removeItem("last_order_id");
    localStorage.removeItem("guest_orders");
  }

  async function enterAsGuest() {
    const existingKey = localStorage.getItem("guest_key");

    if (existingKey) {
      try {
        const res = await API.get(`/identity/guest/session/?guest_key=${existingKey}`);
        if (res.data.has_active_guest_access) {
          setHasEntered(true);
          localStorage.setItem("entered", "true");
          return;
        }
      } catch {
        // Session expired, create new one
      }
    }

    try {
      const res = await API.post("/identity/guest/start/", { guest_name: "Walk In" });
      const { guest_key, guest_user_id, expires_at } = res.data;
      localStorage.setItem("guest_key", guest_key);
      localStorage.setItem("guest_user_id", guest_user_id);
      localStorage.setItem("guest_expires_at", expires_at);
    } catch (err) {
      console.error("Failed to start guest session:", err);
    }

    setHasEntered(true);
    localStorage.setItem("entered", "true");
  }

  function logout() {
    setUser(null);
    setHasEntered(false);
    localStorage.removeItem("user");
    localStorage.removeItem("entered");
    localStorage.removeItem("token");
    localStorage.removeItem("last_order_id");
    // Keep guest_key so same guest session persists
  }

  return (
    <AuthContext.Provider value={{ user, hasEntered, login, logout, enterAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);