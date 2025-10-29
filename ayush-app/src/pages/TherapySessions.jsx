import React, { useState, useEffect } from "react";
import { Container, Card, Spinner, Alert, Form, Button, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

// FullCalendar imports
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import { useNavigate } from "react-router-dom";

// Status colors for events
const statusColors = {
  scheduled: "#0d6efd",
  ongoing: "#fd7e14",
  completed: "#198754",
  cancelled: "#dc3545",
};

const TherapySessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    patientId: "",
    therapistId: "",
    roomId: "",
    therapyType: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Missing authentication token");
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // ✅ FIXED: Changed from /procedures to /therapy-sessions
      const [sessionsRes, patientsRes, therapistsRes, roomsRes] = await Promise.all([
        API.get("/therapy-sessions", { headers }),
        API.get("/admin/users?role=patient", { headers }),
        API.get("/admin/users?role=therapist", { headers }),
        API.get("/admin/rooms", { headers }),
      ]);

      console.log("📋 Fetched sessions:", sessionsRes.data); // Debug log
      console.log("👥 Fetched patients:", patientsRes.data); // Debug log

      setSessions(sessionsRes.data || []);
      setPatients(patientsRes.data || []);
      setTherapists(therapistsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

// Replace your handleSubmit function with this updated version

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  try {
    const token = localStorage.getItem("token");
    if (!token) return setError("Missing authentication token");

    const headers = { Authorization: `Bearer ${token}` };
    
    // ✅ Step 1: Create the therapy session
    const response = await API.post("/therapy-sessions", form, { headers });
    console.log("✅ Created session:", response.data);

    // ✅ Step 2: Create a ProcedureSession for tracking
    await API.post("/procedures", {
      patientId: form.patientId,
      therapistId: form.therapistId,
      therapyType: form.therapyType,
      procedureName: form.therapyType,
      notes: form.notes,
    }, { headers });

    // ✅ Step 3: CREATE PRE-THERAPY NOTIFICATION (THIS WAS MISSING!)
    try {
      await API.post("/notifications/pre-therapy", {
        sessionId: response.data._id  // Use the newly created session ID
      }, { headers });
      console.log("✅ Pre-therapy notification created");
    } catch (notifErr) {
      console.warn("⚠️ Failed to create notification:", notifErr);
      // Don't fail the entire operation if notification fails
    }

    // ✅ Reset form
    setForm({
      patientId: "",
      therapistId: "",
      roomId: "",
      therapyType: "",
      startTime: "",
      endTime: "",
      notes: "",
    });

    setSuccess("Therapy session created successfully! Notification sent to patient.");
    fetchData(); // Refresh the calendar
  } catch (err) {
    console.error("❌ Error creating session:", err);
    setError(err.response?.data?.error || "Failed to create session");
  }
};

  const handleViewDetails = (sessionId) => {
    navigate(`/procedure-tracker/${sessionId}`);
  };

  const handleEventClick = (info) => {
    const sessionId = info.event.id;
    handleViewDetails(sessionId);
  };

  if (loading) return <Spinner animation="border" className="m-5" />;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh", marginLeft: "250px" }}>
        <Header title="Therapy Sessions" />
        <Container className="py-4">

          {/* ---------------- Create Session Form ---------------- */}
          <Card className="p-4 mb-4 shadow-sm rounded">
            <h5>Create Therapy Session</h5>
            {success && <Alert variant="success" dismissible onClose={() => setSuccess("")}>{success}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              {/* Patient */}
              <Form.Group className="mb-2">
                <Form.Label>Patient</Form.Label>
                <Form.Select name="patientId" value={form.patientId} onChange={handleChange} required>
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Form.Select>
              </Form.Group>

              {/* Therapist */}
              <Form.Group className="mb-2">
                <Form.Label>Therapist</Form.Label>
                <Form.Select name="therapistId" value={form.therapistId} onChange={handleChange} required>
                  <option value="">Select Therapist</option>
                  {therapists.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </Form.Select>
              </Form.Group>

              {/* Room */}
              <Form.Group className="mb-2">
                <Form.Label>Room</Form.Label>
                <Form.Select name="roomId" value={form.roomId} onChange={handleChange}>
                  <option value="">Select Room (Optional)</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </Form.Select>
              </Form.Group>

              {/* Therapy Type */}
              <Form.Group className="mb-2">
                <Form.Label>Therapy Type</Form.Label>
                <Form.Select name="therapyType" value={form.therapyType} onChange={handleChange} required>
                  <option value="">Select Therapy</option>
                  <option value="Abhyanga">Abhyanga</option>
                  <option value="Swedana">Swedana</option>
                  <option value="Pizhichil">Pizhichil</option>
                  <option value="Shirodhara">Shirodhara</option>
                  <option value="Udvartana">Udvartana</option>
                  <option value="Nasya">Nasya</option>
                  <option value="Virechana">Virechana</option>
                  <option value="Basti">Basti</option>
                </Form.Select>
              </Form.Group>

              {/* Start / End Time */}
              <Form.Group className="mb-2">
                <Form.Label>Start Time</Form.Label>
                <Form.Control type="datetime-local" name="startTime" value={form.startTime} onChange={handleChange} required />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>End Time</Form.Label>
                <Form.Control type="datetime-local" name="endTime" value={form.endTime} onChange={handleChange} required />
              </Form.Group>

              {/* Notes */}
              <Form.Group className="mb-2">
                <Form.Label>Notes</Form.Label>
                <Form.Control as="textarea" rows={2} name="notes" value={form.notes} onChange={handleChange} />
              </Form.Group>

              <Button type="submit" className="mt-2" variant="success">Schedule Session</Button>
            </Form>
          </Card>

          {/* ---------------- Calendar ---------------- */}
          <Card className="p-4 shadow-sm rounded">
            <h5 className="mb-3">Sessions Calendar</h5>
            {sessions.length === 0 && !loading && (
              <Alert variant="info">No therapy sessions scheduled yet. Create one above!</Alert>
            )}
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
              }}
              events={sessions.map(s => {
                console.log("📅 Mapping session:", s); // Debug log
                return {
                  id: s._id,
                  title: s.therapyType || "Therapy",
                  start: s.startTime,
                  end: s.endTime,
                  extendedProps: {
                    patient: s.patientId?.name || "Unknown Patient",
                    therapist: s.therapistId?.name || "Unknown Therapist",
                    room: s.roomId?.name || "No Room",
                    status: s.status || "scheduled",
                    notes: s.notes || ""
                  },
                  backgroundColor: statusColors[s.status] || "#6c757d",
                  borderColor: statusColors[s.status] || "#6c757d",
                };
              })}
              eventContent={(eventInfo) => (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      <strong>Patient:</strong> {eventInfo.event.extendedProps.patient}<br/>
                      <strong>Therapist:</strong> {eventInfo.event.extendedProps.therapist}<br/>
                      <strong>Room:</strong> {eventInfo.event.extendedProps.room}<br/>
                      <strong>Notes:</strong> {eventInfo.event.extendedProps.notes || "N/A"}
                    </Tooltip>
                  }
                >
                  <div style={{
                    padding: "5px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                  onClick={() => handleViewDetails(eventInfo.event.id)}
                  >
                    <strong>{eventInfo.event.title}</strong>
                    <div>{eventInfo.event.extendedProps.patient}</div>
                    <Badge bg={
                      eventInfo.event.extendedProps.status === "scheduled" ? "primary" :
                      eventInfo.event.extendedProps.status === "ongoing" ? "warning" :
                      eventInfo.event.extendedProps.status === "completed" ? "success" :
                      "danger"
                    } style={{ fontSize: "0.7rem" }}>
                      {eventInfo.event.extendedProps.status}
                    </Badge>
                  </div>
                </OverlayTrigger>
              )}
              eventClick={handleEventClick}
              height={650}
              nowIndicator={true}
              editable={false}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
            />
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapySessions;