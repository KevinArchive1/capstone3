import API from "./api";

// Bar sees all orders where bar_status !== "not_required"
export const getBarOrders = () =>
  API.get("/orders/");

// Sets bar_status = "preparing"
export const markBarPreparing = (id) =>
  API.post(`/orders/${id}/bar_update/`, { status: "preparing" });

// Sets bar_status = "ready"
export const markBarReady = (id) =>
  API.post(`/orders/${id}/bar_update/`, { status: "ready" });

export const getIngredients = () =>
  API.get("/inventory/ingredients/");

export const getMenuItems = () =>
  API.get("/menu-items/");