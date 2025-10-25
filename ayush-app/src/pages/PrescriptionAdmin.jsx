import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

const PrescriptionAdmin = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    notes: "",
    file: null,
  });

  // Check admin login
  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      setError("Admin not logged in. Please login first.");
      setLoading(false);
      return;
    }
    fetchData();
  }, []);

  // Fetch patients & prescriptions
  const fetchData = async () => {
    try {
      const [patientsRes, prescriptionsRes] = await Promise.all([
        API.get("/patients"),
        API.get("/prescriptions"),
      ]);
      setPatients(patientsRes.data);
      setPrescriptions(prescriptionsRes.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data");
      setLoading(false);
    }
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") setFormData({ ...formData, file: files[0] });
    else setFormData({ ...formData, [name]: value });
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      setError("Admin not logged in. Cannot upload prescription.");
      return;
    }

    if (!formData.patientId || !formData.file) {
      setError("Patient and file are required");
      return;
    }

    const data = new FormData();
    data.append("patientId", formData.patientId);
    data.append("uploadedBy", adminId); // ✅ use real ObjectId
    data.append("notes", formData.notes);
    data.append("file", formData.file);

    try {
      await API.post("/prescriptions", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Prescription uploaded successfully!");
      setFormData({ patientId: "", notes: "", file: null });
      fetchData(); // refresh list
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    }
  };

  // Delete prescription
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this prescription?")) return;
    try {
      await API.delete(`/prescriptions/${id}`);
      fetchData();
    } catch (err) {
      setError("Failed to delete prescription");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px", overflowX: "auto" }}
      >
        <Header title="Prescription Management" />
        <Container className="py-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {!error && (
            <>
              <Card className="shadow-sm rounded mb-4">
                <Card.Body>
                  <h5 className="mb-3 text-success">Upload Prescription</h5>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Patient</Form.Label>
                      <Form.Select
                        name="patientId"
                        value={formData.patientId}
                        onChange={handleChange}
                      >
                        <option value="">-- Select Patient --</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Notes (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Enter notes"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Upload File</Form.Label>
                      <Form.Control
                        type="file"
                        name="file"
                        onChange={handleChange}
                      />
                    </Form.Group>
                    <Button type="submit" variant="success">
                      Upload
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              <Card className="shadow-sm rounded">
                <Card.Body>
                  <h5 className="mb-3 text-success">All Prescriptions</h5>
                  {prescriptions.length === 0 ? (
                    <Alert variant="info">No prescriptions found.</Alert>
                  ) : (
                    <Table striped bordered hover responsive>
                      <thead className="table-success">
                        <tr>
                          <th>#</th>
                          <th>Patient</th>
                          <th>Uploaded By</th>
                          <th>File</th>
                          <th>Notes</th>
                          <th>Uploaded At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((p, index) => (
                          <tr key={p._id}>
                            <td>{index + 1}</td>
                            <td>{p.patientId?.name || "-"}</td>
                            <td>{p.uploadedBy?.name || p.uploadedBy}</td>
                            <td>
                              <a
                                href={p.filePath}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {p.fileName}
                              </a>
                            </td>
                            <td>{p.notes || "-"}</td>
                            <td>
                              {new Date(p.uploadedAt).toLocaleDateString()}{" "}
                              {new Date(p.uploadedAt).toLocaleTimeString()}
                            </td>
                            <td>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(p._id)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default PrescriptionAdmin;
