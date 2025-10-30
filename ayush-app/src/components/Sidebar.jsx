// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ListGroup, Button, Badge } from "react-bootstrap";
import { 
  BarChart, 
  People, 
  House, 
  PersonPlus, 
  BoxArrowRight, 
  Calendar3, 
  ClipboardCheck,
  Bell // ✅ NEW: Bell icon for notifications
} from "react-bootstrap-icons";
import API from "../api";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0); // ✅ NEW: Unread notification count

  // ✅ NEW: Get current user
  const getCurrentUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Error parsing user:", err);
      return null;
    }
  };

  const user = getCurrentUser();

  // ✅ NEW: Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      if (!user || (!user._id && !user.id)) return;

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const userId = user._id || user.id;
      const res = await API.get(`/notifications/user/${userId}`, { headers });
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Silently fail - notification feature might not be set up yet
      console.log("Notification count unavailable:", err.message);
    }
  };

  // ✅ NEW: Fetch on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // ✅ NEW: Refresh notification count every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <BarChart /> },
    { path: "/therapist-patient-registration", label: "Register Patient", icon: <PersonPlus /> },
    { path: "/patients", label: "Patients List", icon: <People /> },
    { path: "/therapy-rooms", label: "Therapy Rooms", icon: <House /> },
    { path: "/therapy-sessions", label: "Therapy Sessions", icon: <Calendar3 /> },
    { path: "/procedure-tracker", label: "Procedure Tracker", icon: <ClipboardCheck /> },
    // {path: "/prescriptions", label: "Prescriptions", icon: <ClipboardCheck />},
    { 
      path: "/notifications", 
      label: "Notifications", 
      icon: <Bell />,
      badge: unreadCount // ✅ NEW: Show unread count
    },
    { 
      path: "/appointments", 
      label: "Appointments", 
      icon: <Calendar3 /> 
    },
  ];

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div
      className="d-flex flex-column text-white p-3"
      style={{
        height: "100vh",
        width: "250px",
        background: "linear-gradient(180deg, #198754 0%, #146c43 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        overflowY: "auto",
        zIndex: 1000
      }}
    >
      <h4 className="fw-bold mb-4 text-center">🌿 AyurSutra</h4>
      <ListGroup variant="flush">
        {menuItems.map((item) => (
          <ListGroup.Item
            key={item.path}
            as={Link}
            to={item.path}
            className={`bg-transparent border-0 text-white d-flex align-items-center justify-content-between mb-2 rounded-2 px-3 py-2 ${
              location.pathname === item.path ? "bg-success bg-opacity-75" : ""
            }`}
            style={{ 
              textDecoration: "none", 
              transition: "0.2s",
              position: "relative"
            }}
          >
            <span className="d-flex align-items-center">
              <span className="me-2">{item.icon}</span> 
              <span>{item.label}</span>
            </span>
            
            {/* ✅ NEW: Show badge for notifications */}
            {item.badge && item.badge > 0 && (
              <Badge 
                bg="danger" 
                pill
                style={{ fontSize: "0.7rem" }}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="mt-auto">
        <Button 
          variant="outline-light" 
          className="w-100 rounded-pill mt-4" 
          onClick={logout}
        >
          <BoxArrowRight className="me-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;