// src/components/TherapistSidebar.jsx - WITH APPOINTMENTS
import React from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  House,
  People,
  Activity,
  Calendar,
  CalendarCheck,
  FileText,
  PersonPlus,
  List,
  BoxArrowRight,
} from "react-bootstrap-icons";

const TherapistSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Base menu items for therapist/doctor
  const baseMenuItems = [
    {
      path: "/therapist-dashboard",
      icon: <House size={18} />,
      label: "Dashboard",
    },
    // ✅ NEW: Appointments link
    {
      path: "/therapist-appointments",
      icon: <CalendarCheck size={18} />,
      label: "Appointments",
    },
    {
      path: "/therapist-patients",
      icon: <People size={18} />,
      label: "My Patients",
    },
    {
      path: "/therapist-procedures",
      icon: <Activity size={18} />,
      label: "Procedures",
    },
    {
      path: "/therapy-sessions",
      icon: <Calendar size={18} />,
      label: "Sessions",
    },
    {
      path: "/patients",
      icon: <List size={18} />,
      label: "All Patients",
    },
    {
      path: "/therapist-patient-registration",
      icon: <PersonPlus size={18} />,
      label: "Register Patient",
    },
  ];

  // Prescription item for both doctors and therapists
  const prescriptionItem = {
    path: "/prescriptions",
    icon: <FileText size={18} />,
    label: "Prescriptions",
  };

  const doctorOnlyItems = [
    {
      path: "/patient-registration",
      icon: <PersonPlus size={18} />,
      label: "Register Patient",
    },
  ];

  // Build menu items based on role
  let menuItems = [...baseMenuItems, prescriptionItem];
  
  if (role === "doctor") {
    menuItems = [...menuItems, ...doctorOnlyItems];
  }

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
        <small className="text-light">
          {role === "doctor" ? "Doctor" : "Therapist"} Dashboard
        </small>
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

export default TherapistSidebar;