// ayush-app/src/pages/patient/BookAppointment.jsx - WITH PROVIDER SELECTION
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Calendar, Clock, CheckCircle, Person } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import API from "../../api";

const BookAppointment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // ✅ NEW: Provider lists
  const [doctors, setDoctors] = useState([]);
  const [therapists, setTherapists] = useState([]);

  const [formData, setFormData] = useState({
    appointmentType: "",
    therapyType: "",
    preferredDate: "",
    preferredTime: "",
    alternateDate: "",
    alternateTime: "",
    symptoms: "",
    medicalHistory: "",
    currentMedications: "",
    allergies: "",
    priority: "normal",
    // ✅ NEW: Provider selection
    doctorId: "",
    therapistId: "",
  });

  const appointmentTypes = [
    { value: "consultation", label: "Initial Consultation" },
    { value: "therapy", label: "Therapy Session" },
    { value: "follow-up", label: "Follow-up Visit" },
    { value: "emergency", label: "Emergency Consultation" },
  ];

  const therapyTypes = [
    "Abhyanga",
    "Swedana",
    "Pizhichil",
    "Shirodhara",
    "Udvartana",
    "Nasya",
    "Virechana",
    "Basti",
    "Other",
  ];

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM",
    "05:00 PM",
  ];

  // ✅ Fetch available doctors and therapists
  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await API.get("/appointments/providers", { headers });
      const providers = res.data || [];

      const doctorsList = providers.filter(p => p.role === 'doctor');
      const therapistsList = providers.filter(p => p.role === 'therapist');

      setDoctors(doctorsList);
      setTherapists(therapistsList);
      
      console.log('✅ Loaded providers:', { doctors: doctorsList.length, therapists: therapistsList.length });
    } catch (err) {
      console.error("❌ Fetch providers error:", err);
      // Don't show error, just log it
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ Clear therapist when doctor is selected and vice versa
    if (name === 'doctorId' && value) {
      setFormData({ ...formData, doctorId: value, therapistId: "" });
    } else if (name === 'therapistId' && value) {
      setFormData({ ...formData, therapistId: value, doctorId: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (
      !formData.appointmentType ||
      !formData.preferredDate ||
      !formData.preferredTime ||
      !formData.symptoms
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // ✅ Validate provider selection
    if (!formData.doctorId && !formData.therapistId) {
      setError("Please select either a doctor or therapist");
      return;
    }

    if (
      formData.appointmentType === "therapy" &&
      !formData.therapyType
    ) {
      setError("Please select a therapy type");
      return;
    }

    // Check if preferred date is in the future
    const preferredDate = new Date(formData.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preferredDate < today) {
      setError("Preferred date must be today or in the future");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.post("/appointments", formData, { headers });

      const providerName = formData.doctorId 
        ? doctors.find(d => d._id === formData.doctorId)?.name
        : therapists.find(t => t._id === formData.therapistId)?.name;

      setSuccess(
        `Appointment request submitted successfully to ${providerName || 'your healthcare provider'}! You will be notified once it's confirmed.`
      );

      // Reset form
      setFormData({
        appointmentType: "",
        therapyType: "",
        preferredDate: "",
        preferredTime: "",
        alternateDate: "",
        alternateTime: "",
        symptoms: "",
        medicalHistory: "",
        currentMedications: "",
        allergies: "",
        priority: "normal",
        doctorId: "",
        therapistId: "",
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/patient-appointments");
      }, 3000);
    } catch (err) {
      console.error("❌ Book appointment error:", err);
      setError(
        err.response?.data?.error || "Failed to book appointment"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="d-flex">
      <PatientSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="Book an Appointment" />
        <Container className="py-4">
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <Calendar className="me-2" />
                    Schedule Your Appointment
                  </h4>
                  <p className="text-muted mb-0">
                    Fill out the form below to request an appointment with our healthcare professionals
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() => setError("")}
            >
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

          {/* Appointment Form */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                {/* ✅ NEW: Healthcare Provider Selection */}
                <h5 className="text-success mb-3">Select Healthcare Provider</h5>
                {loadingProviders ? (
                  <div className="text-center mb-3">
                    <Spinner animation="border" size="sm" variant="success" />
                    <span className="ms-2">Loading providers...</span>
                  </div>
                ) : (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Person className="me-2" />
                          Select Doctor (Optional)
                        </Form.Label>
                        <Form.Select
                          name="doctorId"
                          value={formData.doctorId}
                          onChange={handleChange}
                          disabled={!!formData.therapistId}
                        >
                          <option value="">-- Choose Doctor --</option>
                          {doctors.map((doctor) => (
                            <option key={doctor._id} value={doctor._id}>
                              Dr. {doctor.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          For consultations and medical evaluations
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Person className="me-2" />
                          Select Therapist (Optional)
                        </Form.Label>
                        <Form.Select
                          name="therapistId"
                          value={formData.therapistId}
                          onChange={handleChange}
                          disabled={!!formData.doctorId}
                        >
                          <option value="">-- Choose Therapist --</option>
                          {therapists.map((therapist) => (
                            <option key={therapist._id} value={therapist._id}>
                              {therapist.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          For therapy sessions and treatments
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                
                {(!formData.doctorId && !formData.therapistId) && (
                  <Alert variant="info" className="mb-4">
                    <strong>ℹ️ Please select either a doctor or therapist</strong>
                    <p className="mb-0 mt-2 small">
                      Choose a doctor for medical consultations or a therapist for specific therapy treatments.
                    </p>
                  </Alert>
                )}

                {/* Appointment Type */}
                <h5 className="text-success mb-3">Appointment Details</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Appointment Type{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="appointmentType"
                        value={formData.appointmentType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Type</option>
                        {appointmentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    {formData.appointmentType === "therapy" && (
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Therapy Type{" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Select
                          name="therapyType"
                          value={formData.therapyType}
                          onChange={handleChange}
                          required={
                            formData.appointmentType === "therapy"
                          }
                        >
                          <option value="">Select Therapy</option>
                          {therapyTypes.map((therapy) => (
                            <option key={therapy} value={therapy}>
                              {therapy}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    )}
                  </Col>
                </Row>

                {/* Preferred Schedule */}
                <h5 className="text-success mb-3 mt-4">
                  Preferred Schedule
                </h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Preferred Date{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={getMinDate()}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Preferred Time{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Alternate Schedule */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Alternate Date (Optional)
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="alternateDate"
                        value={formData.alternateDate}
                        onChange={handleChange}
                        min={getMinDate()}
                      />
                      <Form.Text className="text-muted">
                        In case your preferred date is not available
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Alternate Time (Optional)
                      </Form.Label>
                      <Form.Select
                        name="alternateTime"
                        value={formData.alternateTime}
                        onChange={handleChange}
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Medical Information */}
                <h5 className="text-success mb-3 mt-4">
                  Medical Information
                </h5>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Symptoms / Reason for Visit{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    name="symptoms"
                    value={formData.symptoms}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Please describe your symptoms or reason for this appointment"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Medical History (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Any relevant medical history"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Current Medications (Optional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        name="currentMedications"
                        value={formData.currentMedications}
                        onChange={handleChange}
                        rows={2}
                        placeholder="List any medications you're currently taking"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Allergies (Optional)</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        rows={2}
                        placeholder="List any known allergies"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select "Urgent" only for emergency cases
                  </Form.Text>
                </Form.Group>

                {/* Submit Buttons */}
                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    disabled={loading || (!formData.doctorId && !formData.therapistId)}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Calendar className="me-2" />
                        Request Appointment
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => navigate("/patient-appointments")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Info Card */}
          <Card className="mt-4 shadow-sm border-0 rounded-4 bg-light">
            <Card.Body>
              <h6 className="text-info mb-2">
                📝 Important Information
              </h6>
              <ul className="mb-0 small">
                <li>
                  Your appointment request will be reviewed by the selected healthcare provider
                </li>
                <li>
                  You will receive a confirmation email once approved
                </li>
                <li>
                  Please arrive 10 minutes before your scheduled time
                </li>
                <li>
                  Cancellations must be made at least 24 hours in advance
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default BookAppointment;