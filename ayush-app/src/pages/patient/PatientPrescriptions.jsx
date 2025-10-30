// src/pages/patient/PatientPrescriptions.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Spinner,
  Alert,
  Table,
  Badge,
  Button,
  Form,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import {
  FileText,
  Download,
  Calendar,
  Search,
  Filter,
} from "react-bootstrap-icons";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import API from "../../api";

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  // Fetch prescriptions
// In PatientPrescriptions.jsx, update the fetchPrescriptions function:

const fetchPrescriptions = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch all prescriptions
    const res = await API.get("/prescriptions", { headers });
    
    console.log("📄 Fetched all prescriptions:", res.data);

    const allPrescriptions = res.data || [];
    
    // Filter prescriptions for current patient
    // Match by patient ID or patient name
    const myPrescriptions = allPrescriptions.filter(prescription => {
      // Check if patientId matches current user
      if (prescription.patientId?._id === userId) return true;
      if (prescription.patientId?.name === currentUser.name) return true;
      
      // Also check if uploadedBy is therapist or doctor (not admin)
      const uploaderRole = prescription.uploadedBy?.role;
      const isFromTherapistOrDoctor = uploaderRole === 'therapist' || uploaderRole === 'doctor';
      
      return isFromTherapistOrDoctor && (
        prescription.patientId?._id === userId || 
        prescription.patientId?.name === currentUser.name
      );
    });

    console.log("📄 My prescriptions:", myPrescriptions);
    setPrescriptions(myPrescriptions);
    setFilteredPrescriptions(myPrescriptions);
  } catch (err) {
    console.error("❌ Fetch prescriptions error:", err);
    setError(err.response?.data?.error || "Failed to fetch prescriptions");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (userId || currentUser.name) {
      fetchPrescriptions();
    } else {
      setError("User information not found. Please login again.");
      setLoading(false);
    }
  }, []);

  // Filter and search prescriptions
  useEffect(() => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.uploadedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter((p) => {
        const uploadDate = new Date(p.uploadedAt);
        return uploadDate.toDateString() === filterDate.toDateString();
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploadedAt);
      const dateB = new Date(b.uploadedAt);
      
      if (sortBy === "newest") {
        return dateB - dateA;
      } else if (sortBy === "oldest") {
        return dateA - dateB;
      } else if (sortBy === "name") {
        return (a.fileName || "").localeCompare(b.fileName || "");
      }
      return 0;
    });

    setFilteredPrescriptions(filtered);
  }, [searchTerm, dateFilter, sortBy, prescriptions]);

  const handleDownload = (prescription) => {
    // Open file in new tab
    window.open(prescription.filePath, "_blank");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setSortBy("newest");
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return "";
    const ext = fileName.split(".").pop().toUpperCase();
    return ext;
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
      <PatientSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Prescriptions" />
        <Container className="py-4">
          {/* Header Section */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <FileText className="me-2" />
                    My Prescriptions & Documents
                  </h4>
                  <p className="text-muted mb-0">
                    View and download all your prescription documents
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <Badge bg="primary" className="fs-6 px-3 py-2">
                    {filteredPrescriptions.length} Document
                    {filteredPrescriptions.length !== 1 ? "s" : ""}
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

          {/* Filters Section */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label className="small text-muted mb-1">
                    <Search size={14} className="me-1" />
                    Search
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <Search size={16} />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by filename or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">
                    <Calendar size={14} className="me-1" />
                    Date Filter
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">
                    <Filter size={14} className="me-1" />
                    Sort By
                  </Form.Label>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name (A-Z)</option>
                  </Form.Select>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Prescriptions List */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2 text-muted">Loading prescriptions...</p>
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FileText size={48} className="mb-3 opacity-50" />
                  <p>
                    {prescriptions.length === 0
                      ? "No prescriptions found"
                      : "No prescriptions match your filters"}
                  </p>
                  {prescriptions.length > 0 && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "5%" }}>Type</th>
                      <th style={{ width: "30%" }}>File Name</th>
                      <th style={{ width: "20%" }}>Uploaded By</th>
                      <th style={{ width: "20%" }}>Date</th>
                      <th style={{ width: "15%" }}>Notes</th>
                      <th style={{ width: "5%" }} className="text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((prescription, index) => (
                      <tr key={prescription._id}>
                        <td>{index + 1}</td>
                        <td className="text-center" style={{ fontSize: "1.5rem" }}>
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
                          <div>
                            {prescription.uploadedBy?.name || "Unknown"}
                            <br />
                            <small className="text-muted">
                              {prescription.uploadedBy?.email || ""}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Calendar size={14} className="me-1 text-muted" />
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
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDownload(prescription)}
                            title="View/Download"
                          >
                            <Download size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {/* Info Card */}
          <Card className="mt-4 shadow-sm border-0 rounded-4 bg-light">
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h6 className="text-success mb-2">
                    📋 About Your Prescriptions
                  </h6>
                  <p className="small text-muted mb-0">
                    Your doctor uploads prescriptions and medical documents here
                    for your reference. You can view and download them anytime.
                    If you have any questions about a prescription, please
                    contact your doctor during your next appointment.
                  </p>
                </Col>
                <Col md={4} className="text-center d-flex align-items-center justify-content-center">
                  <div>
                    <div className="mb-2">
                      <Badge bg="info" className="px-3 py-2">
                        Total: {prescriptions.length}
                      </Badge>
                    </div>
                    <small className="text-muted">
                      Last updated:{" "}
                      {prescriptions.length > 0
                        ? new Date(
                            Math.max(
                              ...prescriptions.map((p) =>
                                new Date(p.uploadedAt).getTime()
                              )
                            )
                          ).toLocaleDateString()
                        : "N/A"}
                    </small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default PatientPrescriptions;