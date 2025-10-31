import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Tabs,
  Tab,
  Row,
  Col,
} from 'react-bootstrap';
import {
  Calendar,
  Person,
  Check,
  X,
  Eye,
  Search,
} from 'react-bootstrap-icons';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API from '../api';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Form states
  const [assignForm, setAssignForm] = useState({
    assignedTo: '',
    assignedDate: '',
    assignedTime: '',
    roomId: '',
    adminNotes: ''
  });
  
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // ✅ FIXED: Fetch all appointments (admin sees all)
      const [appointmentsRes, doctorsRes, therapistsRes, roomsRes] = await Promise.all([
        API.get('/appointments', { headers }), // No filter - admin sees all
        API.get('/admin/users?role=doctor', { headers }),
        API.get('/admin/users?role=therapist', { headers }),
        API.get('/admin/rooms', { headers })
      ]);

      console.log('✅ Fetched appointments:', appointmentsRes.data);
      setAppointments(appointmentsRes.data || []);
      setDoctors(doctorsRes.data || []);
      setTherapists(therapistsRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (appointment) => {
    setSelectedAppointment(appointment);
    setAssignForm({
      assignedTo: appointment.doctorId?._id || appointment.therapistId?._id || '',
      assignedDate: appointment.preferredDate?.split('T')[0] || '',
      assignedTime: appointment.preferredTime || '',
      roomId: appointment.roomId?._id || '',
      adminNotes: ''
    });
    setShowAssignModal(true);
  };

  const handleApprove = async () => {
    try {
      if (!assignForm.assignedTo || !assignForm.assignedDate || !assignForm.assignedTime) {
        setError('Please fill in all required fields');
        return;
      }

      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // ✅ FIXED: Use the correct endpoint for admin approval
      await API.put(
        `/appointments/${selectedAppointment._id}/approve`,
        {
          confirmedDate: assignForm.assignedDate,
          confirmedTime: assignForm.assignedTime,
          roomId: assignForm.roomId,
          staffNotes: assignForm.adminNotes
        },
        { headers }
      );

      setSuccess('Appointment approved and assigned successfully!');
      setShowAssignModal(false);
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Approve error:', err);
      setError(err.response?.data?.error || 'Failed to approve appointment');
    }
  };

  const handleReject = async (appointment, reason) => {
    if (!reason) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await API.put(
        `/appointments/${appointment._id}/reject`,
        { rejectionReason: reason },
        { headers }
      );

      setSuccess('Appointment rejected successfully');
      fetchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Reject error:', err);
      setError(err.response?.data?.error || 'Failed to reject appointment');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      completed: 'secondary',
      cancelled: 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: 'secondary',
      normal: 'primary',
      high: 'warning',
      urgent: 'danger'
    };
    return <Badge bg={variants[priority] || 'primary'}>{priority}</Badge>;
  };

  const filterAppointments = (status) => {
    let filtered = appointments.filter(a => {
      if (status === 'all') return true;
      return a.status === status;
    });

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const pendingAppointments = filterAppointments('pending');
  const approvedAppointments = filterAppointments('approved');
  const rejectedAppointments = filterAppointments('rejected');

  if (loading) {
    return (
      <div className="d-flex">
        <Sidebar />
        <div
          className="flex-grow-1 bg-light"
          style={{ minHeight: "100vh", marginLeft: "250px" }}
        >
          <Header title="Appointment Management" />
          <Container className="py-4">
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2">Loading appointments...</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="Appointment Management" />
        <Container className="py-4">
          {/* Header */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <Calendar className="me-2" />
                    Appointment Management
                  </h4>
                  <p className="text-muted mb-0">
                    Review, assign, and manage patient appointments
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="warning" className="fs-6 px-3 py-2 me-2">
                    {pendingAppointments.length} Pending
                  </Badge>
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    {approvedAppointments.length} Approved
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Search */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Form.Group>
                <div className="position-relative">
                  <Search className="position-absolute" style={{ left: '12px', top: '12px' }} />
                  <Form.Control
                    type="text"
                    placeholder="Search by patient name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Appointments Tabs */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="pending" title={`Pending (${pendingAppointments.length})`}>
                  {pendingAppointments.length === 0 ? (
                    <Alert variant="info">No pending appointments</Alert>
                  ) : (
                    <Table hover responsive>
                      <thead className="table-light">
                        <tr>
                          <th>Patient</th>
                          <th>Provider</th>
                          <th>Type</th>
                          <th>Preferred Date/Time</th>
                          <th>Priority</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingAppointments.map((apt) => (
                          <tr key={apt._id}>
                            <td>
                              <Person className="me-2" />
                              {apt.patientId?.name || 'Unknown'}
                            </td>
                            <td>
                              {apt.doctorId?.name || apt.therapistId?.name || 'Unassigned'}
                              <br />
                              <small className="text-muted">
                                {apt.doctorId ? 'Doctor' : apt.therapistId ? 'Therapist' : 'N/A'}
                              </small>
                            </td>
                            <td>
                              {apt.appointmentType}
                              {apt.therapyType && <br />}
                              {apt.therapyType && (
                                <small className="text-muted">{apt.therapyType}</small>
                              )}
                            </td>
                            <td>
                              {new Date(apt.preferredDate).toLocaleDateString()}
                              <br />
                              <small>{apt.preferredTime}</small>
                            </td>
                            <td>{getPriorityBadge(apt.priority)}</td>
                            <td>
                              <small className="text-muted">
                                {new Date(apt.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-1"
                                onClick={() => handleAssign(apt)}
                              >
                                <Check size={14} /> Assign
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleReject(apt, reason);
                                }}
                              >
                                <X size={14} /> Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>

                <Tab eventKey="approved" title={`Approved (${approvedAppointments.length})`}>
                  {approvedAppointments.length === 0 ? (
                    <Alert variant="info">No approved appointments</Alert>
                  ) : (
                    <Table hover responsive>
                      <thead className="table-light">
                        <tr>
                          <th>Patient</th>
                          <th>Type</th>
                          <th>Scheduled Date/Time</th>
                          <th>Assigned To</th>
                          <th>Room</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedAppointments.map((apt) => (
                          <tr key={apt._id}>
                            <td>{apt.patientId?.name || 'Unknown'}</td>
                            <td>{apt.appointmentType}</td>
                            <td>
                              {apt.confirmedDate ? new Date(apt.confirmedDate).toLocaleDateString() : 'TBA'}
                              <br />
                              <small>{apt.confirmedTime || 'TBA'}</small>
                            </td>
                            <td>
                              {apt.doctorId?.name || apt.therapistId?.name || 'Unassigned'}
                              <br />
                              <small className="text-muted">
                                {apt.doctorId ? 'Doctor' : apt.therapistId ? 'Therapist' : ''}
                              </small>
                            </td>
                            <td>
                              {apt.roomId?.name || 'TBA'}
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye size={14} /> View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>

                <Tab eventKey="rejected" title={`Rejected (${rejectedAppointments.length})`}>
                  {rejectedAppointments.length === 0 ? (
                    <Alert variant="info">No rejected appointments</Alert>
                  ) : (
                    <Table hover responsive>
                      <thead className="table-light">
                        <tr>
                          <th>Patient</th>
                          <th>Type</th>
                          <th>Requested Date</th>
                          <th>Reason</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rejectedAppointments.map((apt) => (
                          <tr key={apt._id}>
                            <td>{apt.patientId?.name || 'Unknown'}</td>
                            <td>{apt.appointmentType}</td>
                            <td>
                              {new Date(apt.preferredDate).toLocaleDateString()}
                            </td>
                            <td>
                              <small className="text-muted">
                                {apt.rejectionReason || 'No reason provided'}
                              </small>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye size={14} /> View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>

          {/* Assign Modal */}
          <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Approve Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedAppointment && (
                <>
                  <Alert variant="info">
                    <strong>Patient:</strong> {selectedAppointment.patientId?.name}
                    <br />
                    <strong>Provider:</strong> {selectedAppointment.doctorId?.name || selectedAppointment.therapistId?.name}
                    <br />
                    <strong>Type:</strong> {selectedAppointment.appointmentType}
                    {selectedAppointment.therapyType && ` - ${selectedAppointment.therapyType}`}
                  </Alert>

                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Scheduled Date *</Form.Label>
                          <Form.Control
                            type="date"
                            value={assignForm.assignedDate}
                            onChange={(e) => setAssignForm({...assignForm, assignedDate: e.target.value})}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Scheduled Time *</Form.Label>
                          <Form.Control
                            type="time"
                            value={assignForm.assignedTime}
                            onChange={(e) => setAssignForm({...assignForm, assignedTime: e.target.value})}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Room</Form.Label>
                      <Form.Select
                        value={assignForm.roomId}
                        onChange={(e) => setAssignForm({...assignForm, roomId: e.target.value})}
                      >
                        <option value="">Select Room (Optional)</option>
                        {rooms.map(room => (
                          <option key={room._id} value={room._id}>
                            {room.name} - {room.type}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Admin Notes</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={assignForm.adminNotes}
                        onChange={(e) => setAssignForm({...assignForm, adminNotes: e.target.value})}
                        placeholder="Any additional notes..."
                      />
                    </Form.Group>
                  </Form>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleApprove}>
                <Check className="me-2" />
                Approve Appointment
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Appointment Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedAppointment && (
                <>
                  <Row>
                    <Col md={6}>
                      <h6 className="text-muted mb-2">Patient Information</h6>
                      <p><strong>Name:</strong> {selectedAppointment.patientId?.name}</p>
                      <p><strong>Email:</strong> {selectedAppointment.patientId?.email}</p>
                      <p><strong>Phone:</strong> {selectedAppointment.patientId?.phone}</p>
                    </Col>
                    <Col md={6}>
                      <h6 className="text-muted mb-2">Appointment Details</h6>
                      <p><strong>Type:</strong> {selectedAppointment.appointmentType}</p>
                      {selectedAppointment.therapyType && (
                        <p><strong>Therapy:</strong> {selectedAppointment.therapyType}</p>
                      )}
                      <p><strong>Status:</strong> {getStatusBadge(selectedAppointment.status)}</p>
                      <p><strong>Priority:</strong> {getPriorityBadge(selectedAppointment.priority)}</p>
                    </Col>
                  </Row>

                  <hr />

                  <h6 className="text-muted mb-2">Symptoms</h6>
                  <p>{selectedAppointment.symptoms}</p>

                  {selectedAppointment.medicalHistory && (
                    <>
                      <h6 className="text-muted mb-2">Medical History</h6>
                      <p>{selectedAppointment.medicalHistory}</p>
                    </>
                  )}

                  {selectedAppointment.doctorId || selectedAppointment.therapistId ? (
                    <>
                      <hr />
                      <h6 className="text-muted mb-2">Provider Details</h6>
                      <p><strong>Assigned To:</strong> {selectedAppointment.doctorId?.name || selectedAppointment.therapistId?.name}</p>
                      {selectedAppointment.confirmedDate && (
                        <p><strong>Scheduled:</strong> {new Date(selectedAppointment.confirmedDate).toLocaleString()} at {selectedAppointment.confirmedTime}</p>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default AdminAppointments;