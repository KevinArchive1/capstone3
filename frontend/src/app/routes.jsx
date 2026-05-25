import { BrowserRouter, Routes, Route } from "react-router-dom";
import EntryGuard from "../components/EntryGuard";
import PublicRoute from "../components/PublicRoute";

import UserLayout from "../features/user/components/layout/UserLayout";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";

import KitchenPage from "../features/kitchen/pages/KitchenPage";

import AdminLayout from "../features/admin/components/layout/AdminLayout";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminProducts from "../features/admin/pages/AdminProducts";
import AdminStock from "../features/admin/pages/AdminStock";
import AdminReports from "../features/admin/pages/AdminReports";

import StaffLayout from "../features/staff/components/layout/StaffLayout";
import StaffDashboard from "../features/staff/pages/StaffDashboard";
import QRRequest from "../features/staff/pages/QRRequest";
import StaffTables from "../features/staff/pages/StaffTables";
import ReadyToServe from "../features/staff/pages/ReadyToServe";

import KitchenLayout from "../features/kitchen/components/layout/KitchenLayout";
import KitchenDashboard from "../features/kitchen/pages/KitchenDashboard";
import KitchenOrders from "../features/kitchen/pages/KitchenOrders";
import KitchenOrderHistory from "../features/kitchen/pages/KitchenOrderHistory";
import InventoryAlerts from "../features/kitchen/pages/InventoryAlerts";
import MenuReference from "../features/kitchen/pages/MenuReference";

import CashierLayout from "../features/cashier/components/layout/CashierLayout";
import CashierDashboard from "../features/cashier/pages/CashierDashboard";
import CashierOrders_payFirst from "../features/cashier/pages/CashierOrders_payFirst";
import CashierOrderHistory from "../features/cashier/pages/CashierOrderHistory";

import Home from "../features/user/pages/Home";

import Menu from "../features/user/pages/Menu";


import Cart from "../features/user/pages/Cart";
import OrderProcess from "../features/user/pages/OrderProcess";
import Receipt from "../features/user/components/cart/Receipt";

import ProtectedRoute from "../components/ProtectedRoute";
import OrderHistory from "../features/user/pages/OrderHistory"; 

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route
          path="/start"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* 👤 USER APP */}
        <Route
          element={
            <EntryGuard>
              <UserLayout />
            </EntryGuard>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />

          <Route path="/cart" element={<Cart />} />

          <Route path="/order/process" element={<OrderProcess />} />
          <Route path="/order/process/:id" element={<OrderProcess />} />
          <Route path="/order/:id/receipt" element={<Receipt />} />

          <Route
            path="/account/history"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 👨‍💼 ADMIN (OUTSIDE!) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="stock" element={<AdminStock />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* 👷 STAFF */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffDashboard />} />
          <Route path="qr-requests" element={<QRRequest />} />
          <Route path="tables" element={<StaffTables />} />
          <Route path="ready" element={<ReadyToServe />} />
        </Route>

        {/* 👨‍🍳 KITCHEN */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <KitchenLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<KitchenDashboard />} />
          <Route path="orders" element={<KitchenOrders />} />
          <Route path="history" element={<KitchenOrderHistory />} />
          <Route path="inventory" element={<InventoryAlerts />} />
          <Route path="menu" element={<MenuReference />} />
        </Route>

        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <CashierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CashierDashboard />} />
          <Route path="orders" element={<CashierOrders_payFirst />} />
          <Route path="history" element={<CashierOrderHistory />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}