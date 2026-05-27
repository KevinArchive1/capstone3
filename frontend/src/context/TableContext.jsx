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
   * Creates a scan request (auto-approved by backend), which also
   * creates/reuses a session. The backend handles occupied-table
   * logic — if the session already belongs to this device/user it
   * returns the existing session; otherwise it blocks the claim.
   */
  async function resolveTable(code) {
    const guestKey = localStorage.getItem("guest_key");
    const token    = localStorage.getItem("token");

    // 1. Find the table by QR value
    const tablesRes = await API.get("/tables/");
    const found = tablesRes.data.find(t => t.qr_code_value === code);
    if (!found) throw new Error("Table not found");

    // 2. Create a scan request — backend auto-approves and creates/reuses session.
    //    If the table is occupied by someone else the backend will reject with 400.
    const headers = {};
    if (token) headers.Authorization = `Token ${token}`;

    let scanRes;
    try {
      scanRes = await API.post(
        "/table-scan-requests/",
        {
          table: found.id,
          requested_device_id: guestKey || `anon-${Date.now()}`,
        },
        { headers }
      );
    } catch (err) {
      // 400 from the backend means the table is occupied by another party
      if (err?.response?.status === 400) {
        throw new Error("TABLE_OCCUPIED");
      }
      throw err;
    }

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
   * table session is still active. Uses the orders endpoint instead
   * of table-sessions (which requires staff permission).
   * If we can't verify, we leave the table as-is rather than
   * clearing it — avoids false positives on network errors.
   */
  async function revalidateTable() {
    const stored = getInitialTable();
    if (!stored?.session_id) return;

    const token    = localStorage.getItem("token");
    const guestKey = localStorage.getItem("guest_key");

    // Staff/admin can hit table-sessions directly
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role === "staff" || user.role === "admin") {
          const res = await API.get(`/table-sessions/${stored.session_id}/`);
          if (!res.data.is_active) {
            setTable(null);
            localStorage.removeItem("table");
          }
          return;
        }
      } catch {
        // ignore — leave table as-is
        return;
      }
    }

    // For customers and guests, verify via the tables list (public endpoint)
    try {
      const tablesRes = await API.get("/tables/");
      const currentTable = tablesRes.data.find(t => t.id === stored.id);
      if (currentTable && currentTable.status === "vacant") {
        // Table is now vacant — our session ended
        setTable(null);
        localStorage.removeItem("table");
      }
    } catch {
      // Network error — leave table as-is
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