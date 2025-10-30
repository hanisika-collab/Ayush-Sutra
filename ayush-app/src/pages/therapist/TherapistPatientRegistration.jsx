// src/pages/therapist/TherapistPatientRegistration.jsx
import React, { useState } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import {
  PersonPlus,
  Eye,
  EyeSlash,
  CheckCircle,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";

const TherapistPatientRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createUserAccount, setCreateUserAccount] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    email: "",
    password: "",
    address: "",
    doshaType: "",
    medicalHistory: "",
  });

  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!formData.name || !formData.age || !formData.gender || !formData.contact) {
      setError("Please fill all required fields (Name, Age, Gender, Contact).");
      return;
    }

    // Email validation if creating user account
    if (createUserAccount) {
      if (!formData.email) {
        setError("Email is required to create user account");
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Prepare data
      const patientData = { ...formData };
      if (!createUserAccount) {
        delete patientData.email;
        delete patientData.password;
      }

      // 1️⃣ Create patient
      const res = await API.post("/patients", patientData, { headers });
      const patientId = res.data.patient._id;
      const userCreated = res.data.userAccountCreated;

      console.log("✅ Patient created:", res.data);

      // 2️⃣ Upload file if selected
      if (file) {
        const formDataFile = new FormData();
        formDataFile.append("file", file);

        await API.post(`/patients/${patientId}/upload`, formDataFile, {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("✅ File uploaded");
      }

      // Success message
      let successMsg = "Patient registered successfully!";
      if (userCreated) {
        successMsg += ` User account created with email: ${formData.email}`;
      }
      setSuccess(successMsg);

      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "",
        contact: "",
        email: "",
        password: "",
        address: "",
        doshaType: "",
        medicalHistory: "",
      });
      setFile(null);

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/therapist-patients");
      }, 2000);
    } catch (err) {
      console.error("❌ Registration error:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to register patient";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="Register New Patient" />
        <Container className="py-4">
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <PersonPlus className="me-2" />
                    Patient Registration
                  </h4>
                  <p className="text-muted mb-0">
                    Add a new patient to the system. You can optionally create a
                    user account for portal access.
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate("/therapist-patients")}
                  >
                    ← Back to Patients
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Registration Form */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
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

              <Form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <h5 className="text-success mb-3">Basic Information</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Full Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter patient's full name"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Age <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Age"
                        min="1"
                        max="120"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Gender <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Contact Information */}
                <h5 className="text-success mb-3 mt-4">Contact Information</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Contact Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        placeholder="Enter mobile number"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter address"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* User Account Section */}
                <h5 className="text-success mb-3 mt-4">
                  Portal Access (Optional)
                </h5>
                <Form.Check
                  type="checkbox"
                  id="createUserAccount"
                  label="Create user account for patient portal access"
                  checked={createUserAccount}
                  onChange={(e) => setCreateUserAccount(e.target.checked)}
                  className="mb-3"
                />

                {createUserAccount && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Email <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email for login"
                          required={createUserAccount}
                        />
                        <Form.Text className="text-muted">
                          Patient will use this email to login
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Password <span className="text-danger">*</span>
                        </Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Set initial password"
                            minLength="6"
                            required={createUserAccount}
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeSlash /> : <Eye />}
                          </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Minimum 6 characters
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Medical Information */}
                <h5 className="text-success mb-3 mt-4">
                  Medical Information
                </h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dosha Type</Form.Label>
                      <Form.Select
                        name="doshaType"
                        value={formData.doshaType}
                        onChange={handleChange}
                      >
                        <option value="">Select Dosha Type</option>
                        <option value="Vata">Vata</option>
                        <option value="Pitta">Pitta</option>
                        <option value="Kapha">Kapha</option>
                        <option value="Tridosha">Tridosha (Balanced)</option>
                        <option value="Vata-Pitta">Vata-Pitta</option>
                        <option value="Pitta-Kapha">Pitta-Kapha</option>
                        <option value="Vata-Kapha">Vata-Kapha</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Upload Document (Optional)</Form.Label>
                      <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <Form.Text className="text-muted">
                        Lab reports, prescriptions, etc.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Medical History</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Enter any relevant medical history, allergies, current medications, etc."
                    rows={4}
                  />
                </Form.Group>

                {/* Action Buttons */}
                <div className="d-flex gap-2">
                  <Button
                    type="submit"
                    variant="success"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Registering...
                      </>
                    ) : (
                      <>
                        <PersonPlus className="me-2" />
                        Register Patient
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({
                        name: "",
                        age: "",
                        gender: "",
                        contact: "",
                        email: "",
                        password: "",
                        address: "",
                        doshaType: "",
                        medicalHistory: "",
                      });
                      setFile(null);
                      const fileInput = document.querySelector(
                        'input[type="file"]'
                      );
                      if (fileInput) fileInput.value = "";
                    }}
                    disabled={loading}
                  >
                    Reset Form
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Info Card */}
          <Card className="mt-4 shadow-sm border-0 rounded-4 bg-light">
            <Card.Body>
              <h6 className="text-info mb-2">📝 Registration Tips</h6>
              <ul className="mb-0 small">
                <li>
                  <strong>Required fields</strong> are marked with{" "}
                  <span className="text-danger">*</span>
                </li>
                <li>
                  <strong>User account:</strong> If you create a user account,
                  the patient can login to view their appointments and progress
                </li>
                <li>
                  <strong>Documents:</strong> You can upload additional documents
                  later from the patient's profile
                </li>
                <li>
                  <strong>Dosha assessment:</strong> Can be updated after
                  consultation
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default TherapistPatientRegistration;