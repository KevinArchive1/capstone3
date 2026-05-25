import { useCart } from "../../../../context/CartContext";
import { useNavigate } from "react-router-dom";

function OrderSummary() {
  const { total } = useCart();
  const navigate = useNavigate();

  return (
    <div style={{ border: "1px solid #ccc", padding: "20px" }}>
      <h2>Order Summary</h2>

      <p>Total: ₱{total}</p>

      <button onClick={() => navigate("/checkout")}>
        Proceed to Checkout
      </button>
    </div>
  );
}

export default OrderSummary;