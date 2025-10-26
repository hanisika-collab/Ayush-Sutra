import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Doctors from "./pages/Doctors";
import Therapists from "./pages/Therapists";
import PatientRegistration from "./pages/PatientRegistration";
import PatientsList from "./pages/PatientsList";
import TherapyRooms from "./pages/TherapyRooms";
import PrescriptionAdmin from "./pages/PrescriptionAdmin";
import TherapySessions from "./pages/TherapySessions";
import ProcedureTracker from "./pages/ProcedureTracker";
import ProcedureDetails from "./pages/ProcedureDetails";
import Notifications from "./pages/Notifications"; // ✅ NEW: Import Notifications

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin / common dashboards */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/admin/doctors" element={<Doctors />} />
        <Route path="/admin/therapists" element={<Therapists />} />

        {/* Patient management */}
        <Route path="/patients/register" element={<PatientRegistration />} />
        <Route path="/patients" element={<PatientsList />} />

        {/* Therapy Rooms */}
        <Route path="/therapy-rooms" element={<TherapyRooms />} />

        {/* Therapy Sessions */}
        <Route path="/therapy-sessions" element={<TherapySessions />} />

        {/* Procedure Tracker & Details */}
        <Route path="/procedure-tracker" element={<ProcedureTracker />} />
        <Route path="/procedure-tracker/:id" element={<ProcedureTracker />} />
        <Route path="/procedure-details/:id" element={<ProcedureDetails />} />

        {/* Prescriptions */}
        <Route path="/prescriptions" element={<PrescriptionAdmin />} />

        {/* ✅ NEW: Notifications & Reminders */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Fallback */}
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;