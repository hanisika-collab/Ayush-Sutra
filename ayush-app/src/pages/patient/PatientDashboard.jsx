// src/pages/patient/PatientDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Badge,
  ProgressBar,
  Button,
} from "react-bootstrap";
import {
  // Calendar
  // ,
  Calendar,
  Bell,
  Activity,
  FileText,
  Person,
  Clock,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import API from "../../api";

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    upcomingSessions: 0,
    completedSessions: 0,
    activeProcedures: 0,
    unreadNotifications: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [activeProcedures, setActiveProcedures] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all data in parallel
      const [sessionsRes, proceduresRes, notificationsRes] = await Promise.all([
        API.get(`/therapy-sessions?patientId=${userId}`, { headers }),
        API.get(`/procedures?patientId=${userId}`, { headers }),
        API.get(`/notifications/user/${userId}`, { headers }),
      ]);

      const sessions = sessionsRes.data || [];
      const procedures = proceduresRes.data || [];
      const notifications = notificationsRes.data.notifications || [];

      // Filter upcoming sessions (scheduled status and future dates)
      const now = new Date();
      const upcoming = sessions.filter(
        (s) => s.status === "scheduled" && new Date(s.startTime) > now
      );

      // Filter completed sessions
      const completed = sessions.filter((s) => s.status === "completed");

      // Filter active procedures (not completed)
      const active = procedures.filter((p) => p.status !== "completed");

      // Unread notifications
      const unread = notifications.filter((n) => n.status !== "read");

      setStats({
        upcomingSessions: upcoming.length,
        completedSessions: completed.length,
        activeProcedures: active.length,
        unreadNotifications: unread.length,
      });

      setUpcomingSessions(upcoming.slice(0, 3)); // Show top 3
      setActiveProcedures(active.slice(0, 3)); // Show top 3
      setRecentNotifications(notifications.slice(0, 5)); // Show top 5
    } catch (err) {
      console.error("❌ Dashboard fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (procedure) => {
    if (!procedure.steps || procedure.steps.length === 0) return 0;
    const completed = procedure.steps.filter((s) => s.status === "completed").length;
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
      <PatientSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title={`Welcome, ${currentUser.name || "Patient"}`} />
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
                <Calendar size={28} color="#0d6efd" className="mx-auto" />
                <h5 className="mt-2">Upcoming Sessions</h5>
                <h3 className="fw-bold text-primary">
                  {stats.upcomingSessions}
                </h3>
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
                <FileText size={28} color="#6c757d" className="mx-auto" />
                <h5 className="mt-2">Completed</h5>
                <h3 className="fw-bold text-secondary">
                  {stats.completedSessions}
                </h3>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <Bell size={28} color="#dc3545" className="mx-auto" />
                <h5 className="mt-2">Notifications</h5>
                <h3 className="fw-bold text-danger">
                  {stats.unreadNotifications}
                </h3>
              </Card>
            </Col>
          </Row>

          {/* Upcoming Sessions */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <Calendar className="me-2" />
                  Upcoming Therapy Sessions
                </h5>
                <Button
                  as={Link}
                  to="/patient-progress"
                  variant="outline-primary"
                  size="sm"
                >
                  View All →
                </Button>
              </div>

              {upcomingSessions.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No upcoming sessions scheduled
                </Alert>
              ) : (
                <div className="list-group list-group-flush">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h6 className="mb-1">{session.therapyType}</h6>
                        <small className="text-muted">
                          <Clock size={14} className="me-1" />
                          {new Date(session.startTime).toLocaleString()}
                        </small>
                        <br />
                        <small className="text-muted">
                          <Person size={14} className="me-1" />
                          Therapist: {session.therapistId?.name || "TBA"}
                        </small>
                      </div>
                      <Badge bg="primary">Scheduled</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Active Procedures */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <Activity className="me-2" />
                  Active Treatment Progress
                </h5>
                <Button
                  as={Link}
                  to="/patient-progress"
                  variant="outline-success"
                  size="sm"
                >
                  View Details →
                </Button>
              </div>

              {activeProcedures.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No active procedures at the moment
                </Alert>
              ) : (
                activeProcedures.map((proc) => {
                  const progress = calculateProgress(proc);
                  return (
                    <Card key={proc._id} className="mb-3 border">
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col md={6}>
                            <h6 className="mb-1">
                              {proc.procedureName || proc.therapyType}
                            </h6>
                            <small className="text-muted">
                              Therapist: {proc.therapistId?.name || "TBA"}
                            </small>
                            <br />
                            <small className="text-muted">
                              Started: {new Date(proc.startTime).toLocaleDateString()}
                            </small>
                          </Col>
                          <Col md={4}>
                            <div className="mb-2">
                              <small className="text-muted">Progress</small>
                              <ProgressBar
                                now={progress}
                                label={`${progress}%`}
                                variant="success"
                                style={{ height: "25px" }}
                              />
                            </div>
                          </Col>
                          <Col md={2} className="text-end">
                            <Badge
                              bg={
                                proc.status === "in-progress"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {proc.status}
                            </Badge>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  );
                })
              )}
            </Card.Body>
          </Card>

          {/* Recent Notifications */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <Bell className="me-2" />
                  Recent Notifications
                </h5>
                <Button
                  as={Link}
                  to="/patient-notifications"
                  variant="outline-danger"
                  size="sm"
                >
                  View All →
                </Button>
              </div>

              {recentNotifications.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  No notifications
                </Alert>
              ) : (
                <div className="list-group list-group-flush">
                  {recentNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`list-group-item ${
                        notif.status !== "read" ? "bg-light" : ""
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {notif.title}
                            {notif.status !== "read" && (
                              <Badge bg="danger" className="ms-2">
                                New
                              </Badge>
                            )}
                          </h6>
                          <p className="mb-1 small text-muted">
                            {notif.message}
                          </p>
                          <small className="text-muted">
                            {new Date(notif.createdAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default PatientDashboard;