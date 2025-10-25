import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ListGroup, Button } from "react-bootstrap";
import { BarChart, People, House, PersonPlus, BoxArrowRight, Calendar3, ClipboardCheck } from "react-bootstrap-icons";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: <BarChart /> },
    { path: "/patients/register", label: "Register Patient", icon: <PersonPlus /> },
    { path: "/patients", label: "Patients List", icon: <People /> },
    { path: "/therapy-rooms", label: "Therapy Rooms", icon: <House /> },
    { path: "/therapy-sessions", label: "Therapy Sessions", icon: <Calendar3 /> },
    { path: "/procedure-tracker", label: "Procedure Tracker", icon: <ClipboardCheck /> },
  ];

  const logout = () => {
    localStorage.removeItem("token");
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
      }}
    >
      <h4 className="fw-bold mb-4 text-center">🌿 AyurSutra</h4>
      <ListGroup variant="flush">
        {menuItems.map((item) => (
          <ListGroup.Item
            key={item.path}
            as={Link}
            to={item.path}
            className={`bg-transparent border-0 text-white d-flex align-items-center mb-2 rounded-2 px-2 py-2 ${
              location.pathname === item.path ? "bg-success" : ""
            }`}
            style={{ textDecoration: "none", transition: "0.2s" }}
          >
            <span className="me-2">{item.icon}</span> {item.label}
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="mt-auto">
        <Button variant="outline-light" className="w-100 rounded-pill mt-4" onClick={logout}>
          <BoxArrowRight className="me-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
