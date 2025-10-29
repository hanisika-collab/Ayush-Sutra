// src/pages/patient/PatientProgress.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Spinner,
  Alert,
  Badge,
  ProgressBar,
  Accordion,
  Row,
  Col,
  Tab,
  Tabs,
  Table,
} from "react-bootstrap";
import {
  Calendar,
  Clock,
  Person,
  HouseDoor,
  CheckCircle,
  Circle,
  PlayCircle,
} from "react-bootstrap-icons";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import API from "../../api";

const PatientProgress = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [procedures, setProcedures] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("active");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [proceduresRes, sessionsRes] = await Promise.all([
        API.get(`/procedures?patientId=${userId}`, { headers }),
        API.get(`/therapy-sessions?patientId=${userId}`, { headers }),
      ]);

      setProcedures(proceduresRes.data || []);
      setSessions(sessionsRes.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (procedure) => {
    if (!procedure.steps || procedure.steps.length === 0) return 0;
    const completed = procedure.steps.filter((s) => s.status === "completed").length;
    return Math.round((completed / procedure.steps.length) * 100);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0)
      return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getStepIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={20} className="text-success" />;
      case "in-progress":
        return <PlayCircle size={20} className="text-warning" />;
      default:
        return <Circle size={20} className="text-secondary" />;
    }
  };

  const activeProcedures = procedures.filter((p) => p.status !== "completed");
  const completedProcedures = procedures.filter((p) => p.status === "completed");

  const calendarEvents = sessions.map((s) => ({
    id: s._id,
    title: s.therapyType || "Therapy",
    start: s.startTime,
    end: s.endTime,
    backgroundColor:
      s.status === "completed"
        ? "#198754"
        : s.status === "scheduled"
        ? "#0d6efd"
        : "#6c757d",
  }));

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
        <Header title="My Treatment Progress" />
        <Container className="py-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Progress Overview */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body>
              <h5 className="mb-3">Treatment Overview</h5>
              <Row>
                <Col md={4}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <h3 className="text-primary mb-0">{procedures.length}</h3>
                    <small className="text-muted">Total Procedures</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <h3 className="text-warning mb-0">
                      {activeProcedures.length}
                    </h3>
                    <small className="text-muted">In Progress</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <h3 className="text-success mb-0">
                      {completedProcedures.length}
                    </h3>
                    <small className="text-muted">Completed</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Procedure Details */}
          <Card className="shadow-sm border-0 rounded-4 mb-4">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="active" title={`Active (${activeProcedures.length})`}>
                  {activeProcedures.length === 0 ? (
                    <Alert variant="info">No active procedures</Alert>
                  ) : (
                    <Accordion>
                      {activeProcedures.map((proc, idx) => {
                        const progress = calculateProgress(proc);
                        return (
                          <Accordion.Item key={proc._id} eventKey={idx.toString()}>
                            <Accordion.Header>
                              <div className="w-100 d-flex justify-content-between align-items-center pe-3">
                                <div>
                                  <strong>
                                    {proc.procedureName || proc.therapyType}
                                  </strong>
                                  <br />
                                  <small className="text-muted">
                                    Therapist: {proc.therapistId?.name || "TBA"}
                                  </small>
                                </div>
                                <div style={{ width: "200px" }}>
                                  <ProgressBar
                                    now={progress}
                                    label={`${progress}%`}
                                    variant="success"
                                  />
                                </div>
                              </div>
                            </Accordion.Header>
                            <Accordion.Body>
                              {/* Procedure Info */}
                              <Row className="mb-3">
                                <Col md={6}>
                                  <div className="mb-2">
                                    <Person className="me-2" />
                                    <strong>Therapist:</strong>{" "}
                                    {proc.therapistId?.name || "Not Assigned"}
                                  </div>
                                  <div className="mb-2">
                                    <Calendar className="me-2" />
                                    <strong>Started:</strong>{" "}
                                    {new Date(proc.startTime).toLocaleDateString()}
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="mb-2">
                                    <strong>Status:</strong>{" "}
                                    <Badge
                                      bg={
                                        proc.status === "in-progress"
                                          ? "warning"
                                          : "info"
                                      }
                                    >
                                      {proc.status}
                                    </Badge>
                                  </div>
                                  <div className="mb-2">
                                    <strong>Progress:</strong> {progress}% Complete
                                  </div>
                                </Col>
                              </Row>

                              {/* Steps */}
                              <h6 className="mb-3">Treatment Steps</h6>
                              {!proc.steps || proc.steps.length === 0 ? (
                                <Alert variant="info">No steps added yet</Alert>
                              ) : (
                                <div className="list-group">
                                  {proc.steps.map((step, stepIdx) => (
                                    <div
                                      key={step._id}
                                      className="list-group-item d-flex justify-content-between align-items-start"
                                    >
                                      <div className="d-flex align-items-start gap-3">
                                        {getStepIcon(step.status)}
                                        <div>
                                          <h6 className="mb-1">
                                            Step {stepIdx + 1}: {step.stepName}
                                          </h6>
                                          {step.description && (
                                            <small className="text-muted">
                                              {step.description}
                                            </small>
                                          )}
                                          <br />
                                          {step.elapsed > 0 && (
                                            <small className="text-info">
                                              <Clock size={14} className="me-1" />
                                              Duration: {formatTime(step.elapsed)}
                                            </small>
                                          )}
                                        </div>
                                      </div>
                                      <Badge
                                        bg={
                                          step.status === "completed"
                                            ? "success"
                                            : step.status === "in-progress"
                                            ? "warning"
                                            : "secondary"
                                        }
                                      >
                                        {step.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Vitals */}
                              {proc.vitals && proc.vitals.length > 0 && (
                                <div className="mt-4">
                                  <h6 className="mb-3">Vitals Record</h6>
                                  <Table striped bordered size="sm">
                                    <thead>
                                      <tr>
                                        <th>Date & Time</th>
                                        <th>Heart Rate</th>
                                        <th>Blood Pressure</th>
                                        <th>Temperature</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {proc.vitals.slice(-5).reverse().map((v, i) => (
                                        <tr key={i}>
                                          <td>
                                            {new Date(
                                              v.recordedAt
                                            ).toLocaleString()}
                                          </td>
                                          <td>{v.heartRate || "-"}</td>
                                          <td>{v.bloodPressure || "-"}</td>
                                          <td>{v.temperature || "-"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              )}

                              {/* Notes */}
                              {proc.notes && (
                                <div className="mt-3">
                                  <strong>Notes:</strong>
                                  <p className="mb-0 text-muted">{proc.notes}</p>
                                </div>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>
                        );
                      })}
                    </Accordion>
                  )}
                </Tab>

                <Tab
                  eventKey="completed"
                  title={`Completed (${completedProcedures.length})`}
                >
                  {completedProcedures.length === 0 ? (
                    <Alert variant="info">No completed procedures yet</Alert>
                  ) : (
                    <div className="list-group">
                      {completedProcedures.map((proc) => {
                        const progress = calculateProgress(proc);
                        return (
                          <div
                            key={proc._id}
                            className="list-group-item list-group-item-action"
                          >
                            <Row className="align-items-center">
                              <Col md={6}>
                                <h6 className="mb-1">
                                  {proc.procedureName || proc.therapyType}
                                </h6>
                                <small className="text-muted">
                                  Therapist: {proc.therapistId?.name || "TBA"}
                                </small>
                              </Col>
                              <Col md={3}>
                                <small className="text-muted">
                                  Completed:{" "}
                                  {proc.endTime
                                    ? new Date(proc.endTime).toLocaleDateString()
                                    : "N/A"}
                                </small>
                              </Col>
                              <Col md={3} className="text-end">
                                <Badge bg="success">✓ Completed</Badge>
                              </Col>
                            </Row>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>

          {/* Session Calendar */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h5 className="mb-3">
                <Calendar className="me-2" />
                My Therapy Schedule
              </h5>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,listWeek",
                }}
                events={calendarEvents}
                height={600}
                eventContent={(eventInfo) => (
                  <div className="p-1">
                    <strong>{eventInfo.event.title}</strong>
                    <br />
                    <small>
                      {eventInfo.event.start.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                )}
              />
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default PatientProgress;