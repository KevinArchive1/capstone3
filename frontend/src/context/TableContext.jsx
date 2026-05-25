import { createContext, useContext, useState } from "react";
import API from "../services/api";

const TableContext = createContext();

function getInitialTable() {
  const saved = localStorage.getItem("table");
  return saved ? JSON.parse(saved) : null;
}

export function TableProvider({ children }) {
  const [table, setTable] = useState(getInitialTable);

  async function resolveTable(code) {
    // 1. Find the table by QR code value
    const res = await API.get("/tables/");
    const found = res.data.find(t => t.qr_code_value === code);
    if (!found) throw new Error("Table not found");

    // 2. Create scan request — backend auto-approves and creates/reuses session
    const guestKey = localStorage.getItem("guest_key");
    const scanRes = await API.post("/table-scan-requests/", {
      table: found.id,
      requested_device_id: guestKey || `anon-${Date.now()}`,
    });

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

  function clearTable() {
    setTable(null);
    localStorage.removeItem("table");
  }

  return (
    <TableContext.Provider value={{ table, resolveTable, clearTable }}>
      {children}
    </TableContext.Provider>
  );
}

export const useTable = () => useContext(TableContext);