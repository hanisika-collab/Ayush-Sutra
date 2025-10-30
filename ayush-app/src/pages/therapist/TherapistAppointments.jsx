// ayush-app/src/pages/therapist/TherapistAppointments.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Tabs,
  Tab,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Person,
} from "react-bootstrap-icons";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";

const TherapistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Approval form data
  const [approvalData, setApprovalData] = useState({
    confirmedDate: "",
    confirmedTime: "",
    roomId: "",
    staffNotes: "",
  });
  
  const [rejectionReason, setRejectionReason] = useState("");
  const [rooms, setRooms] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchAppointments();
    fetchRooms();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await API.get("/appointments", { headers });
      setAppointments(res.data || []);
      console.log("✅ Loaded appointments:", res.data.length);
    } catch (err) {
      console.error("❌ Fetch appointments error:", err);
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await API.get("/admin/rooms", { headers });
      setRooms(res.data || []);
    } catch (err) {
      console.warn("⚠️ Could not load rooms:", err.message);
    }
  };

  const handleApproveClick = (appointment) => {
    setSelectedAppointment(appointment);
    setApprovalData({
      confirmedDate: appointment.preferredDate.split('T')[0],
      confirmedTime: appointment.preferredTime,
      roomId: "",
      staffNotes: "",
    });
    setShowApproveModal(true);
  };

  const handleRejectClick = (appointment) => {
    setSelectedAppointment(appointment);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleDetailsClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.put(
        `/appointments/${selectedAppointment._id}/approve`,
        approvalData,
        { headers }
      );

      setSuccess("Appointment approved successfully! Patient will be notified.");
      setShowApproveModal(false);
      fetchAppointments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve appointment");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.put(
        `/appointments/${selectedAppointment._id}/reject`,
        { rejectionReason },
        { headers }
      );

      setSuccess("Appointment rejected. Patient will be notified.");
      setShowRejectModal(false);
      fetchAppointments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject appointment");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      completed: "secondary",
      cancelled: "dark",
    };
    return <Badge bg={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      urgent: "danger",
      high: "warning",
      normal: "info",
      low: "secondary",
    };
    return (
      <Badge bg={variants[priority] || "info"} className="ms-2">
        {priority}
      </Badge>
    );
  };

  const filterAppointments = (status) => {
    if (status === "pending") {
      return appointments.filter((a) => a.status === "pending");
    } else if (status === "approved") {
      return appointments.filter((a) => a.status === "approved");
    } else if (status === "past") {
      return appointments.filter((a) =>
        ["completed", "rejected", "cancelled"].includes(a.status)
      );
    }
    return appointments;
  };

  const filteredAppointments = filterAppointments(activeTab);

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Appointments" />
        <Container className="py-4">
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <Calendar className="me-2" />
                    Appointment Requests
                  </h4>
                  <p className="text-muted mb-0">
                    Review and manage patient appointment requests
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="warning" className="fs-6 px-3 py-2">
                    {filterAppointments("pending").length} Pending
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess("")}
            >
              <CheckCircle className="me-2" />
              {success}
            </Alert>
          )}

          {/* Appointments Table */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab
                  eventKey="pending"
                  title={`Pending (${filterAppointments("pending").length})`}
                >
                  {/* Content rendered below */}
                </Tab>
                <Tab
                  eventKey="approved"
                  title={`Approved (${filterAppointments("approved").length})`}
                >
                  {/* Content rendered below */}
                </Tab>
                <Tab
                  eventKey="past"
                  title={`Past (${filterAppointments("past").length})`}
                >
                  {/* Content rendered below */}
                </Tab>
              </Tabs>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2 text-muted">Loading appointments...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Calendar size={48} className="mb-3 opacity-50" />
                  <p>No {activeTab} appointments</p>
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>
                          <Calendar size={14} className="me-1 text-muted" />
                          {new Date(
                            appointment.preferredDate
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          <Clock size={14} className="me-1 text-muted" />
                          {appointment.preferredTime}
                        </td>
                        <td>
                          <div>
                            <Person size={14} className="me-1 text-muted" />
                            <strong>{appointment.patientId?.name}</strong>
                            <br />
                            <small className="text-muted">
                              {appointment.patientId?.email}
                            </small>
                          </div>
                        </td>
                        <td>
                          {appointment.therapyType || appointment.appointmentType}
                        </td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>{getPriorityBadge(appointment.priority)}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1"
                            onClick={() => handleDetailsClick(appointment)}
                          >
                            <Eye size={14} />
                          </Button>
                          {appointment.status === "pending" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-1"
                                onClick={() => handleApproveClick(appointment)}
                              >
                                <CheckCircle size={14} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRejectClick(appointment)}
                              >
                                <XCircle size={14} />
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Statistics */}
          <Row className="mt-4 g-3">
            <Col md={3}>
              <Card className="text-center shadow-sm border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-warning">{appointments.length}</h3>
                  <small className="text-muted">Total Requests</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-warning">
                    {filterAppointments("pending").length}
                  </h3>
                  <small className="text-muted">Pending</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-success">
                    {filterAppointments("approved").length}
                  </h3>
                  <small className="text-muted">Approved</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center shadow-sm border-0 rounded-4">
                <Card.Body>
                  <h3 className="text-secondary">
                    {filterAppointments("past").length}
                  </h3>
                  <small className="text-muted">Completed</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Approve Modal */}
        <Modal
          show={showApproveModal}
          onHide={() => setShowApproveModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <CheckCircle className="me-2 text-success" />
              Approve Appointment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAppointment && (
              <>
                <Alert variant="info">
                  <strong>Patient:</strong> {selectedAppointment.patientId?.name}
                  <br />
                  <strong>Requested Date:</strong>{" "}
                  {new Date(
                    selectedAppointment.preferredDate
                  ).toLocaleDateString()}{" "}
                  at {selectedAppointment.preferredTime}
                </Alert>

                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirmed Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={approvalData.confirmedDate}
                          onChange={(e) =>
                            setApprovalData({
                              ...approvalData,
                              confirmedDate: e.target.value,
                            })
                          }
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirmed Time</Form.Label>
                        <Form.Control
                          type="text"
                          value={approvalData.confirmedTime}
                          onChange={(e) =>
                            setApprovalData({
                              ...approvalData,
                              confirmedTime: e.target.value,
                            })
                          }
                          placeholder="e.g., 10:00 AM"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Room (Optional)</Form.Label>
                    <Form.Select
                      value={approvalData.roomId}
                      onChange={(e) =>
                        setApprovalData({
                          ...approvalData,
                          roomId: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map((room) => (
                        <option key={room._id} value={room._id}>
                          {room.name} - {room.type}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={approvalData.staffNotes}
                      onChange={(e) =>
                        setApprovalData({
                          ...approvalData,
                          staffNotes: e.target.value,
                        })
                      }
                      placeholder="Any special instructions or notes for the patient"
                    />
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowApproveModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove}>
              <CheckCircle className="me-2" />
              Approve Appointment
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Reject Modal */}
        <Modal
          show={showRejectModal}
          onHide={() => setShowRejectModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <XCircle className="me-2 text-danger" />
              Reject Appointment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAppointment && (
              <>
                <p>
                  Are you sure you want to reject the appointment for{" "}
                  <strong>{selectedAppointment.patientId?.name}</strong> on{" "}
                  {new Date(
                    selectedAppointment.preferredDate
                  ).toLocaleDateString()}
                  ?
                </p>
                <Form.Group>
                  <Form.Label>Reason for Rejection *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason (required)"
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              <XCircle className="me-2" />
              Reject Appointment
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Details Modal */}
        <Modal
          show={showDetailsModal}
          onHide={() => setShowDetailsModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <Eye className="me-2" />
              Appointment Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedAppointment && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Patient Information</h6>
                    <p>
                      <strong>Name:</strong>{" "}
                      {selectedAppointment.patientId?.name}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedAppointment.patientId?.email}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedAppointment.patientId?.phone || "N/A"}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Appointment Details</h6>
                    <p>
                      <strong>Type:</strong> {selectedAppointment.appointmentType}
                    </p>
                    <p>
                      <strong>Therapy:</strong>{" "}
                      {selectedAppointment.therapyType || "N/A"}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(
                        selectedAppointment.preferredDate
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedAppointment.preferredTime}
                    </p>
                    <p>
                      <strong>Priority:</strong>{" "}
                      {getPriorityBadge(selectedAppointment.priority)}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {getStatusBadge(selectedAppointment.status)}
                    </p>
                  </Col>
                </Row>

                <hr />

                <h6 className="text-muted mb-2">Medical Information</h6>
                <p>
                  <strong>Symptoms:</strong>
                  <br />
                  {selectedAppointment.symptoms}
                </p>
                {selectedAppointment.medicalHistory && (
                  <p>
                    <strong>Medical History:</strong>
                    <br />
                    {selectedAppointment.medicalHistory}
                  </p>
                )}
                {selectedAppointment.currentMedications && (
                  <p>
                    <strong>Current Medications:</strong>
                    <br />
                    {selectedAppointment.currentMedications}
                  </p>
                )}
                {selectedAppointment.allergies && (
                  <p>
                    <strong>Allergies:</strong>
                    <br />
                    {selectedAppointment.allergies}
                  </p>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default TherapistAppointments;