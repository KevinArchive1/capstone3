import { useEffect, useRef, useState } from "react";
import { getScanRequests, moderateScanRequest } from "../../../services/staffApi";
import styles from "./QRRequest.module.css";

export default function QRRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [newAlert, setNewAlert] = useState(false);
  const prevPendingCount = useRef(0);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRequests() {
    try {
      const res = await getScanRequests();
      const data = res.data;
      const pendingCount = data.filter(r => r.status === "pending").length;
      if (pendingCount > prevPendingCount.current) {
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 4000);
      }
      prevPendingCount.current = pendingCount;
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline(request) {
    setProcessing(request.id);
    try {
      await moderateScanRequest(request.id, {
        status: "blocked",
        blocked_reason: "Declined by staff",
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to decline request.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleBlock(request) {
    setProcessing(request.id);
    try {
      await moderateScanRequest(request.id, {
        status: "blocked",
        blocked_reason: "Blocked by staff",
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to block request.");
    } finally {
      setProcessing(null);
    }
  }

  const pending = requests.filter(r => r.status === "pending");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resolved = requests.filter(
    r => r.status !== "pending" && new Date(r.created_at) >= todayStart
  );

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return (
    <div className={styles.loading}>Loading requests...</div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>QR Requests</h1>
          <p className={styles.sub}>
            Tables are auto-approved — block or decline suspicious requests here
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* NEW REQUEST ALERT */}
      {newAlert && (
        <div className={styles.newAlert}>
          🔔 New scan request incoming!
        </div>
      )}

      {/* PENDING */}
      <div className={styles.section}>
        {pending.length === 0 ? (
          <div className={styles.empty}>
            <p>No pending QR requests.</p>
          </div>
        ) : (
          pending.map(request => (
            <div key={request.id} className={styles.card}>

              <div className={styles.cardLeft}>
                <div className={styles.count}>{request.id}</div>
              </div>

              <div className={styles.cardInfo}>
                <p className={styles.device}>
                  {request.requested_device_id || "Unknown Device"}
                </p>
                <p className={styles.meta}>
                  Table {request.table_identifier || `#${request.table}`} •{" "}
                  {new Date(request.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {request.note && (
                  <p className={styles.note}>{request.note}</p>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.declineBtn}
                  onClick={() => handleDecline(request)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? "..." : "Decline"}
                </button>

                <button
                  className={styles.blockBtn}
                  onClick={() => handleBlock(request)}
                  disabled={processing === request.id}
                >
                  Block
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* RESOLVED */}
      {resolved.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Resolved</h3>
          {resolved.map(request => (
            <div key={request.id} className={`${styles.card} ${styles.resolvedCard}`}>

              <div className={styles.cardLeft}>
                <div className={styles.count}>{request.id}</div>
              </div>

              <div className={styles.cardInfo}>
                <p className={styles.device}>
                  {request.requested_device_id || "Unknown Device"}
                </p>
                <p className={styles.meta}>
                  Table {request.table_identifier || `#${request.table}`} •{" "}
                  {new Date(request.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className={styles.actions}>
                <span className={`${styles.statusBadge} ${styles[request.status]}`}>
                  {request.status}
                </span>
                {request.blocked_reason && (
                  <span className={styles.reason}>{request.blocked_reason}</span>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}