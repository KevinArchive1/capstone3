import { useParams } from "react-router-dom";
import { useOrder } from "../context/OrderContext";

function OrderDetails() {
  const { id } = useParams();
  const { orders } = useOrder();

  const order = orders.find(o => o.id === id);

  if (!order) return <p>Order not found</p>;

  return (
    <div>
      <h2>Receipt</h2>

      {order.items.map(item => (
        <div key={item.id}>
          {item.name} x{item.quantity}
        </div>
      ))}

      <h3>Total: ₱{order.total}</h3>
    </div>
  );
}

export default OrderDetails;