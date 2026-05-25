import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Kitchen fetches all orders — backend already filters to kitchen-station items only
export const getKitchenOrders = () =>
  API.get("/orders/");

// Sets kitchen_status = "preparing" on the order
export const markPreparing = (id) =>
  API.post(`/orders/${id}/kitchen_update/`, { status: "preparing" });

// Sets kitchen_status = "ready" on the order
// Note: if bar items also exist, order.status stays "preparing" until bar is ready too
// We use kitchen_status field directly in the UI to handle this correctly
export const markReady = (id) =>
  API.post(`/orders/${id}/kitchen_update/`, { status: "ready" });

export const getIngredients = () =>
  API.get("/inventory/ingredients/");

export const getMenuItems = () =>
  API.get("/menu-items/");