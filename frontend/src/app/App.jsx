import AppRoutes from "./routes";
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from "../context/AuthContext";
import { TableProvider } from "../context/TableContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <TableProvider>
          <AppRoutes />
        </TableProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;