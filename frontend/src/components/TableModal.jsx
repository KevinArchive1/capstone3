import { useState, useRef, useEffect } from "react";
import { useTable } from "../context/TableContext";
import styles from "./TableModal.module.css";

export default function TableModal({ onClose, onSuccess }) {
  const { resolveTable } = useTable();
  const [mode,    setMode]    = useState("manual");
  const [code,    setCode]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef         = useRef(null);
  const scannerInstanceRef = useRef(null);

  useEffect(() => {
    if (mode !== "scan") return;

    let scanner;
    let isRunning = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode("qr-reader");
      scannerInstanceRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (isRunning) {
              isRunning = false;
              await scanner.stop();
              handleSubmit(decodedText);
            }
          },
          () => {}
        )
        .then(() => { isRunning = true; })
        .catch(() => {
          setError("Camera access denied. Use manual entry instead.");
          setMode("manual");
        });
    });

    return () => {
      if (isRunning && scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => {});
        isRunning = false;
      }
    };
  }, [mode]);

  async function handleSubmit(rawCode) {
    const trimmed = (rawCode || code).trim();
    if (!trimmed) return;

    const fullCode = trimmed.startsWith("TABLEQR-")
      ? trimmed
      : `TABLEQR-${trimmed}`;

    setLoading(true);
    setError("");

    try {
      await resolveTable(fullCode);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      if (err.message === "TABLE_OCCUPIED") {
        setError(
          "🚫 This table is currently occupied by another party. " +
          "Please check your table code or ask staff for help."
        );
      } else if (err?.response?.status === 400) {
        setError("This table is unavailable. Please ask staff for assistance.");
      } else if (err?.response?.status === 404 || err?.message === "Table not found") {
        setError("Table not found. Please check the code and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>

        <h2 className={styles.title}>Find your table</h2>
        <p className={styles.sub}>
          Scan the QR code on your table or enter the short code manually
        </p>

        <div className={styles.tabs}>
          <button
            className={mode === "manual" ? styles.activeTab : styles.tab}
            onClick={() => setMode("manual")}
          >
            Enter code
          </button>
          <button
            className={mode === "scan" ? styles.activeTab : styles.tab}
            onClick={() => setMode("scan")}
          >
            Scan QR
          </button>
        </div>

        {mode === "manual" && (
          <div className={styles.manualForm}>
            <input
              className={styles.input}
              placeholder="e.g. A1 or TABLEQR-abc123"
              value={code}
              onChange={e => { setCode(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
            <button
              className={styles.btn}
              onClick={() => handleSubmit()}
              disabled={loading || !code.trim()}
            >
              {loading ? "Checking..." : "Confirm table"}
            </button>
          </div>
        )}

        {mode === "scan" && (
          <div className={styles.scanArea}>
            <div id="qr-reader" ref={scannerRef} className={styles.qrReader} />
            <p className={styles.scanHint}>
              Point your camera at the QR code on the table
            </p>
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

      </div>
    </div>
  );
}