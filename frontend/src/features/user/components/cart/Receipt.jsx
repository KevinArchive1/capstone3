import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrder } from "../../../../services/orderApi";

function Receipt() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(id)
      .then(res => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#555" }}>
      Loading receipt...
    </div>
  );

  if (!order) return (
    <div style={{ padding: "40px", textAlign: "center", color: "#555" }}>
      <h2>Order not found</h2>
      <p>Please check the order number or try again later.</p>
    </div>
  );

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ff7a00",
      padding: "24px 16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        background: "#ffffff",
        maxWidth: "420px",
        margin: "0 auto",
        borderRadius: "16px",
        padding: "28px 24px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        color: "#222",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#ff7a00", fontWeight: 800 }}>
            Burp & Blends
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "0.95rem", color: "#555" }}>
            115 Sto Cristo, Sampaloc Santo Cristo, Sariaya
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#777" }}>
            {orderDate}
          </p>
        </div>

        {/* Receipt info */}
        <div style={{ textAlign: "center", marginBottom: "20px", fontSize: "0.95rem", color: "#444" }}>
          <strong>Receipt No:</strong> {order.receipt_number}
        </div>

        {/* Items */}
        <div style={{ margin: "24px 0" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: 600,
            paddingBottom: "8px",
            borderBottom: "2px dashed #ccc",
            marginBottom: "12px",
          }}>
            <span>Item</span>
            <span>Qty × Price</span>
            <span>Amount</span>
          </div>

          {order.items.map(item => (
            <div key={item.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              margin: "12px 0",
              fontSize: "0.98rem",
            }}>
              <div style={{ flex: 1 }}>{item.item_name}</div>
              <div style={{ minWidth: "110px", textAlign: "center" }}>
                {item.quantity} × ₱{item.unit_price}
              </div>
              <div style={{ fontWeight: 600, minWidth: "80px", textAlign: "right" }}>
                ₱{(item.unit_price * item.quantity).toFixed(0)}
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ borderTop: "2px dashed #aaa", paddingTop: "16px", marginTop: "16px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "1.2rem",
            fontWeight: 700,
            color: "#ff7a00",
          }}>
            <span>Total</span>
            <span>₱{Number(order.total_amount).toFixed(2)}</span>
          </div>

          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#888" }}>
            <span>Payment Status</span>
            <span style={{
              background: order.status === "paid" ? "#28a745" : "#ff7a00",
              color: "white",
              padding: "2px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
            }}>
              {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "32px", color: "#555", fontSize: "0.95rem" }}>
          <p style={{ margin: "0 0 8px" }}>*** THANK YOU FOR YOUR ORDER ***</p>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>Please come again! 🍔</p>
        </div>

      </div>
    </div>
  );
}

export default Receipt;