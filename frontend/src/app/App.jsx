import AppRoutes from "./routes";
import { CartProvider } from "../context/CartContext";
import { OrderProvider } from "../context/OrderContext";
import { AuthProvider } from "../context/AuthContext";
import { TableProvider } from "../context/TableContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <TableProvider>
            <AppRoutes />
          </TableProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;