import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", formData);
      setSuccess("Registration successful! Please login.");
      setError("");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      setSuccess("");
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Card style={{ width: "28rem" }} className="shadow">
        <Card.Body>
          <h3 className="text-center mb-4">Register</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-2">
              <Form.Control
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Select name="role" value={formData.role} onChange={handleChange}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="therapist">Therapist</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                name="phone"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={handleChange}
              />
            </Form.Group>
            <Button type="submit" className="w-100" variant="success">Register</Button>
          </Form>
          <div className="mt-3 text-center">
            <Link to="/">Already have an account? Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;
