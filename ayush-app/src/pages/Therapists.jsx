// pages/Therapists.js
import React, { useEffect, useState } from "react";
import { Container, Card, Table, Button, Alert, Spinner } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

const Therapists = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTherapists = async () => {
    try {
      const res = await API.get("/admin/users?role=therapist");
      setTherapists(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch therapists");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure to deactivate this therapist?")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      fetchTherapists();
    } catch (err) {
      setError("Failed to deactivate therapist");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh", marginLeft: "250px" }}>
        <Header title="Therapists Management" />
        <Container className="py-4">
          <Card className="shadow-sm rounded">
            <Card.Body>
              <h4 className="mb-4">All Registered Therapists</h4>
              {loading ? (
                <Spinner animation="border" />
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : therapists.length === 0 ? (
                <Alert variant="info">No therapists found</Alert>
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
                    {therapists.map((ther, index) => (
                      <tr key={ther._id}>
                        <td>{index + 1}</td>
                        <td>{ther.name}</td>
                        <td>{ther.email}</td>
                        <td>{ther.phone || "-"}</td>
                        <td>{ther.active ? "Active" : "Inactive"}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeactivate(ther._id)}
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

export default Therapists;
