import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import API from "../api";

const PatientRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    email: "",
    address: "",
    doshaType: "",
    medicalHistory: "",
  });

  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    try {
      // 1️⃣ Create patient first
      const res = await API.post("/patients", formData);
      const patientId = res.data.patient._id;
      setSuccess("Patient registered successfully!");

      // 2️⃣ Upload file if selected
      if (file) {
        const formDataFile = new FormData();
        formDataFile.append("file", file);

        await API.post(`/patients/${patientId}/upload`, formDataFile, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess("Patient registered and file uploaded successfully!");
      }

      // Reset form
      setFormData({
        name: "",
        age: "",
        gender: "",
        contact: "",
        email: "",
        address: "",
        doshaType: "",
        medicalHistory: "",
      });
      setFile(null);

      // Redirect to patients list after 1.5s
      setTimeout(() => navigate("/patients"), 1500);
    } catch (err) {
      console.error("Patient registration error:", err);
      const msg =
        err.response?.data?.error || err.response?.data?.message || "Something went wrong";
      setError(msg);
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px", overflowX: "hidden" }}
      >
        <Header title="Patient Registration" />
        <Container className="py-4">
          <Card className="shadow-sm rounded-4 border-0 p-4">
            <h5 className="text-success mb-4">Register New Patient</h5>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              {/* Name */}
              <Form.Group className="mb-3">
                <Form.Label>Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />
              </Form.Group>

              {/* Age */}
              <Form.Group className="mb-3">
                <Form.Label>Age *</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                />
              </Form.Group>

              {/* Gender */}
              <Form.Group className="mb-3">
                <Form.Label>Gender *</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              {/* Contact */}
              <Form.Group className="mb-3">
                <Form.Label>Contact *</Form.Label>
                <Form.Control
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </Form.Group>

              {/* Address */}
              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  rows={2}
                />
              </Form.Group>

              {/* Dosha Type */}
              <Form.Group className="mb-3">
                <Form.Label>Dosha Type</Form.Label>
                <Form.Select name="doshaType" value={formData.doshaType} onChange={handleChange}>
                  <option value="">Select Dosha Type</option>
                  <option value="Vata">Vata</option>
                  <option value="Pitta">Pitta</option>
                  <option value="Kapha">Kapha</option>
                  <option value="Tridosha">Tridosha</option>
                </Form.Select>
              </Form.Group>

              {/* Medical History */}
              <Form.Group className="mb-3">
                <Form.Label>Medical History</Form.Label>
                <Form.Control
                  as="textarea"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleChange}
                  placeholder="Enter any medical history"
                  rows={2}
                />
              </Form.Group>

              {/* File Upload */}
              <Form.Group className="mb-3">
                <Form.Label>Upload Document (Optional)</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
              </Form.Group>

              <div className="d-flex gap-2">
                <Button type="submit" variant="success">
                  Save Patient
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormData({
                      name: "",
                      age: "",
                      gender: "",
                      contact: "",
                      email: "",
                      address: "",
                      doshaType: "",
                      medicalHistory: "",
                    });
                    setFile(null);
                  }}
                >
                  Reset Form
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default PatientRegistration;
