import axios from "axios";

// Create axios instance
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to include token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/"; // redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;
