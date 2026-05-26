import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

// 🔐 token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// 🍔 CUSTOMER MENU
export const getMenu = () =>
  API.get("/menu-items/?audience=customer");

// 📂 Categories
export const getCategories = () =>
  API.get("/categories/");

// 🎵 Playlist
export const getPlaylists = () =>
  API.get("/order-playlists/");

export const createPlaylist = (data) =>
  API.post("/order-playlists/", data);