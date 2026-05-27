import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/",
});

// Only one interceptor here — applies to ALL api files automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export default API;