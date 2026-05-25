import { useEffect, useState } from "react";
import { generateReport, getReports, runSimulation } from "../../../services/adminApi";
import styles from "./AdminReports.module.css";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [generating, setGenerating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [reportForm, setReportForm] = useState({
    range_type: "daily",
    start: "",
    end: "",
  });

  const [simForm, setSimForm] = useState({
    menu_price_delta: "0",
    monthly_salary_delta: "0",
    staff_delta: "0",
    expansion_cost: "0",
    added_capacity: "0",
  });

  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await getReports();
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const payload = { range_type: reportForm.range_type };
      if (reportForm.range_type === "custom") {
        payload.start = reportForm.start;
        payload.end = reportForm.end;
      }
      await generateReport(payload);
      fetchReports();
    } catch (err) {
      console.error(err);
      alert("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRunSimulation() {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await runSimulation({
        menu_price_delta: parseFloat(simForm.menu_price_delta),
        monthly_salary_delta: parseFloat(simForm.monthly_salary_delta),
        staff_delta: parseInt(simForm.staff_delta),
        expansion_cost: parseFloat(simForm.expansion_cost),
        added_capacity: parseInt(simForm.added_capacity),
      });
      setSimResult(res.data.results);
    } catch (err) {
      console.error(err);
      alert("Failed to run simulation.");
    } finally {
      setSimulating(false);
    }
  }

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading reports...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.sub}>Generate reports and run cost simulations</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={activeTab === "reports" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("reports")}
        >
          Sales Reports
        </button>
        <button
          className={activeTab === "simulation" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("simulation")}
        >
          Cost Simulation
        </button>
      </div>

      {/* REPORTS TAB */}
      {activeTab === "reports" && (
        <div className={styles.reportsLayout}>

          {/* LEFT — GENERATE */}
          <div className={styles.generateCard}>
            <h3 className={styles.cardTitle}>Generate Report</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Range Type</label>
              <select
                className={styles.input}
                value={reportForm.range_type}
                onChange={e => setReportForm({ ...reportForm, range_type: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {reportForm.range_type === "custom" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Start Date</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={reportForm.start}
                    onChange={e => setReportForm({ ...reportForm, start: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>End Date</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={reportForm.end}
                    onChange={e => setReportForm({ ...reportForm, end: e.target.value })}
                  />
                </div>
              </>
            )}

            <button
              className={styles.generateBtn}
              onClick={handleGenerateReport}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Report"}
            </button>
          </div>

          {/* RIGHT — REPORT LIST */}
          <div className={styles.reportList}>
            <h3 className={styles.cardTitle}>Generated Reports</h3>
            {reports.length === 0 ? (
              <p className={styles.empty}>No reports generated yet.</p>
            ) : (
              reports.map(report => (
                <div
                  key={report.id}
                  className={`${styles.reportCard} ${selectedReport?.id === report.id ? styles.selectedReport : ""}`}
                  onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                >
                  <div className={styles.reportTop}>
                    <span className={styles.reportRange}>
                      {report.range_type.charAt(0).toUpperCase() + report.range_type.slice(1)} Report
                    </span>
                    <span className={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString("en-PH", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className={styles.reportStats}>
                    <div className={styles.reportStat}>
                      <p className={styles.reportStatLabel}>Revenue</p>
                      <p className={styles.reportStatValue}>
                        ₱{Number(report.payload?.revenue || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className={styles.reportStat}>
                      <p className={styles.reportStatLabel}>Orders</p>
                      <p className={styles.reportStatValue}>
                        {report.payload?.order_count || 0}
                      </p>
                    </div>
                    <div className={styles.reportStat}>
                      <p className={styles.reportStatLabel}>Paid</p>
                      <p className={styles.reportStatValue}>
                        {report.payload?.paid_order_count || 0}
                      </p>
                    </div>
                  </div>

                  {/* EXPANDED */}
                  {selectedReport?.id === report.id && (
                    <div className={styles.reportExpanded}>
                      <hr className={styles.divider} />
                      <h4 className={styles.expandedTitle}>Top Selling Items</h4>
                      {report.payload?.top_items?.length > 0 ? (
                        report.payload.top_items.map((item, i) => (
                          <div key={i} className={styles.topItem}>
                            <span>#{i + 1} {item.item_name}</span>
                            <span>{item.quantity} sold</span>
                          </div>
                        ))
                      ) : (
                        <p className={styles.empty}>No sales data.</p>
                      )}

                      <h4 className={styles.expandedTitle} style={{ marginTop: "16px" }}>
                        Low Stock at Time of Report
                      </h4>
                      {report.payload?.low_stock_ingredients?.length > 0 ? (
                        report.payload.low_stock_ingredients.map((ing, i) => (
                          <div key={i} className={styles.topItem}>
                            <span>{ing.name}</span>
                            <span style={{ color: "#e53e3e" }}>{ing.available_quantity} left</span>
                          </div>
                        ))
                      ) : (
                        <p className={styles.empty}>No low stock at time of report.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SIMULATION TAB */}
      {activeTab === "simulation" && (
        <div className={styles.simLayout}>

          {/* LEFT — INPUTS */}
          <div className={styles.simCard}>
            <h3 className={styles.cardTitle}>Cost Simulation</h3>
            <p className={styles.simDesc}>
              Adjust variables to project how changes affect revenue and profit.
            </p>

            <div className={styles.simGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Menu Price Delta (₱)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={simForm.menu_price_delta}
                  onChange={e => setSimForm({ ...simForm, menu_price_delta: e.target.value })}
                  placeholder="0"
                />
                <p className={styles.hint}>Added to each item's price per order</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Monthly Salary Delta (₱)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={simForm.monthly_salary_delta}
                  onChange={e => setSimForm({ ...simForm, monthly_salary_delta: e.target.value })}
                  placeholder="0"
                />
                <p className={styles.hint}>Change in total monthly salaries</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Staff Delta</label>
                <input
                  className={styles.input}
                  type="number"
                  value={simForm.staff_delta}
                  onChange={e => setSimForm({ ...simForm, staff_delta: e.target.value })}
                  placeholder="0"
                />
                <p className={styles.hint}>Number of staff added (₱20,000/each)</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Expansion Cost (₱)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={simForm.expansion_cost}
                  onChange={e => setSimForm({ ...simForm, expansion_cost: e.target.value })}
                  placeholder="0"
                />
                <p className={styles.hint}>One-time expansion costs</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Added Capacity (seats)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={simForm.added_capacity}
                  onChange={e => setSimForm({ ...simForm, added_capacity: e.target.value })}
                  placeholder="0"
                />
                <p className={styles.hint}>Additional seating capacity</p>
              </div>
            </div>

            <button
              className={styles.simBtn}
              onClick={handleRunSimulation}
              disabled={simulating}
            >
              {simulating ? "Running..." : "Run Simulation"}
            </button>
          </div>

          {/* RIGHT — RESULTS */}
          <div className={styles.simResults}>
            <h3 className={styles.cardTitle}>Simulation Results</h3>

            {simResult ? (
              <div className={styles.resultGrid}>
                <div className={styles.resultCard}>
                  <p className={styles.resultLabel}>Baseline Revenue</p>
                  <h2 className={styles.resultValue}>
                    ₱{Number(simResult.baseline_revenue).toFixed(2)}
                  </h2>
                </div>

                <div className={styles.resultCard}>
                  <p className={styles.resultLabel}>Projected Revenue</p>
                  <h2 className={styles.resultValue} style={{ color: "#28a745" }}>
                    ₱{Number(simResult.projected_revenue).toFixed(2)}
                  </h2>
                </div>

                <div className={styles.resultCard}>
                  <p className={styles.resultLabel}>Projected Cost</p>
                  <h2 className={styles.resultValue} style={{ color: "#e53e3e" }}>
                    ₱{Number(simResult.projected_cost).toFixed(2)}
                  </h2>
                </div>

                <div className={`${styles.resultCard} ${styles.profitCard}`}>
                  <p className={styles.resultLabel}>Projected Profit</p>
                  <h2 className={styles.resultValue} style={{
                    color: Number(simResult.projected_profit) >= 0 ? "#ff7a00" : "#e53e3e",
                    fontSize: "28px",
                  }}>
                    ₱{Number(simResult.projected_profit).toFixed(2)}
                  </h2>
                  <p className={styles.profitNote}>
                    {Number(simResult.projected_profit) >= 0 ? "✅ Profitable" : "❌ Loss"}
                  </p>
                </div>

                {simResult.added_capacity > 0 && (
                  <div className={styles.resultCard}>
                    <p className={styles.resultLabel}>Added Capacity</p>
                    <h2 className={styles.resultValue}>
                      {simResult.added_capacity} seats
                    </h2>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noResult}>
                <p>Run a simulation to see projected results.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}