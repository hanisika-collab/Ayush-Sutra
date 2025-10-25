// pages/Doctors.js
import React, { useEffect, useState } from "react";
import { Container, Card, Table, Button, Alert, Spinner } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      const res = await API.get("/admin/users?role=doctor");
      setDoctors(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch doctors");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure to deactivate this doctor?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      fetchDoctors();
    } catch (err) {
      setError("Failed to deactivate doctor");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh", marginLeft: "250px" }}>
        <Header title="Doctors Management" />
        <Container className="py-4">
          <Card className="shadow-sm rounded">
            <Card.Body>
              <h4 className="mb-4">All Registered Doctors</h4>
              {loading ? (
                <Spinner animation="border" />
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : doctors.length === 0 ? (
                <Alert variant="info">No doctors found</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc, index) => (
                      <tr key={doc._id}>
                        <td>{index + 1}</td>
                        <td>{doc.name}</td>
                        <td>{doc.email}</td>
                        <td>{doc.phone || "-"}</td>
                        <td>{doc.active ? "Active" : "Inactive"}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeactivate(doc._id)}
                          >
                            Deactivate
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
      </div>
    </div>
  );
};

export default Doctors;
