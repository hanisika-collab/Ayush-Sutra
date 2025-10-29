// src/pages/Login.jsx - UPDATED VERSION
import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });

      // Save all authentication data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userId", res.data.userId);

      // ✅ FIXED: Store complete user object for notifications and other features
      const userObject = {
        _id: res.data.userId,
        id: res.data.userId,
        name: res.data.name,
        email: email,
        role: res.data.role,
      };
      localStorage.setItem("user", JSON.stringify(userObject));

      console.log("✅ Login successful:", {
        role: res.data.role,
        userId: res.data.userId,
        name: res.data.name,
      });

      // Redirect based on role
      switch (res.data.role) {
        case "admin":
          navigate("/dashboard");
          break;
        case "doctor":
          navigate("/therapist-dashboard");
          break;
        case "therapist":
          navigate("/therapist-dashboard");
          break;
        case "patient":
          navigate("/patient-dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center vh-100 bg-light"
    >
      <Card style={{ width: "24rem" }} className="shadow">
        <Card.Body>
          <div className="text-center mb-4">
            <h3 className="text-success">🌿 Ayush Wellness</h3>
            <p className="text-muted">Sign in to your account</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              type="submit"
              className="w-100"
              variant="success"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form>

          <div className="mt-3 text-center">
            <Link to="/register">Don't have an account? Register</Link>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-3 bg-light rounded">
            <small className="text-muted">
              <strong>Demo Accounts:</strong>
              <br />
              Admin: admin@ayush.com
              <br />
              Doctor: doctor@ayush.com
              <br />
              Therapist: therapist@ayush.com
              <br />
              Patient: patient@ayush.com
              <br />
              Password: password123
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;