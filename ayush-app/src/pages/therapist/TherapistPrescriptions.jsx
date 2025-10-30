// src/pages/therapist/TherapistPrescriptions.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  Table,
  Alert,
  Spinner,
  Modal,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import {
  FileText,
  Upload,
  Download,
  Trash,
  Eye,
  Calendar,
  Person,
} from "react-bootstrap-icons";
import TherapistSidebar from "../../components/TherapistSidebar";
import Header from "../../components/Header";
import API from "../../api";

const TherapistPrescriptions = () => {
  const [myPatients, setMyPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewPrescription, setViewPrescription] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    notes: "",
    file: null,
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchMyPatientsAndPrescriptions();
  }, []);

  // ✅ FIXED: Fetch patients and prescriptions
  const fetchMyPatientsAndPrescriptions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch therapy sessions to find my patients
      const sessionsRes = await API.get("/therapy-sessions", { headers });
      const sessions = sessionsRes.data || [];

      // Filter sessions where I'm the therapist
      const mySessions = sessions.filter(
        (s) => s.therapistId?._id === userId || s.therapistId === userId
      );

      // Extract unique patients
      const patientMap = new Map();
      mySessions.forEach((session) => {
        const patient = session.patientId;
        if (patient && patient._id && !patientMap.has(patient._id)) {
          patientMap.set(patient._id, patient);
        }
      });

      const patientsList = Array.from(patientMap.values());
      console.log("👥 My patients:", patientsList.length);
      setMyPatients(patientsList);

      // Fetch my prescriptions
      const prescRes = await API.get("/prescriptions", { headers });
      const allPrescriptions = prescRes.data || [];

      // Filter prescriptions uploaded by me
      const myPrescriptions = allPrescriptions.filter(
        (p) => p.uploadedBy?._id === userId || p.uploadedBy === userId
      );

      console.log("📄 My prescriptions:", myPrescriptions.length);
      setPrescriptions(myPrescriptions);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ FIXED: Upload with proper authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || !formData.file) {
      setError("Patient and file are required");
      return;
    }

    const data = new FormData();
    data.append("patientId", formData.patientId);
    data.append("uploadedBy", userId);
    data.append("notes", formData.notes);
    data.append("file", formData.file);

    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.post("/prescriptions", data, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Prescription uploaded successfully! Email sent to patient.");
      setFormData({ patientId: "", notes: "", file: null });
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      fetchMyPatientsAndPrescriptions();
      
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this prescription?"))
      return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.delete(`/prescriptions/${id}`, { headers });
      setSuccess("Prescription deleted successfully!");
      fetchMyPatientsAndPrescriptions();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Delete error:", err);
      setError("Failed to delete prescription");
    }
  };

  const handleView = (prescription) => {
    setViewPrescription(prescription);
    setShowModal(true);
  };

  // ✅ FIXED: Download with authentication
  const handleDownload = async (prescription) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API.defaults.baseURL}/prescriptions/${prescription._id}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = prescription.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download error:", err);
      setError("Failed to download file");
    }
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return "";
    return fileName.split(".").pop().toUpperCase();
  };

  const getFileIcon = (fileName) => {
    const ext = getFileExtension(fileName);
    switch (ext) {
      case "PDF":
        return "📄";
      case "JPG":
      case "JPEG":
      case "PNG":
        return "🖼️";
      case "DOC":
      case "DOCX":
        return "📝";
      default:
        return "📎";
    }
  };

  return (
    <div className="d-flex">
      <TherapistSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header
          title={`Prescription Management - ${
            userRole === "doctor" ? "Doctor" : "Therapist"
          }`}
        />
        <Container className="py-4">
          {/* Header Card */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <FileText className="me-2" />
                    Manage Patient Prescriptions
                  </h4>
                  <p className="text-muted mb-0">
                    Upload and manage prescriptions for your patients
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="primary" className="fs-6 px-3 py-2 me-2">
                    {myPatients.length} Patients
                  </Badge>
                  <Badge bg="success" className="fs-6 px-3 py-2">
                    {prescriptions.length} Prescriptions
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Alerts */}
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

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading...</p>
            </div>
          ) : (
            <>
              {/* Upload Form */}
              <Card className="shadow-sm border-0 rounded-4 mb-4">
                <Card.Body className="p-4">
                  <h5 className="mb-3">
                    <Upload className="me-2" />
                    Upload New Prescription
                  </h5>
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Select Patient *</Form.Label>
                          <Form.Select
                            name="patientId"
                            value={formData.patientId}
                            onChange={handleChange}
                            required
                          >
                            <option value="">-- Select Patient --</option>
                            {myPatients.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </Form.Select>
                          {myPatients.length === 0 && (
                            <Form.Text className="text-warning">
                              No patients assigned yet. Schedule a session first.
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Upload File *</Form.Label>
                          <Form.Control
                            type="file"
                            name="file"
                            onChange={handleChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            required
                          />
                          <Form.Text className="text-muted">
                            Supported: PDF, JPG, PNG, DOC (Max 10MB)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Notes (optional)</Form.Label>
                          <Form.Control
                            type="text"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Add any notes..."
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button
                      type="submit"
                      variant="success"
                      disabled={uploading || myPatients.length === 0}
                      className="px-4"
                    >
                      {uploading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="me-2" />
                          Upload Prescription
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {/* Prescriptions List */}
              <Card className="shadow-sm border-0 rounded-4">
                <Card.Body>
                  <h5 className="mb-3">
                    <FileText className="me-2" />
                    My Uploaded Prescriptions
                  </h5>
                  {prescriptions.length === 0 ? (
                    <Alert variant="info">
                      No prescriptions uploaded yet. Upload one above to get
                      started!
                    </Alert>
                  ) : (
                    <Table hover responsive className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "5%" }}>Type</th>
                          <th style={{ width: "25%" }}>File Name</th>
                          <th style={{ width: "20%" }}>Patient</th>
                          <th style={{ width: "15%" }}>Uploaded</th>
                          <th style={{ width: "15%" }}>Notes</th>
                          <th style={{ width: "15%" }} className="text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {prescriptions.map((prescription, index) => (
                          <tr key={prescription._id}>
                            <td>{index + 1}</td>
                            <td
                              className="text-center"
                              style={{ fontSize: "1.5rem" }}
                            >
                              {getFileIcon(prescription.fileName)}
                            </td>
                            <td>
                              <div>
                                <strong>{prescription.fileName}</strong>
                                <br />
                                <Badge bg="secondary" className="small">
                                  {getFileExtension(prescription.fileName)}
                                </Badge>
                              </div>
                            </td>
                            <td>
                              <Person size={14} className="me-1 text-muted" />
                              {prescription.patientId?.name || "Unknown"}
                            </td>
                            <td>
                              <Calendar
                                size={14}
                                className="me-1 text-muted"
                              />
                              {new Date(
                                prescription.uploadedAt
                              ).toLocaleDateString()}
                              <br />
                              <small className="text-muted">
                                {new Date(
                                  prescription.uploadedAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {prescription.notes || "-"}
                              </small>
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-info"
                                size="sm"
                                className="me-1"
                                onClick={() => handleView(prescription)}
                                title="View Details"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-1"
                                onClick={() => handleDownload(prescription)}
                                title="Download"
                              >
                                <Download size={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDelete(prescription._id)}
                                title="Delete"
                              >
                                <Trash size={16} />
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

        {/* View Details Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FileText className="me-2" />
              Prescription Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {viewPrescription && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <h6 className="text-muted mb-2">File Information</h6>
                    <div className="mb-2">
                      <strong>File Name:</strong>{" "}
                      {viewPrescription.fileName}
                    </div>
                    <div className="mb-2">
                      <strong>Type:</strong>{" "}
                      <Badge bg="secondary">
                        {getFileExtension(viewPrescription.fileName)}
                      </Badge>
                    </div>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-2">Patient Information</h6>
                    <div className="mb-2">
                      <strong>Patient:</strong>{" "}
                      {viewPrescription.patientId?.name || "Unknown"}
                    </div>
                    <div className="mb-2">
                      <strong>Uploaded:</strong>{" "}
                      {new Date(
                        viewPrescription.uploadedAt
                      ).toLocaleString()}
                    </div>
                  </Col>
                </Row>

                {viewPrescription.notes && (
                  <div className="mb-3">
                    <h6 className="text-muted mb-2">Notes</h6>
                    <p className="mb-0">{viewPrescription.notes}</p>
                  </div>
                )}

                <div className="text-center mt-4">
                  <Button
                    variant="success"
                    onClick={() => handleDownload(viewPrescription)}
                  >
                    <Download className="me-2" />
                    Download File
                  </Button>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default TherapistPrescriptions;