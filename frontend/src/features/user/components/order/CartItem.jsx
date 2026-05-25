import { useCart } from "../../context/CartContext";

function CartItem({ item }) {
  const { removeFromCart } = useCart();

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
      <h3>{item.name}</h3>
      <p>₱{item.price}</p>
      <p>Qty: {item.quantity}</p>

      <button onClick={() => removeFromCart(item.id)}>
        Remove
      </button>
    </div>
  );
}

export default CartItem;