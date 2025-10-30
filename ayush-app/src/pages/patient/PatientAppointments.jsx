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
  Form
} from "react-bootstrap";
import {
  Calendar,
  Clock,
  X,
  Eye,
  CheckCircle,
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import API from "../../api";

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await API.get("/appointments", { headers });
      setAppointments(res.data || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!cancellationReason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.put(
        `/appointments/${selectedAppointment._id}/cancel`,
        { cancellationReason },
        { headers }
      );

      setSuccess("Appointment cancelled successfully");
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel appointment");
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

  const upcomingAppointments = appointments.filter(
    (a) =>
      ["pending", "approved"].includes(a.status) &&
      new Date(a.preferredDate) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (a) =>
      ["completed", "cancelled", "rejected"].includes(a.status) ||
      new Date(a.preferredDate) < new Date()
  );

  return (
    <div className="d-flex">
      <PatientSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Appointments" />
        <Container className="py-4">
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-2">
                    <Calendar className="me-2" />
                    My Appointments
                  </h4>
                  <p className="text-muted mb-0">
                    View and manage your appointments
                  </p>
                </div>
                <Button
                  as={Link}
                  to="/patient-book-appointment"
                  variant="success"
                >
                  <Calendar className="me-2" />
                  Book New Appointment
                </Button>
              </div>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")}>
              <CheckCircle className="me-2" />
              {success}
            </Alert>
          )}

          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Tab
                  eventKey="upcoming"
                  title={`Upcoming (${upcomingAppointments.length})`}
                >
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Calendar size={48} className="mb-3 opacity-50" />
                      <p>No upcoming appointments</p>
                      <Button
                        as={Link}
                        to="/patient-book-appointment"
                        variant="outline-success"
                      >
                        Book an Appointment
                      </Button>
                    </div>
                  ) : (
                    <Table hover responsive className="mt-3">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingAppointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>
                              {new Date(
                                appointment.preferredDate
                              ).toLocaleDateString()}
                            </td>
                            <td>{appointment.preferredTime}</td>
                            <td>{appointment.appointmentType}</td>
                            <td>{getStatusBadge(appointment.status)}</td>
                            <td>
                              {appointment.status === "pending" ||
                              appointment.status === "approved" ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelClick(appointment)
                                  }
                                >
                                  <X size={16} /> Cancel
                                </Button>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>

                <Tab
                  eventKey="past"
                  title={`Past (${pastAppointments.length})`}
                >
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="success" />
                    </div>
                  ) : pastAppointments.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <Calendar size={48} className="mb-3 opacity-50" />
                      <p>No past appointments</p>
                    </div>
                  ) : (
                    <Table hover responsive className="mt-3">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pastAppointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>
                              {new Date(
                                appointment.preferredDate
                              ).toLocaleDateString()}
                            </td>
                            <td>{appointment.preferredTime}</td>
                            <td>{appointment.appointmentType}</td>
                            <td>{getStatusBadge(appointment.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Container>

        {/* Cancel Modal */}
        <Modal
          show={showCancelModal}
          onHide={() => setShowCancelModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Cancel Appointment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Are you sure you want to cancel your appointment for{" "}
              {selectedAppointment &&
                new Date(
                  selectedAppointment.preferredDate
                ).toLocaleDateString()}
              ?
            </p>
            <Form.Group>
              <Form.Label>Reason for Cancellation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Appointment
            </Button>
            <Button variant="danger" onClick={handleCancelAppointment}>
              Yes, Cancel Appointment
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default PatientAppointments;