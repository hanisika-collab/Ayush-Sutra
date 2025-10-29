// ayush-app/src/components/Header.jsx - FIXED VERSION
import React from "react";
import { Navbar } from "react-bootstrap";

const Header = ({ title }) => {
  // Get user data from localStorage
  const getUserName = () => {
    try {
      const storedUser = localStorage.getItem("user");
      const role = localStorage.getItem("role");
      const userName = localStorage.getItem("userName");
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return {
          name: user.name || userName || "User",
          role: user.role || role || "user"
        };
      }
      
      return {
        name: userName || "User",
        role: role || "user"
      };
    } catch (err) {
      console.error("Error parsing user:", err);
      return {
        name: localStorage.getItem("userName") || "User",
        role: localStorage.getItem("role") || "user"
      };
    }
  };

  const { name, role } = getUserName();

  // Format name based on role
  const getDisplayName = () => {
    switch (role) {
      case "admin":
        return `Admin`;
      case "doctor":
        return `Dr. ${name}`;
      case "therapist":
        return `${name}`;
      case "patient":
        return `${name}`;
      default:
        return name;
    }
  };

  // Get greeting icon based on role
  const getGreetingIcon = () => {
    switch (role) {
      case "admin":
        return "👑";
      case "doctor":
        return "👨‍⚕️";
      case "therapist":
        return "🧘";
      case "patient":
        return "🌱";
      default:
        return "👋";
    }
  };

  return (
    <Navbar
      bg="white"
      className="shadow-sm px-4 py-3 d-flex justify-content-between"
    >
      <h5 className="m-0 fw-semibold text-success">{title}</h5>
      <span className="text-muted small">
        Welcome back, <b>{getDisplayName()}</b> {getGreetingIcon()}
      </span>
    </Navbar>
  );
};

export default Header;