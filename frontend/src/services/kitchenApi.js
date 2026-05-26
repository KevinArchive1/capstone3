import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// Kitchen sees orders with status "waiting" or "preparing" or "ready"
// kitchen_status !== "not_required"
export const getKitchenOrders = () =>
  API.get("/orders/");

// Sets kitchen_status = "preparing"
export const markPreparing = (id) =>
  API.post(`/orders/${id}/kitchen_update/`, { status: "preparing" });

// Sets kitchen_status = "ready"
export const markReady = (id) =>
  API.post(`/orders/${id}/kitchen_update/`, { status: "ready" });

export const getIngredients = () =>
  API.get("/inventory/ingredients/");

export const getMenuItems = () =>
  API.get("/menu-items/");