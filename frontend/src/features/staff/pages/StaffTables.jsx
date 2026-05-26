import { useEffect, useState } from "react";
import {
  getTables,
  getTableSessions,
  closeTableSession,
  markTableVacant,
} from "../../../services/staffApi";
import styles from "./StaffTables.module.css";

export default function StaffTables() {
  const [tables,        setTables]        = useState([]);
  const [sessions,      setSessions]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [processing,    setProcessing]    = useState(null);
  const [refreshing,    setRefreshing]    = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [errorMsg,      setErrorMsg]      = useState("");

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    setRefreshing(true);
    try {
      const [tableRes, sessionRes] = await Promise.all([
        getTables(),
        getTableSessions(),
      ]);
      setTables(tableRes.data);
      setSessions(sessionRes.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Find the active session for a given table
  function getActiveSession(tableId) {
    return sessions.find(s => s.table === tableId && s.is_active);
  }

  async function handleEndSession(table) {
    setProcessing(table.id);
    setErrorMsg("");
    try {
      const activeSession = getActiveSession(table.id);

      if (activeSession) {
        // Correctly close the session first — this also clears guest ownership
        // so the table can be claimed by someone else
        await closeTableSession(activeSession.id);
      } else {
        // Fallback: no session found, just mark table vacant
        await markTableVacant(table.id);
      }

      await fetchAll();
      setSelected(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to end session. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  const activeTables = tables.filter(t => t.status === "occupied");
  const vacantTables = tables.filter(t => t.status === "vacant");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className={styles.loading}>Loading tables...</div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tables</h1>
          <p className={styles.sub}>QR Table Status</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>{today}</span>
          {lastRefreshed && (
            <span className={styles.refreshStatus}>
              {refreshing
                ? "⟳ Refreshing..."
                : `Updated ${lastRefreshed.toLocaleTimeString("en-PH", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  })}`}
            </span>
          )}
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.vacantDot}`} /> Vacant
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.occupiedDot}`} /> Occupied
            </span>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMsg}
          <button className={styles.errorClose} onClick={() => setErrorMsg("")}>✕</button>
        </div>
      )}

      <div className={styles.layout}>

        {/* TABLE GRID */}
        <div className={styles.gridArea}>

          {/* ACTIVE */}
          <h3 className={styles.sectionTitle}>
            Active Tables
            <span className={styles.count}>{activeTables.length}</span>
          </h3>
          <div className={styles.tableGrid}>
            {activeTables.map(table => {
              const session = getActiveSession(table.id);
              return (
                <div
                  key={table.id}
                  className={`${styles.tableCard} ${styles.occupied} ${
                    selected?.id === table.id ? styles.selectedCard : ""
                  }`}
                  onClick={() => setSelected(table)}
                >
                  <div className={styles.tableTop}>
                    <span className={styles.tableId}>{table.identifier}</span>
                    <span className={styles.tableZone}>{table.zone || "—"}</span>
                  </div>
                  <div className={styles.tableBottom}>
                    <span className={styles.tableCapacity}>
                      👤 {table.capacity}
                    </span>
                    <span className={`${styles.statusBadge} ${styles.occupiedBadge}`}>
                      Occupied
                    </span>
                  </div>
                  {session && (
                    <div className={styles.sessionInfo}>
                      Party of {session.party_size} •{" "}
                      {session.guest_label
                        ? "Guest"
                        : session.customer_account
                          ? "Member"
                          : "Walk-in"}
                    </div>
                  )}
                </div>
              );
            })}
            {activeTables.length === 0 && (
              <p className={styles.empty}>No occupied tables.</p>
            )}
          </div>

          {/* VACANT */}
          <h3 className={styles.sectionTitle} style={{ marginTop: "32px" }}>
            Vacant Tables
            <span className={styles.count}>{vacantTables.length}</span>
          </h3>
          <div className={styles.tableGrid}>
            {vacantTables.map(table => (
              <div
                key={table.id}
                className={`${styles.tableCard} ${styles.vacant} ${
                  selected?.id === table.id ? styles.selectedCard : ""
                }`}
                onClick={() => setSelected(table)}
              >
                <div className={styles.tableTop}>
                  <span className={styles.tableId}>{table.identifier}</span>
                  <span className={styles.tableZone}>{table.zone || "—"}</span>
                </div>
                <div className={styles.tableBottom}>
                  <span className={styles.tableCapacity}>
                    👤 {table.capacity}
                  </span>
                  <span className={`${styles.statusBadge} ${styles.vacantBadge}`}>
                    Vacant
                  </span>
                </div>
              </div>
            ))}
            {vacantTables.length === 0 && (
              <p className={styles.empty}>No vacant tables.</p>
            )}
          </div>
        </div>

        {/* DETAIL PANEL */}
        {selected && (
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailIcon}>🪑</div>
              <h3 className={styles.detailTitle}>TABLE DETAILS</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.detailBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Table</span>
                <span className={styles.detailValue}>{selected.identifier}</span>
                <span
                  className={`${styles.statusBadge} ${
                    selected.status === "occupied"
                      ? styles.occupiedBadge
                      : styles.vacantBadge
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Capacity</span>
                <span className={styles.detailValue}>{selected.capacity} pax</span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Zone</span>
                <span className={styles.detailValue}>{selected.zone || "—"}</span>
              </div>

              {/* Show session info if occupied */}
              {selected.status === "occupied" && (() => {
                const session = getActiveSession(selected.id);
                return session ? (
                  <>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Party</span>
                      <span className={styles.detailValue}>
                        {session.party_size} person{session.party_size !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Type</span>
                      <span className={styles.detailValue}>
                        {session.guest_label
                          ? "Guest"
                          : session.customer_account
                            ? "Member"
                            : "Walk-in"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Since</span>
                      <span className={styles.detailValue}>
                        {new Date(session.started_at).toLocaleTimeString("en-PH", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </>
                ) : null;
              })()}

              <hr className={styles.divider} />

              <h4 className={styles.actionsTitle}>Actions</h4>

              <div className={styles.actionList}>
                {selected.status === "occupied" && (
                  <button
                    className={styles.endSessionBtn}
                    onClick={() => handleEndSession(selected)}
                    disabled={processing === selected.id}
                  >
                    {processing === selected.id
                      ? "Ending session..."
                      : "🔴 End Session & Clear Table"}
                  </button>
                )}

                {selected.status === "vacant" && (
                  <div className={styles.vacantNote}>
                    ✅ Table is vacant and ready for new guests.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}