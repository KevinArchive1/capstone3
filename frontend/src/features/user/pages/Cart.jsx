import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useTable } from "../../../context/TableContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import TableModal from "../../../components/TableModal";
import dummyImg from "../../../images/dummy_image.png";
import styles from "./Cart.module.css";

function Cart() {
  const { cart, increaseQty, decreaseQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const { table } = useTable();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  function handleCheckout() {
    if (!table) {
      setShowTableModal(true);
      return;
    }
    navigate("/order/process");
  }

  if (cart.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛒</div>
        <h2>Your cart is empty</h2>
        <p>Add some items from the menu to get started.</p>
        <button className={styles.browseBtn} onClick={() => navigate("/menu")}>
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Order</h1>
        <p className={styles.sub}>
          {totalQty} item{totalQty !== 1 ? "s" : ""} in your cart
        </p>
      </div>

      {/* TABLE REQUIRED BANNER */}
      {!table && (
        <div className={styles.tableRequiredBanner}>
          <span className={styles.bannerIcon}>🪑</span>
          <div className={styles.bannerText}>
            <p className={styles.bannerTitle}>Table required to order</p>
            <p className={styles.bannerSub}>
              Scan or enter your table code before checking out
            </p>
          </div>
          <button
            className={styles.bannerBtn}
            onClick={() => setShowTableModal(true)}
          >
            Select Table
          </button>
        </div>
      )}

      <div className={styles.layout}>

        {/* LEFT — CART ITEMS */}
        <div className={styles.left}>
          {cart.map((item) => (
            <div key={item.id} className={styles.card}>

              {/* IMAGE */}
              <div className={styles.imageWrapper}>
                <img
                  src={
                    item.image
                      ? `http://localhost:8000${item.image}`
                      : dummyImg
                  }
                  alt={item.name}
                  className={styles.image}
                />
              </div>

              {/* INFO */}
              <div className={styles.info}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemPrice}>
                  ₱{Number(item.price).toFixed(2)}
                </p>
                <p className={styles.itemTotal}>
                  Subtotal: ₱{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* QTY CONTROLS */}
              <div className={styles.controls}>
                <div className={styles.qtyRow}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => decreaseQty(item.id)}
                  >
                    −
                  </button>
                  <span className={styles.qty}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => increaseQty(item.id)}
                  >
                    +
                  </button>
                </div>

                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT — SUMMARY */}
        <div className={styles.right}>
          <div className={styles.summaryCard}>

            <h3 className={styles.summaryTitle}>Order Summary</h3>

            {/* USER / TABLE INFO */}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>👤 Customer</span>
              <span className={styles.infoValue}>
                {user ? user.username : "Guest"}
              </span>
            </div>

            {table ? (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>🪑 Table</span>
                <div className={styles.tableInfo}>
                  <span className={styles.infoValue}>{table.identifier}</span>
                  <button
                    className={styles.changeTableBtn}
                    onClick={() => setShowTableModal(true)}
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.noTableRow}>
                <span className={styles.noTableText}>🪑 No table selected</span>
                <button
                  className={styles.selectTableBtn}
                  onClick={() => setShowTableModal(true)}
                >
                  Select Table
                </button>
              </div>
            )}

            <hr className={styles.divider} />

            {/* ITEMS BREAKDOWN */}
            <div className={styles.itemsBreakdown}>
              {cart.map((item) => (
                <div key={item.id} className={styles.breakdownRow}>
                  <span className={styles.breakdownName}>
                    {item.name} × {item.quantity}
                  </span>
                  <span className={styles.breakdownPrice}>
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <hr className={styles.divider} />

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>₱{total.toFixed(2)}</span>
            </div>

            {/* NOTE */}
            <div className={styles.noteBox}>
              <label className={styles.noteLabel}>Add a Note</label>
              <textarea
                className={styles.noteInput}
                placeholder='e.g. "No onions please"'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            <button
              className={`${styles.checkoutBtn} ${!table ? styles.checkoutBtnDisabled : ""}`}
              onClick={handleCheckout}
            >
              {table ? "Proceed to Checkout" : "Select Table to Continue"}
            </button>

            <button
              className={styles.continueBtn}
              onClick={() => navigate("/menu")}
            >
              + Add more items
            </button>

          </div>
        </div>

      </div>

      {showTableModal && (
        <TableModal
          onClose={() => setShowTableModal(false)}
          onSuccess={() => setShowTableModal(false)}
        />
      )}

    </div>
  );
}

export default Cart;