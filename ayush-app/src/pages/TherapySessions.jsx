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

import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate

// Status colors for events
const statusColors = {
  scheduled: "#0d6efd",
  ongoing: "#fd7e14",
  completed: "#198754",
  cancelled: "#dc3545",
};

const TherapySessions = () => {
  const navigate = useNavigate(); // ✅ Initialize navigation
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
      const [sessionsRes, patientsRes, therapistsRes, roomsRes] = await Promise.all([
        API.get("/procedures", { headers }),
        API.get("/admin/users?role=patient", { headers }),
        API.get("/admin/users?role=therapist", { headers }),
        API.get("/admin/rooms", { headers }),
      ]);

      setSessions(sessionsRes.data);
      setPatients(patientsRes.data);
      setTherapists(therapistsRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("Missing authentication token");

      const headers = { Authorization: `Bearer ${token}` };
      await API.post("/procedures", form, { headers });

      setForm({
        patientId: "",
        therapistId: "",
        roomId: "",
        therapyType: "",
        startTime: "",
        endTime: "",
        notes: "",
      });

      setSuccess("Therapy session created successfully!");
      fetchData();
    } catch (err) {
      console.error("Error creating session:", err);
      setError(err.response?.data?.error || "Failed to create session");
    }
  };

  // ✅ New: Navigate to ProcedureTracker page
  const handleViewDetails = (sessionId) => {
    navigate(`/procedure-tracker/${sessionId}`);
  };

  // ✅ FullCalendar event click also navigates
  const handleEventClick = (info) => {
    const sessionId = info.event.id;
    handleViewDetails(sessionId);
  };

  if (loading) return <Spinner animation="border" className="m-5" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh", marginLeft: "250px" }}>
        <Header title="Therapy Sessions" />
        <Container className="py-4">

          {/* ---------------- Create Session Form ---------------- */}
          <Card className="p-4 mb-4 shadow-sm rounded">
            <h5>Create Therapy Session</h5>
            {success && <Alert variant="success">{success}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}
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
                <Form.Select name="roomId" value={form.roomId} onChange={handleChange} required>
                  <option value="">Select Room</option>
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
                <Form.Control type="text" name="notes" value={form.notes} onChange={handleChange} />
              </Form.Group>

              <Button type="submit" className="mt-2">Schedule</Button>
            </Form>
          </Card>

          {/* ---------------- Calendar ---------------- */}
          <Card className="p-4 shadow-sm rounded">
            <h5>Sessions Calendar</h5>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
              }}
              events={sessions.map(s => ({
                id: s._id,
                title: s.therapyType,
                start: s.startTime,
                end: s.endTime,
                extendedProps: {
                  patient: s.patientId?.name,
                  therapist: s.therapistId?.name,
                  room: s.roomId?.name,
                  status: s.status,
                  notes: s.notes
                },
                backgroundColor: statusColors[s.status] || "#6c757d",
                borderColor: statusColors[s.status] || "#6c757d",
              }))}
              eventContent={(eventInfo) => (
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Patient: {eventInfo.event.extendedProps.patient}<br/>
                      Therapist: {eventInfo.event.extendedProps.therapist}<br/>
                      Room: {eventInfo.event.extendedProps.room}<br/>
                      Notes: {eventInfo.event.extendedProps.notes || "N/A"}
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
                  onClick={() => handleViewDetails(eventInfo.event.id)} // ✅ Clickable card
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
            />
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapySessions;
