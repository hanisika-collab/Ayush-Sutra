import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await API.get("/patients");
      setPatients(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to fetch patients");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Open edit modal
  const handleEdit = (patient) => {
    setEditPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      email: patient.email,
      address: patient.address,
      doshaType: patient.doshaType,
      medicalHistory: patient.medicalHistory,
    });
    setFile(null);
    setModalError("");
    setModalSuccess("");
    setShowModal(true);
  };

  // Update patient
  const handleUpdate = async () => {
    setModalError("");
    setModalSuccess("");

    if (!formData.name || !formData.age || !formData.gender || !formData.contact) {
      setModalError("Please fill all required fields.");
      return;
    }

    try {
      // Update patient info
      await API.put(`/patients/${editPatient._id}`, formData);

      // Upload new document if selected
      if (file) {
        const formDataFile = new FormData();
        formDataFile.append("file", file);

        await API.post(`/patients/${editPatient._id}/upload`, formDataFile, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setModalSuccess("Patient updated successfully!");
      fetchPatients();
      setTimeout(() => setShowModal(false), 1200);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.error || "Update failed");
    }
  };

  // Delete patient
  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      await API.delete(`/patients/${id}`);
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert("Failed to delete patient");
    }
  };

  // Delete a document
  const handleDeleteDocument = async (patientId, fileIndex) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const patient = patients.find((p) => p._id === patientId);
      patient.documents.splice(fileIndex, 1);
      await API.put(`/patients/${patientId}`, patient); // update patient documents
      fetchPatients();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px", overflowX: "auto" }}
      >
        <Header title="Patients List" />
        <Container className="py-4">
          <Card className="shadow-sm rounded">
            <Card.Body>
              <h4 className="mb-4 text-success">All Registered Patients</h4>

              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                </div>
              )}
              {error && <Alert variant="danger">{error}</Alert>}
              {!loading && !error && patients.length === 0 && (
                <Alert variant="info">No patients found.</Alert>
              )}

              {!loading && !error && patients.length > 0 && (
                <Table striped bordered hover responsive>
                  <thead className="table-success">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Dosha Type</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p, i) => (
                      <tr key={p._id}>
                        <td>{i + 1}</td>
                        <td>{p.name}</td>
                        <td>{p.age}</td>
                        <td>{p.gender}</td>
                        <td>{p.contact}</td>
                        <td>{p.email}</td>
                        <td>{p.doshaType}</td>
                        <td>
                          {p.documents && p.documents.length > 0 ? (
                            p.documents.map((doc, idx) => (
                              <div key={idx} className="d-flex align-items-center gap-2">
                                <a href={doc.filePath} target="_blank" rel="noopener noreferrer">
                                  {doc.fileName}
                                </a>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteDocument(p._id, idx)}
                                >
                                  x
                                </Button>
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">No docs</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(p)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePatient(p._id)}
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
        </Container>

        {/* Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-success">Edit Patient</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Age *</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={formData.age || ""}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Gender *</Form.Label>
                <Form.Select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Contact *</Form.Label>
                <Form.Control
                  type="text"
                  name="contact"
                  value={formData.contact || ""}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  rows={2}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Dosha Type</Form.Label>
                <Form.Select
                  name="doshaType"
                  value={formData.doshaType || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Dosha Type</option>
                  <option value="Vata">Vata</option>
                  <option value="Pitta">Pitta</option>
                  <option value="Kapha">Kapha</option>
                  <option value="Tridosha">Tridosha</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Medical History</Form.Label>
                <Form.Control
                  as="textarea"
                  name="medicalHistory"
                  value={formData.medicalHistory || ""}
                  onChange={handleChange}
                  rows={2}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Upload New Document (Optional)</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleUpdate}>
              Update Patient
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default PatientsList;
