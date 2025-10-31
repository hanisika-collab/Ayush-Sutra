// src/pages/PatientsList.jsx - FIXED DOCUMENT PATH HANDLING
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
  Badge,
  InputGroup,
  Row,
  Col,
} from "react-bootstrap";
import { 
  Eye, 
  Download, 
  Trash, 
  FileEarmark, 
  Search, 
  PersonPlus,
  Pencil,
  XCircle
} from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await API.get("/patients", { headers });
      console.log("📋 Fetched patients:", res.data.length);
      setPatients(res.data);
      setFilteredPatients(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Fetch patients error:", err);
      setError(err.response?.data?.error || "Failed to fetch patients");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.contact?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchTerm, patients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

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

  const handleViewDocuments = (patient) => {
    console.log("📂 Viewing documents for:", patient.name);
    console.log("Documents:", patient.documents);
    setSelectedPatient(patient);
    setShowDocModal(true);
  };

  const handleUpdate = async () => {
    setModalError("");
    setModalSuccess("");

    if (!formData.name || !formData.age || !formData.gender || !formData.contact) {
      setModalError("Please fill all required fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await API.put(`/patients/${editPatient._id}`, formData, { headers });

      if (file) {
        const formDataFile = new FormData();
        formDataFile.append("file", file);

        await API.post(`/patients/${editPatient._id}/upload`, formDataFile, {
          headers: { 
            ...headers,
            "Content-Type": "multipart/form-data" 
          },
        });
      }

      setModalSuccess("Patient updated successfully!");
      setSuccess("Patient updated successfully!");
      fetchPatients();
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
      }, 1500);
    } catch (err) {
      console.error("❌ Update patient error:", err);
      setModalError(err.response?.data?.error || "Update failed");
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await API.delete(`/patients/${id}`, { headers });
      setSuccess("Patient deleted successfully!");
      fetchPatients();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Delete patient error:", err);
      setError("Failed to delete patient");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteDocument = async (patientId, fileIndex) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const patient = patients.find((p) => p._id === patientId);
      patient.documents.splice(fileIndex, 1);
      
      await API.put(`/patients/${patientId}`, patient, { headers });
      
      setSuccess("Document deleted successfully!");
      fetchPatients();
      
      if (selectedPatient && selectedPatient._id === patientId) {
        const updated = await API.get(`/patients`, { headers });
        const updatedPatient = updated.data.find(p => p._id === patientId);
        setSelectedPatient(updatedPatient);
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Delete document error:", err);
      setError("Failed to delete document");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ✅✅✅ COMPREHENSIVE FIX: Handle all possible document path formats
  const handleDownloadDocument = (filePath, fileName) => {
    try {
      console.log("📥 Attempting to download document:", fileName);
      console.log("Original path from database:", filePath);
      
      // Get base URL from API config
      const baseURL = API.defaults.baseURL || 'http://localhost:5000';
      console.log("Base URL:", baseURL);
      
      let cleanPath = filePath;
      
      // ✅ FIX 1: Remove multiple /api/ prefixes if they exist
      while (cleanPath.includes('/api/')) {
        cleanPath = cleanPath.replace('/api/', '/');
      }
      
      // ✅ FIX 2: Ensure path starts with /uploads
      if (!cleanPath.startsWith('/uploads')) {
        if (cleanPath.startsWith('/')) {
          cleanPath = '/uploads' + cleanPath;
        } else {
          cleanPath = '/uploads/' + cleanPath;
        }
      }
      
      // ✅ FIX 3: Remove any double slashes except after http://
      cleanPath = cleanPath.replace(/([^:]\/)\/+/g, "$1");
      
      // ✅ FIX 4: Construct the full URL
      const fullUrl = `${baseURL}${cleanPath}`;
      
      console.log("✅ Cleaned path:", cleanPath);
      console.log("✅ Final URL:", fullUrl);
      
      // Open in new tab
      window.open(fullUrl, '_blank');
      
    } catch (err) {
      console.error("❌ Download error:", err);
      setError(`Failed to open document: ${err.message}`);
      setTimeout(() => setError(""), 3000);
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
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <PersonPlus className="me-2" />
                    All Registered Patients
                  </h4>
                  <p className="text-muted mb-0">
                    View and manage patient records
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    as={Link}
                    to="/patient-registration"
                    variant="success"
                    className="me-2"
                  >
                    <PersonPlus className="me-2" />
                    Register New Patient
                  </Button>
                  <Badge bg="primary" className="fs-6 px-3 py-2">
                    {filteredPatients.length} Patient{filteredPatients.length !== 1 ? "s" : ""}
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Global Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Search Bar */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="lg"
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setSearchTerm("")}
                  >
                    <XCircle />
                  </Button>
                )}
              </InputGroup>
              {searchTerm && (
                <small className="text-muted mt-2 d-block">
                  Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
                </small>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              {loading && (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2">Loading patients...</p>
                </div>
              )}
              
              {error && !loading && <Alert variant="danger">{error}</Alert>}
              
              {!loading && !error && filteredPatients.length === 0 && (
                <Alert variant="info">
                  {searchTerm 
                    ? `No patients found matching "${searchTerm}"`
                    : "No patients found."}
                </Alert>
              )}

              {!loading && !error && filteredPatients.length > 0 && (
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
                    {filteredPatients.map((p, i) => (
                      <tr key={p._id}>
                        <td>{i + 1}</td>
                        <td>{p.name}</td>
                        <td>{p.age}</td>
                        <td>{p.gender}</td>
                        <td>{p.contact}</td>
                        <td>{p.email || '-'}</td>
                        <td>{p.doshaType || '-'}</td>
                        <td>
                          {p.documents && p.documents.length > 0 ? (
                            <>
                              <Badge bg="info" className="me-2">
                                {p.documents.length} file{p.documents.length !== 1 ? 's' : ''}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleViewDocuments(p)}
                              >
                                <Eye size={14} /> View
                              </Button>
                            </>
                          ) : (
                            <span className="text-muted">No docs</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(p)}
                            title="Edit Patient"
                          >
                            <Pencil size={14} /> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeletePatient(p._id)}
                            title="Delete Patient"
                          >
                            <Trash size={14} /> Delete
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
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title className="text-success">
              <Pencil className="me-2" />
              Edit Patient
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {modalError && <Alert variant="danger">{modalError}</Alert>}
            {modalSuccess && <Alert variant="success">{modalSuccess}</Alert>}

            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Age *</Form.Label>
                    <Form.Control
                      type="number"
                      name="age"
                      value={formData.age || ""}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Gender *</Form.Label>
                    <Form.Select
                      name="gender"
                      value={formData.gender || ""}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Contact *</Form.Label>
                    <Form.Control
                      type="text"
                      name="contact"
                      value={formData.contact || ""}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                  rows={2}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
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
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload New Document</Form.Label>
                    <Form.Control type="file" onChange={handleFileChange} />
                    <Form.Text className="text-muted">
                      Optional - Add additional documents
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Medical History</Form.Label>
                <Form.Control
                  as="textarea"
                  name="medicalHistory"
                  value={formData.medicalHistory || ""}
                  onChange={handleChange}
                  rows={3}
                />
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

        {/* Documents Viewer Modal */}
        <Modal 
          show={showDocModal} 
          onHide={() => setShowDocModal(false)} 
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FileEarmark className="me-2" />
              Patient Documents - {selectedPatient?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedPatient?.documents && selectedPatient.documents.length > 0 ? (
              <>
                <Alert variant="info" className="mb-3">
                  <strong>📁 Total Documents: {selectedPatient.documents.length}</strong>
                  <p className="mb-0 mt-2 small">
                    Click "View" to open documents in a new tab, or "Delete" to remove them permanently.
                  </p>
                </Alert>
                <Table striped bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "45%" }}>File Name</th>
                      <th style={{ width: "25%" }}>Uploaded</th>
                      <th style={{ width: "25%" }} className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPatient.documents.map((doc, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <FileEarmark className="me-2 text-primary" />
                          <strong>{doc.fileName}</strong>
                          <br />
                          <small className="text-muted">
                            Path: {doc.filePath}
                          </small>
                        </td>
                        <td>
                          <small className="text-muted">
                            {doc.uploadedAt 
                              ? new Date(doc.uploadedAt).toLocaleString()
                              : 'N/A'}
                          </small>
                        </td>
                        <td className="text-center">
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="me-2"
                            onClick={() => handleDownloadDocument(doc.filePath, doc.fileName)}
                            title="View/Download"
                          >
                            <Download size={14} /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeleteDocument(selectedPatient._id, idx)}
                            title="Delete"
                          >
                            <Trash size={14} /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : (
              <Alert variant="info">
                <FileEarmark size={48} className="d-block mx-auto mb-3 opacity-50" />
                <p className="text-center mb-0">
                  No documents found for this patient.
                </p>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDocModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default PatientsList;