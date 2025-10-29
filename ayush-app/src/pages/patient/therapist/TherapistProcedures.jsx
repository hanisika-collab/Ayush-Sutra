// src/pages/therapist/TherapistProcedures.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Spinner,
  Alert,
  Badge,
  ProgressBar,
  Button,
  Tab,
  Tabs,
  Row,
  Col,
} from "react-bootstrap";
import { Activity, PlayCircle, CheckCircle, Clock } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";

const TherapistProcedures = () => {
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  useEffect(() => {
    fetchMyProcedures();
  }, []);

  const fetchMyProcedures = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all procedures
      const res = await API.get("/procedures", { headers });
      const allProcedures = res.data || [];

      // Filter procedures assigned to this therapist
      const myProcedures = allProcedures.filter(
        (p) => p.therapistId?._id === userId || p.therapistId === userId
      );

      console.log("🧘 My procedures:", myProcedures);
      setProcedures(myProcedures);
    } catch (err) {
      console.error("❌ Fetch procedures error:", err);
      setError(err.response?.data?.error || "Failed to fetch procedures");
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
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const activeProcedures = procedures.filter((p) => p.status !== "completed");
  const completedProcedures = procedures.filter((p) => p.status === "completed");

  const handleContinue = (procedureId) => {
    navigate(`/procedure-tracker/${procedureId}`);
  };

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Procedures" />
        <Container className="py-4">
          {/* Header Section */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <Activity className="me-2" />
                    Treatment Procedures
                  </h4>
                  <p className="text-muted mb-0">
                    Manage and track all your assigned therapy procedures
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="warning" className="fs-6 px-3 py-2 me-2">
                    {activeProcedures.length} Active
                  </Badge>
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    {completedProcedures.length} Completed
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Statistics */}
          <Row className="mb-4 g-3">
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="text-center">
                  <Activity size={28} className="text-primary mb-2" />
                  <h3 className="text-primary mb-0">{procedures.length}</h3>
                  <small className="text-muted">Total Procedures</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="text-center">
                  <PlayCircle size={28} className="text-warning mb-2" />
                  <h3 className="text-warning mb-0">{activeProcedures.length}</h3>
                  <small className="text-muted">In Progress</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 h-100">
                <Card.Body className="text-center">
                  <CheckCircle size={28} className="text-success mb-2" />
                  <h3 className="text-success mb-0">
                    {completedProcedures.length}
                  </h3>
                  <small className="text-muted">Completed</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Procedures List */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab
                  eventKey="active"
                  title={`Active (${activeProcedures.length})`}
                >
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                      <p className="mt-2 text-muted">Loading procedures...</p>
                    </div>
                  ) : activeProcedures.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Activity size={48} className="mb-3 opacity-50" />
                      <p>No active procedures</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {activeProcedures.map((proc) => {
                        const progress = calculateProgress(proc);
                        const totalTime = proc.steps?.reduce(
                          (sum, s) => sum + (s.elapsed || 0),
                          0
                        );
                        return (
                          <div key={proc._id} className="col-md-6">
                            <Card className="h-100 border shadow-sm">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h5 className="mb-1">
                                      {proc.procedureName || proc.therapyType}
                                    </h5>
                                    <small className="text-muted">
                                      Patient: {proc.patientId?.name || "Unknown"}
                                    </small>
                                  </div>
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

                                <div className="mb-3">
                                  <div className="d-flex justify-content-between mb-1">
                                    <small className="text-muted">Progress</small>
                                    <small className="text-muted">
                                      {progress}%
                                    </small>
                                  </div>
                                  <ProgressBar
                                    now={progress}
                                    variant="success"
                                    style={{ height: "8px" }}
                                  />
                                </div>

                                <Row className="g-2 mb-3">
                                  <Col xs={6}>
                                    <div className="p-2 bg-light rounded">
                                      <small className="text-muted d-block">
                                        Steps
                                      </small>
                                      <strong>
                                        {
                                          proc.steps?.filter(
                                            (s) => s.status === "completed"
                                          ).length
                                        }{" "}
                                        / {proc.steps?.length || 0}
                                      </strong>
                                    </div>
                                  </Col>
                                  <Col xs={6}>
                                    <div className="p-2 bg-light rounded">
                                      <small className="text-muted d-block">
                                        <Clock size={12} /> Time
                                      </small>
                                      <strong>
                                        {formatTime(totalTime || 0)}
                                      </strong>
                                    </div>
                                  </Col>
                                </Row>

                                <div className="mb-3">
                                  <small className="text-muted d-block mb-1">
                                    Started:
                                  </small>
                                  <small>
                                    {new Date(proc.startTime).toLocaleDateString()}{" "}
                                    {new Date(proc.startTime).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </small>
                                </div>

                                <Button
                                  variant="success"
                                  className="w-100"
                                  onClick={() => handleContinue(proc._id)}
                                >
                                  <PlayCircle className="me-2" />
                                  Continue Procedure
                                </Button>
                              </Card.Body>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Tab>

                <Tab
                  eventKey="completed"
                  title={`Completed (${completedProcedures.length})`}
                >
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                      <p className="mt-2 text-muted">Loading procedures...</p>
                    </div>
                  ) : completedProcedures.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <CheckCircle size={48} className="mb-3 opacity-50" />
                      <p>No completed procedures yet</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {completedProcedures.map((proc) => {
                        const progress = calculateProgress(proc);
                        const totalTime = proc.steps?.reduce(
                          (sum, s) => sum + (s.elapsed || 0),
                          0
                        );
                        return (
                          <div key={proc._id} className="col-md-6">
                            <Card className="h-100 border-success shadow-sm">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                  <div>
                                    <h5 className="mb-1">
                                      {proc.procedureName || proc.therapyType}
                                    </h5>
                                    <small className="text-muted">
                                      Patient: {proc.patientId?.name || "Unknown"}
                                    </small>
                                  </div>
                                  <Badge bg="success">
                                    <CheckCircle className="me-1" />
                                    Completed
                                  </Badge>
                                </div>

                                <Row className="g-2 mb-3">
                                  <Col xs={6}>
                                    <div className="p-2 bg-light rounded">
                                      <small className="text-muted d-block">
                                        Steps
                                      </small>
                                      <strong>{proc.steps?.length || 0}</strong>
                                    </div>
                                  </Col>
                                  <Col xs={6}>
                                    <div className="p-2 bg-light rounded">
                                      <small className="text-muted d-block">
                                        <Clock size={12} /> Duration
                                      </small>
                                      <strong>
                                        {formatTime(totalTime || 0)}
                                      </strong>
                                    </div>
                                  </Col>
                                </Row>

                                <div className="mb-2">
                                  <small className="text-muted d-block">
                                    Completed:
                                  </small>
                                  <small>
                                    {proc.endTime
                                      ? new Date(proc.endTime).toLocaleDateString()
                                      : "N/A"}
                                  </small>
                                </div>

                                <Button
                                  variant="outline-success"
                                  className="w-100"
                                  onClick={() => handleContinue(proc._id)}
                                >
                                  View Details
                                </Button>
                              </Card.Body>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapistProcedures;