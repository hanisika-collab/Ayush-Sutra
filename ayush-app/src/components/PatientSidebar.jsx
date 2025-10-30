// src/components/PatientSidebar.jsx
import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  House,
  Activity,
  Bell,
  FileText,
  Calendar,
  BoxArrowRight,
  PlusCircle,
} from "react-bootstrap-icons";

const PatientSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      path: "/patient-dashboard",
      icon: <House size={18} />,
      label: "Dashboard",
    },
    {
      path: "/patient-progress",
      icon: <Activity size={18} />,
      label: "My Progress",
    },
    {
      path: "/patient-notifications",
      icon: <Bell size={18} />,
      label: "Notifications",
    },
    {
      path: "/patient-prescriptions",
      icon: <FileText size={18} />,
      label: "Prescriptions",
    },
    {
  path: "/patient-therapies",
  icon: <FileText size={18} />,
  label: "Therapy Info",
},// Add to menuItems array
{
  path: "/patient-appointments",
  icon: <Calendar size={18} />,
  label: "My Appointments",
},
{
  path: "/patient-book-appointment",
  icon: <PlusCircle size={18} />,
  label: "Book Appointment",
}
  ];

  return (
    <div
      className="bg-success text-white d-flex flex-column"
      style={{
        width: "250px",
        minHeight: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <div className="p-4 border-bottom border-light">
        <h4 className="mb-0">🌿 Ayush Portal</h4>
        <small className="text-light">Patient Dashboard</small>
      </div>

      {/* Navigation */}
      <Nav className="flex-column flex-grow-1 p-3">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={`text-white d-flex align-items-center gap-2 py-3 px-3 rounded mb-1 ${
              isActive(item.path) ? "bg-white bg-opacity-25" : ""
            }`}
            style={{
              textDecoration: "none",
              fontWeight: isActive(item.path) ? "bold" : "normal",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Nav.Link>
        ))}
      </Nav>

      {/* Logout Button */}
      <div className="p-3 border-top border-light">
        <Nav.Link
          onClick={handleLogout}
          className="text-white d-flex align-items-center gap-2 py-2 px-3 rounded"
          style={{
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <BoxArrowRight size={18} />
          <span>Logout</span>
        </Nav.Link>
      </div>
    </div>
  );
};

export default PatientSidebar;