// ayush-app/src/api.js - VERIFY THIS FILE

import axios from "axios";

// ✅ Make sure this matches your backend URL
const API = axios.create({
  baseURL: "http://localhost:4000/api", // ✅ IMPORTANT: Must match backend port
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Add request interceptor for auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Add response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error("API Error:", error.response.status, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log("Unauthorized - redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    } else if (error.request) {
      // Request made but no response
      console.error("No response from server:", error.request);
    } else {
      // Error in request setup
      console.error("Request error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;