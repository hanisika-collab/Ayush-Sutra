// src/pages/therapist/TherapistPatients.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Spinner,
  Alert,
  Table,
  Badge,
  Button,
  Form,
  InputGroup,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import {
  People,
  Search,
  Eye,
  Calendar,
  Activity,
  Person,
  Telephone,
  Envelope,
  PersonPlus,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";
import { Link } from "react-router-dom";
const TherapistPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all sessions and procedures to find patients
      const [sessionsRes, proceduresRes] = await Promise.all([
        API.get("/therapy-sessions", { headers }),
        API.get("/procedures", { headers }),
      ]);

      const sessions = sessionsRes.data || [];
      const procedures = proceduresRes.data || [];

      // Filter sessions assigned to this therapist
      const mySessions = sessions.filter(
        (s) => s.therapistId?._id === userId || s.therapistId === userId
      );

      // Filter procedures assigned to this therapist
      const myProcedures = procedures.filter(
        (p) => p.therapistId?._id === userId || p.therapistId === userId
      );

      // Extract unique patients
      const patientMap = new Map();

      mySessions.forEach((session) => {
        const patient = session.patientId;
        if (patient && patient._id) {
          if (!patientMap.has(patient._id)) {
            patientMap.set(patient._id, {
              ...patient,
              sessions: [],
              procedures: [],
            });
          }
          patientMap.get(patient._id).sessions.push(session);
        }
      });

      myProcedures.forEach((procedure) => {
        const patient = procedure.patientId;
        if (patient && patient._id) {
          if (!patientMap.has(patient._id)) {
            patientMap.set(patient._id, {
              ...patient,
              sessions: [],
              procedures: [],
            });
          }
          patientMap.get(patient._id).procedures.push(procedure);
        }
      });

      const patientsList = Array.from(patientMap.values());
      console.log("👥 My patients:", patientsList);

      setPatients(patientsList);
      setFilteredPatients(patientsList);
    } catch (err) {
      console.error("❌ Fetch patients error:", err);
      setError(err.response?.data?.error || "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const getActiveProcedures = (patient) => {
    return patient.procedures?.filter((p) => p.status !== "completed").length || 0;
  };

  const getUpcomingSessions = (patient) => {
    const now = new Date();
    return (
      patient.sessions?.filter(
        (s) => s.status === "scheduled" && new Date(s.startTime) > now
      ).length || 0
    );
  };

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Patients" />
        <Container className="py-4">
          {/* Header Section */}
        <Card className="mb-4 shadow-sm border-0 rounded-4">
                    <Card.Body>
                      <Row className="align-items-center">
                        <Col md={6}>
                          <h4 className="mb-2">
                            <People className="me-2" />
                            Patients Under My Care
                          </h4>
                          <p className="text-muted mb-0">
                            View and manage patients assigned to you
                          </p>
                        </Col>
                        <Col md={6} className="text-end">
                          {/* ✅ NEW: Add Patient Registration Button */}
                          <Button
                            as={Link}
                            to="/therapist-patient-registration"
                            variant="success"
                            className="me-2"
                          >
                            <PersonPlus className="me-2" />
                            Register New Patient
                          </Button>
                          <Badge bg="primary" className="fs-6 px-3 py-2">
                            {filteredPatients.length} Patient
                            {filteredPatients.length !== 1 ? "s" : ""}
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

          {/* Search Bar */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="lg"
                />
              </InputGroup>
            </Card.Body>
          </Card>

          {/* Patients Table */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2 text-muted">Loading patients...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <People size={48} className="mb-3 opacity-50" />
                  <p>
                    {patients.length === 0
                      ? "No patients assigned yet"
                      : "No patients match your search"}
                  </p>
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Patient Name</th>
                      <th>Contact</th>
                      <th>Active Procedures</th>
                      <th>Upcoming Sessions</th>
                      <th>Total Sessions</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient, index) => (
                      <tr key={patient._id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <Person size={20} className="text-success" />
                            </div>
                            <div>
                              <strong>{patient.name}</strong>
                              <br />
                              <small className="text-muted">
                                {patient.role || "Patient"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {patient.email && (
                            <>
                              <Envelope size={14} className="me-1 text-muted" />
                              {patient.email}
                              <br />
                            </>
                          )}
                          {patient.phone && (
                            <>
                              <Telephone size={14} className="me-1 text-muted" />
                              {patient.phone}
                            </>
                          )}
                        </td>
                        <td>
                          <Badge bg="warning" className="px-3">
                            {getActiveProcedures(patient)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="primary" className="px-3">
                            {getUpcomingSessions(patient)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="secondary" className="px-3">
                            {patient.sessions?.length || 0}
                          </Badge>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleViewDetails(patient)}
                            className="me-1"
                          >
                            <Eye size={16} /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Patient Details Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <Person className="me-2" />
              Patient Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatient && (
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Personal Information</h6>
                    <div className="mb-2">
                      <strong>Name:</strong> {selectedPatient.name}
                    </div>
                    <div className="mb-2">
                      <strong>Email:</strong> {selectedPatient.email || "N/A"}
                    </div>
                    <div className="mb-2">
                      <strong>Phone:</strong> {selectedPatient.phone || "N/A"}
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Treatment Summary</h6>
                    <div className="mb-2">
                      <Activity className="me-2 text-success" />
                      <strong>Active Procedures:</strong>{" "}
                      {getActiveProcedures(selectedPatient)}
                    </div>
                    <div className="mb-2">
                      <Calendar className="me-2 text-primary" />
                      <strong>Upcoming Sessions:</strong>{" "}
                      {getUpcomingSessions(selectedPatient)}
                    </div>
                    <div className="mb-2">
                      <strong>Total Sessions:</strong>{" "}
                      {selectedPatient.sessions?.length || 0}
                    </div>
                  </Col>
                </Row>

                <hr />

                {/* Recent Sessions */}
                <h6 className="text-muted mb-3">Recent Sessions</h6>
                {selectedPatient.sessions?.length === 0 ? (
                  <p className="text-muted">No sessions recorded</p>
                ) : (
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Therapy Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatient.sessions?.slice(0, 5).map((session) => (
                        <tr key={session._id}>
                          <td>
                            {new Date(session.startTime).toLocaleDateString()}
                          </td>
                          <td>{session.therapyType}</td>
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
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default TherapistPatients;