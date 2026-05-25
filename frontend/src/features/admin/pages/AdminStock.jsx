import { useEffect, useState } from "react";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  getBatches,
  createBatch,
} from "../../../services/adminApi";
import styles from "./AdminStock.module.css";

const emptyIngredientForm = { name: "", unit: "g", reorder_level: "" };
const emptyBatchForm = { ingredient: "", quantity_added: "", unit_cost: "", expiration_date: "" };

export default function AdminStock() {
  const [ingredients, setIngredients] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [search, setSearch] = useState("");

  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [savingIngredient, setSavingIngredient] = useState(false);

  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [ingRes, batchRes] = await Promise.all([
        getIngredients(),
        getBatches(),
      ]);
      setIngredients(ingRes.data);
      setBatches(batchRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getStockStatus(ingredient) {
    const qty = parseFloat(ingredient.available_quantity);
    const reorder = parseFloat(ingredient.reorder_level);
    if (qty <= 0) return "out";
    if (qty <= reorder) return "low";
    return "ok";
  }

  // INGREDIENT HANDLERS
  function handleEditIngredient(ing) {
    setEditingIngredient(ing);
    setIngredientForm({
      name: ing.name,
      unit: ing.unit,
      reorder_level: ing.reorder_level,
    });
    setShowIngredientForm(true);
  }

  async function handleSaveIngredient() {
    if (!ingredientForm.name || !ingredientForm.unit) {
      alert("Name and unit are required.");
      return;
    }
    setSavingIngredient(true);
    try {
      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, ingredientForm);
      } else {
        await createIngredient(ingredientForm);
      }
      setShowIngredientForm(false);
      setEditingIngredient(null);
      setIngredientForm(emptyIngredientForm);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed to save ingredient.");
    } finally {
      setSavingIngredient(false);
    }
  }

  // BATCH HANDLERS
  async function handleSaveBatch() {
    if (!batchForm.ingredient || !batchForm.quantity_added || !batchForm.unit_cost || !batchForm.expiration_date) {
      alert("All batch fields are required.");
      return;
    }
    setSavingBatch(true);
    try {
      await createBatch(batchForm);
      setShowBatchForm(false);
      setBatchForm(emptyBatchForm);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed to add batch.");
    } finally {
      setSavingBatch(false);
    }
  }

  const filteredIngredients = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBatches = batches.filter(b =>
    b.ingredient_name?.toLowerCase().includes(search.toLowerCase()) ||
    ingredients.find(i => i.id === b.ingredient)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = ingredients.filter(i => getStockStatus(i) !== "ok");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading stock...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Stock Management</h1>
          <p className={styles.sub}>Manage ingredients and inventory batches</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>{today}</span>
          <div className={styles.headerBtns}>
            <button
              className={styles.addBtn}
              onClick={() => {
                setEditingIngredient(null);
                setIngredientForm(emptyIngredientForm);
                setShowIngredientForm(true);
              }}
            >
              + Add Ingredient
            </button>
            <button
              className={styles.addBatchBtn}
              onClick={() => {
                setBatchForm(emptyBatchForm);
                setShowBatchForm(true);
              }}
            >
              + Add Stock
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Ingredients</p>
          <h2 className={styles.summaryValue}>{ingredients.length}</h2>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Low / Out of Stock</p>
          <h2 className={styles.summaryValue} style={{ color: "#e53e3e" }}>
            {lowStock.length}
          </h2>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Batches</p>
          <h2 className={styles.summaryValue}>{batches.length}</h2>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={activeTab === "ingredients" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("ingredients")}
        >
          Ingredients
        </button>
        <button
          className={activeTab === "batches" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("batches")}
        >
          Stock Batches
        </button>
      </div>

      {/* SEARCH */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* INGREDIENTS TABLE */}
      {activeTab === "ingredients" && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th>Available</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map(ing => {
                const status = getStockStatus(ing);
                return (
                  <tr key={ing.id}>
                    <td className={styles.nameCol}>{ing.name}</td>
                    <td>{ing.unit}</td>
                    <td className={styles.qtyCol}>
                      <span style={{
                        color: status === "out" ? "#e53e3e" : status === "low" ? "#f59e0b" : "#28a745",
                        fontWeight: 700,
                      }}>
                        {ing.available_quantity}
                      </span>
                    </td>
                    <td>{ing.reorder_level}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "Sufficient"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEditIngredient(ing)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.empty}>No ingredients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BATCHES TABLE */}
      {activeTab === "batches" && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Added</th>
                <th>Remaining</th>
                <th>Unit Cost</th>
                <th>Expiration</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map(batch => {
                const ing = ingredients.find(i => i.id === batch.ingredient);
                const isExpired = new Date(batch.expiration_date) < new Date();
                const isExpiringSoon = !isExpired && new Date(batch.expiration_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={batch.id}>
                    <td className={styles.nameCol}>{ing?.name || "—"}</td>
                    <td>{batch.quantity_added} {ing?.unit}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: parseFloat(batch.quantity_remaining) <= 0 ? "#e53e3e" : "#28a745" }}>
                        {batch.quantity_remaining} {ing?.unit}
                      </span>
                    </td>
                    <td>₱{Number(batch.unit_cost).toFixed(2)}</td>
                    <td>
                      <span style={{
                        color: isExpired ? "#e53e3e" : isExpiringSoon ? "#f59e0b" : "#333",
                        fontWeight: isExpired || isExpiringSoon ? 600 : 400,
                      }}>
                        {new Date(batch.expiration_date).toLocaleDateString("en-PH", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                        {isExpired && " ⚠️ Expired"}
                        {isExpiringSoon && " ⚠️ Soon"}
                      </span>
                    </td>
                    <td>{batch.source || "—"}</td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.empty}>No batches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INGREDIENT FORM MODAL */}
      {showIngredientForm && (
        <div className={styles.overlay} onClick={() => setShowIngredientForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingIngredient ? "Edit Ingredient" : "Add Ingredient"}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowIngredientForm(false)}>✕</button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Name *</label>
              <input
                className={styles.input}
                value={ingredientForm.name}
                onChange={e => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                placeholder="Ingredient name"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unit *</label>
              <select
                className={styles.input}
                value={ingredientForm.unit}
                onChange={e => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
              >
                <option value="g">Gram (g)</option>
                <option value="ml">Milliliter (ml)</option>
                <option value="pc">Piece (pc)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Reorder Level</label>
              <input
                className={styles.input}
                type="number"
                value={ingredientForm.reorder_level}
                onChange={e => setIngredientForm({ ...ingredientForm, reorder_level: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowIngredientForm(false)}>
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSaveIngredient}
                disabled={savingIngredient}
              >
                {savingIngredient ? "Saving..." : editingIngredient ? "Save Changes" : "Add Ingredient"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH FORM MODAL */}
      {showBatchForm && (
        <div className={styles.overlay} onClick={() => setShowBatchForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Stock Batch</h3>
              <button className={styles.closeBtn} onClick={() => setShowBatchForm(false)}>✕</button>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ingredient *</label>
              <select
                className={styles.input}
                value={batchForm.ingredient}
                onChange={e => setBatchForm({ ...batchForm, ingredient: e.target.value })}
              >
                <option value="">Select ingredient</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Quantity Added *</label>
              <input
                className={styles.input}
                type="number"
                value={batchForm.quantity_added}
                onChange={e => setBatchForm({ ...batchForm, quantity_added: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Unit Cost (₱) *</label>
              <input
                className={styles.input}
                type="number"
                value={batchForm.unit_cost}
                onChange={e => setBatchForm({ ...batchForm, unit_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Expiration Date *</label>
              <input
                className={styles.input}
                type="date"
                value={batchForm.expiration_date}
                onChange={e => setBatchForm({ ...batchForm, expiration_date: e.target.value })}
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowBatchForm(false)}>
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSaveBatch}
                disabled={savingBatch}
              >
                {savingBatch ? "Saving..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}