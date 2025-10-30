// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Doctors from "./pages/Doctors";
import Therapists from "./pages/Therapists";
import PatientRegistration from "./pages/PatientRegistration";
import PatientsList from "./pages/PatientsList";
import TherapyRooms from "./pages/TherapyRooms";
import TherapySessions from "./pages/TherapySessions";
import ProcedureTracker from "./pages/ProcedureTracker";
import Notifications from "./pages/Notifications";
// import PrescriptionAdmin from "./pages/PrescriptionAdmin";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProgress from "./pages/patient/PatientProgress";
import PatientNotifications from "./pages/patient/PatientNotifications";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";

// Doctor/Therapist Pages
import TherapistDashboard from "./pages/therapist/TherapistDashboard";
import TherapistPatients from "./pages/therapist/TherapistPatients";
import TherapistProcedures from "./pages/therapist/TherapistProcedures";
import TherapyInfoPage from "./pages/patient/TherapyInfoPage";
import TherapistPrescriptions from './pages/therapist/TherapistPrescriptions';
import TherapistPatientRegistration from './pages/therapist/TherapistPatientRegistration';
// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to appropriate dashboard based on role
    switch (role) {
      case "admin":
        return <Navigate to="/dashboard" replace />;
      case "doctor":
      case "therapist":
        return <Navigate to="/therapist-dashboard" replace />;
      case "patient":
        return <Navigate to="/patient-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Doctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapists"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Therapists />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-registration"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <PatientRegistration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "therapist"]}>
              <PatientsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapy-rooms"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TherapyRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapy-sessions"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "therapist"]}>
              <TherapySessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procedure-tracker/:id?"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor", "therapist"]}>
              <ProcedureTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/prescriptions"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <PrescriptionAdmin />
            </ProtectedRoute>
          }
        /> */}

        {/* Doctor/Therapist Routes */}
        <Route
          path="/therapist-dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor", "therapist"]}>
              <TherapistDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist-patients"
          element={
            <ProtectedRoute allowedRoles={["doctor", "therapist"]}>
              <TherapistPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/therapist-procedures"
          element={
            <ProtectedRoute allowedRoles={["doctor", "therapist"]}>
              <TherapistProcedures />
            </ProtectedRoute>
          }
        />

        {/* Patient Routes */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-progress"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-notifications"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient-prescriptions"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientPrescriptions />
            </ProtectedRoute>
          }
        />
        <Route path="/patient-therapies" element={<TherapyInfoPage />} />
        <Route path="/prescriptions" element={<TherapistPrescriptions />} />
        <Route
          path="/therapist-patient-registration"
          element={
            <ProtectedRoute allowedRoles={["doctor", "therapist"]}>
              <TherapistPatientRegistration />
            </ProtectedRoute>
          }
        />
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;