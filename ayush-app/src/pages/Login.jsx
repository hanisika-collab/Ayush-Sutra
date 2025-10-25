import React, { useState } from "react";
import API from "../api";
import { useNavigate, Link } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });

      // Save token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userId", res.data.userId);

      // Redirect based on role
      switch (res.data.role) {
        case "admin":
          navigate("/dashboard");
          break;
        case "doctor":
          navigate("/dashboard");
          break;
        case "therapist":
          navigate("/dashboard");
          break;
        case "patient":
          navigate("/patient-dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <Card style={{ width: "24rem" }} className="shadow">
        <Card.Body>
          <h3 className="text-center mb-4">Login</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="w-100" variant="success">Login</Button>
          </Form>
          <div className="mt-3 text-center">
            <Link to="/register">Don't have an account? Register</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
