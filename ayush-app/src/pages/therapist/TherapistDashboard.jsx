// src/pages/therapist/TherapistDashboard.jsx - WITH APPOINTMENTS
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Badge,
  Button,
  Table,
} from "react-bootstrap";
import {
  People,
  Activity,
  Calendar,
  CheckCircle,
  ClockHistory,
  CalendarCheck,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";

const TherapistDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeProcedures: 0,
    todaySessions: 0,
    completedToday: 0,
    pendingAppointments: 0, // ✅ NEW
    approvedAppointments: 0, // ✅ NEW
  });
  const [todaySessions, setTodaySessions] = useState([]);
  const [activeProcedures, setActiveProcedures] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]); // ✅ NEW

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // ✅ Fetch sessions, procedures, AND appointments
      const [sessionsRes, proceduresRes, appointmentsRes] = await Promise.all([
        API.get(`/therapy-sessions`, { headers }),
        API.get(`/procedures`, { headers }),
        API.get(`/appointments`, { headers }), // ✅ NEW
      ]);

      const allSessions = sessionsRes.data || [];
      const allProcedures = proceduresRes.data || [];
      const allAppointments = appointmentsRes.data || []; // ✅ NEW

      // Filter by therapist
      const mySessions = allSessions.filter(
        (s) => s.therapistId?._id === userId || s.therapistId === userId
      );
      const myProcedures = allProcedures.filter(
        (p) => p.therapistId?._id === userId || p.therapistId === userId
      );
      
      // ✅ NEW: My appointments (already filtered by backend)
      const myAppointments = allAppointments;

      // Today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysSessionsList = mySessions.filter((s) => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= today && sessionDate < tomorrow;
      });

      // Active procedures
      const activeProcsList = myProcedures.filter(
        (p) => p.status !== "completed"
      );

      // Completed today
      const completedToday = todaysSessionsList.filter(
        (s) => s.status === "completed"
      ).length;

      // ✅ NEW: Pending and approved appointments
      const pending = myAppointments.filter((a) => a.status === "pending");
      const approved = myAppointments.filter((a) => a.status === "approved");

      // Unique patients
      const uniquePatients = new Set(
        mySessions.map((s) => s.patientId?._id || s.patientId)
      );

      setStats({
        totalPatients: uniquePatients.size,
        activeProcedures: activeProcsList.length,
        todaySessions: todaysSessionsList.length,
        completedToday: completedToday,
        pendingAppointments: pending.length, // ✅ NEW
        approvedAppointments: approved.length, // ✅ NEW
      });

      setTodaySessions(todaysSessionsList);
      setActiveProcedures(activeProcsList.slice(0, 5)); // Top 5
      setPendingAppointments(pending.slice(0, 5)); // ✅ NEW: Top 5 pending
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (procedure) => {
    if (!procedure.steps || procedure.steps.length === 0) return 0;
    const completed = procedure.steps.filter((s) => s.status === "completed")
      .length;
    return Math.round((completed / procedure.steps.length) * 100);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header
          title={`Welcome, ${userRole === "doctor" ? "Dr." : ""} ${
            currentUser.name || "Therapist"
          }`}
        />
        <Container className="py-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <People size={28} color="#0d6efd" className="mx-auto" />
                <h5 className="mt-2">My Patients</h5>
                <h3 className="fw-bold text-primary">{stats.totalPatients}</h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <Activity size={28} color="#198754" className="mx-auto" />
                <h5 className="mt-2">Active Procedures</h5>
                <h3 className="fw-bold text-success">
                  {stats.activeProcedures}
                </h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <Calendar size={28} color="#fd7e14" className="mx-auto" />
                <h5 className="mt-2">Today's Sessions</h5>
                <h3 className="fw-bold text-warning">{stats.todaySessions}</h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <CheckCircle size={28} color="#6c757d" className="mx-auto" />
                <h5 className="mt-2">Completed Today</h5>
                <h3 className="fw-bold text-secondary">
                  {stats.completedToday}
                </h3>
              </Card>
            </Col>
          </Row>

          {/* ✅ NEW: Appointments Stats Row */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3 border-warning border-2">
                <CalendarCheck size={28} color="#ffc107" className="mx-auto" />
                <h5 className="mt-2">Pending Appointments</h5>
                <h3 className="fw-bold text-warning">
                  {stats.pendingAppointments}
                </h3>
                <Button
                  as={Link}
                  to="/therapist-appointments"
                  variant="outline-warning"
                  size="sm"
                  className="mt-2"
                >
                  Review Now →
                </Button>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3 border-success border-2">
                <CalendarCheck size={28} color="#198754" className="mx-auto" />
                <h5 className="mt-2">Approved Appointments</h5>
                <h3 className="fw-bold text-success">
                  {stats.approvedAppointments}
                </h3>
                <Button
                  as={Link}
                  to="/therapist-appointments"
                  variant="outline-success"
                  size="sm"
                  className="mt-2"
                >
                  View All →
                </Button>
              </Card>
            </Col>
          </Row>

          {/* ✅ NEW: Pending Appointments Section */}
          {pendingAppointments.length > 0 && (
            <Card className="shadow-sm border-0 rounded-4 mb-4 border-warning border-2">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 text-warning">
                    <CalendarCheck className="me-2" />
                    Pending Appointment Requests
                  </h5>
                  <Button
                    as={Link}
                    to="/therapist-appointments"
                    variant="outline-warning"
                    size="sm"
                  >
                    View All →
                  </Button>
                </div>

                <Table hover responsive className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>
                          {new Date(appointment.preferredDate).toLocaleDateString()}
                        </td>
                        <td>{appointment.preferredTime}</td>
                        <td>{appointment.patientId?.name || "Unknown"}</td>
                        <td>
                          {appointment.therapyType || appointment.appointmentType}
                        </td>
                        <td>
                          <Badge
                            bg={
                              appointment.priority === "urgent"
                                ? "danger"
                                : appointment.priority === "high"
                                ? "warning"
                                : "info"
                            }
                          >
                            {appointment.priority}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            as={Link}
                            to="/therapist-appointments"
                            variant="outline-success"
                            size="sm"
                          >
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Today's Sessions */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <Calendar className="me-2" />
                  Today's Schedule
                </h5>
                <Button
                  as={Link}
                  to="/therapy-sessions"
                  variant="outline-primary"
                  size="sm"
                >
                  View All Sessions →
                </Button>
              </div>

              {todaySessions.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No sessions scheduled for today
                </Alert>
              ) : (
                <Table hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Therapy Type</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySessions.map((session) => (
                      <tr key={session._id}>
                        <td>
                          <ClockHistory size={14} className="me-1" />
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td>{session.patientId?.name || "Unknown Patient"}</td>
                        <td>{session.therapyType}</td>
                        <td>{session.roomId?.name || "No Room"}</td>
                        <td>
                          <Badge
                            bg={
                              session.status === "completed"
                                ? "success"
                                : session.status === "ongoing"
                                ? "warning"
                                : "primary"
                            }
                          >
                            {session.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            as={Link}
                            to={`/procedure-tracker/${session._id}`}
                            variant="outline-success"
                            size="sm"
                          >
                            Track
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Active Procedures */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <Activity className="me-2" />
                  Active Treatment Procedures
                </h5>
                <Button
                  as={Link}
                  to="/therapist-procedures"
                  variant="outline-success"
                  size="sm"
                >
                  View All →
                </Button>
              </div>

              {activeProcedures.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No active procedures at the moment
                </Alert>
              ) : (
                <Table hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Procedure</th>
                      <th>Started</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProcedures.map((proc) => {
                      const progress = calculateProgress(proc);
                      return (
                        <tr key={proc._id}>
                          <td>{proc.patientId?.name || "Unknown Patient"}</td>
                          <td>{proc.procedureName || proc.therapyType}</td>
                          <td>
                            {new Date(proc.startTime).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ width: "100px" }}>
                              <div className="progress" style={{ height: "20px" }}>
                                <div
                                  className="progress-bar bg-success"
                                  role="progressbar"
                                  style={{ width: `${progress}%` }}
                                  aria-valuenow={progress}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                >
                                  {progress}%
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Badge
                              bg={
                                proc.status === "in-progress"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {proc.status}
                            </Badge>
                          </td>
                          <td>
                            <Button
                              as={Link}
                              to={`/procedure-tracker/${proc._id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              Continue
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapistDashboard;