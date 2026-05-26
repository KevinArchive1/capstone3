import { createContext, useContext, useState } from "react";
import API from "../services/api";

const TableContext = createContext();

function getInitialTable() {
  try {
    const saved = localStorage.getItem("table");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function TableProvider({ children }) {
  const [table, setTable] = useState(getInitialTable);

  /**
   * resolveTable — claims a table for the current device/user.
   *
   * Anti-stealing logic:
   * 1. Find the table by QR value.
   * 2. If the table is already occupied, check whether the current
   *    device/user owns the active session.
   *    - If they own it  → reuse the session (same device reconnecting).
   *    - If they don't   → throw an error so the UI can warn the user.
   * 3. If vacant → create a scan request (auto-approved by backend),
   *    which also creates/reuses a session.
   */
  async function resolveTable(code) {
    const guestKey = localStorage.getItem("guest_key");
    const token    = localStorage.getItem("token");

    // 1. Find the table
    const tablesRes = await API.get("/tables/");
    const found = tablesRes.data.find(t => t.qr_code_value === code);
    if (!found) throw new Error("Table not found");

    // 2. If occupied, verify ownership before claiming
    if (found.status === "occupied") {
      try {
        // Check if there's an active session for this table
        const sessionsRes = await API.get("/table-sessions/");
        const activeSession = sessionsRes.data.find(
          s => s.table === found.id && s.is_active
        );

        if (activeSession) {
          const ownedByGuest = guestKey &&
            activeSession.guest_label === guestKey;

          const ownedByUser = token &&
            activeSession.customer_account !== null;

          // If we already own it — let them back in (e.g. page refresh)
          if (ownedByGuest || (ownedByUser && token)) {
            const tableData = {
              ...found,
              session_id: activeSession.id,
            };
            setTable(tableData);
            localStorage.setItem("table", JSON.stringify(tableData));
            return tableData;
          }

          // Someone else owns this table — block
          throw new Error("TABLE_OCCUPIED");
        }
      } catch (err) {
        if (err.message === "TABLE_OCCUPIED") throw err;
        // If session fetch fails, fall through and try to claim anyway
      }
    }

    // 3. Vacant (or session check failed) — create scan request
    // Backend auto-approves and creates/reuses the session
    const headers = {};
    if (token) headers.Authorization = `Token ${token}`;

    const scanRes = await API.post(
      "/table-scan-requests/",
      {
        table: found.id,
        requested_device_id: guestKey || `anon-${Date.now()}`,
      },
      { headers }
    );

    const sessionId = scanRes.data.table_session_id;

    const tableData = {
      ...found,
      status: "occupied",
      session_id: sessionId,
    };

    setTable(tableData);
    localStorage.setItem("table", JSON.stringify(tableData));
    return tableData;
  }

  /**
   * revalidateTable — call this on app load to confirm the stored
   * table is still valid (the session is still active).
   * If the session ended (staff cleared it), clears the local table.
   */
  async function revalidateTable() {
    const stored = getInitialTable();
    if (!stored?.session_id) return;

    try {
      const res = await API.get(`/table-sessions/${stored.session_id}/`);
      if (!res.data.is_active) {
        // Session ended — clear local table
        setTable(null);
        localStorage.removeItem("table");
      }
    } catch {
      // Session not found — clear
      setTable(null);
      localStorage.removeItem("table");
    }
  }

  function clearTable() {
    setTable(null);
    localStorage.removeItem("table");
  }

  return (
    <TableContext.Provider value={{ table, resolveTable, revalidateTable, clearTable }}>
      {children}
    </TableContext.Provider>
  );
}

export const useTable = () => useContext(TableContext);