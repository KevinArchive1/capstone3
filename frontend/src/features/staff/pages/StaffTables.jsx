import { useEffect, useState } from "react";
import { getTables, markTableVacant } from "../../../services/staffApi";
import styles from "./StaffTables.module.css";

export default function StaffTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTables() {
    setRefreshing(true);
    try {
      const res = await getTables();
      setTables(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleEndSession(table) {
    setProcessing(table.id);
    try {
      await markTableVacant(table.id);
      fetchTables();
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert("Failed to end session.");
    } finally {
      setProcessing(null);
    }
  }

  const activeTables = tables.filter(t => t.status === "occupied");
  const vacantTables = tables.filter(t => t.status === "vacant");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
          <p className={styles.sub}>See what's the Standing QR Table Status</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>{today}</span>
          {lastRefreshed && (
            <span className={styles.refreshStatus}>
              {refreshing ? "⟳ Refreshing..." : `Updated ${lastRefreshed.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
            </span>
          )}
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.vacantDot}`} /> Vacant
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.occupiedDot}`} /> Occupied
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.dot} ${styles.mergedDot}`} /> Merged
            </span>
          </div>
        </div>
      </div>

      <div className={styles.layout}>

        {/* TABLE GRID */}
        <div className={styles.gridArea}>

          {/* ACTIVE */}
          <h3 className={styles.sectionTitle}>
            Active Tables
            <span className={styles.count}>{activeTables.length}</span>
          </h3>
          <div className={styles.tableGrid}>
            {activeTables.map(table => (
              <div
                key={table.id}
                className={`${styles.tableCard} ${styles.occupied} ${selected?.id === table.id ? styles.selectedCard : ""}`}
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
              </div>
            ))}
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
                className={`${styles.tableCard} ${styles.vacant} ${selected?.id === table.id ? styles.selectedCard : ""}`}
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

        {/* TABLE DETAIL PANEL */}
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
                <span className={`${styles.statusBadge} ${selected.status === "occupied" ? styles.occupiedBadge : styles.vacantBadge}`}>
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

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue} style={{ textTransform: "capitalize" }}>
                  {selected.status}
                </span>
              </div>

              <hr className={styles.divider} />

              <h4 className={styles.actionsTitle}>Actions</h4>

              <div className={styles.actionList}>
                <button
                  className={styles.actionBtn}
                  onClick={() => window.location.href = `/staff/orders?table=${selected.identifier}`}
                >
                  📋 View Order History
                </button>

                {selected.status === "occupied" && (
                  <button
                    className={styles.endSessionBtn}
                    onClick={() => handleEndSession(selected)}
                    disabled={processing === selected.id}
                  >
                    {processing === selected.id ? "Ending..." : "🔴 End Session"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}