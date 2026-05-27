import API from "./api";

// DASHBOARD
export const getDashboard = (range = "daily") =>
  API.get(`/analytics/dashboard/?range=${range}`);

// ORDERS
export const getAdminOrders = () =>
  API.get("/orders/");
// MENU
export const getAdminCategories = () =>
  API.get("/categories/");

export const getAdminMenuItems = () =>
  API.get("/menu-items/");

export const createMenuItem = (data) =>
  API.post("/menu-items/", data);

export const updateMenuItem = (id, data) =>
  API.patch(`/menu-items/${id}/`, data);

export const deleteMenuItem = (id) =>
  API.delete(`/menu-items/${id}/`);

// STOCK
export const getIngredients = () =>
  API.get("/inventory/ingredients/");

export const createIngredient = (data) =>
  API.post("/inventory/ingredients/", data);

export const updateIngredient = (id, data) =>
  API.patch(`/inventory/ingredients/${id}/`, data);

export const getBatches = () =>
  API.get("/inventory/batches/");

export const createBatch = (data) =>
  API.post("/inventory/batches/", data);

// REPORTS
// Get list — from GeneratedReportViewSet
export const getReports = () =>
  API.get("/analytics/generated-reports/");

export const generateReport = (data) =>
  API.post("/analytics/reports/", data);

export const runSimulation = (data) =>
  API.post("/analytics/simulate/", data);