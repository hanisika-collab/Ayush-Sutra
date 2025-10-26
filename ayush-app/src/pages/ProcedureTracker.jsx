// src/pages/ProcedureTracker.jsx
import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, ProgressBar, Spinner, Alert, Collapse, Row, Col, Badge, Modal, Table } from "react-bootstrap";
import API from "../api";
import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";

const socket = io("http://localhost:4000");

const AYURVEDIC_PROCEDURES = [
  "Abhyanga",
  "Swedana",
  "Pizhichil",
  "Shirodhara",
  "Udvartana",
  "Nasya",
  "Virechana",
  "Basti",
];

export default function ProcedureTracker() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [procedures, setProcedures] = useState([]);
  const [selectedId, setSelectedId] = useState(urlId || "");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "danger" });
  const [addStepName, setAddStepName] = useState("");
  const [expandedSteps, setExpandedSteps] = useState({});
  const timersRef = useRef({});
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ heartRate: "", bloodPressure: "", temperature: "" });
  const [refreshing, setRefreshing] = useState(false);

  const fetchProcedures = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await API.get("/procedures", { headers });
      console.log("📋 Fetched procedures:", res.data);
      
      setProcedures(res.data || []);
      
      if (urlId && !selected && Array.isArray(res.data)) {
        const found = res.data.find(p => p._id === urlId);
        if (found) {
          setSelectedId(urlId);
          setSelected(found);
        }
      } else if (selectedId) {
        const found = (res.data || []).find(p => p._id === selectedId);
        setSelected(found || null);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setAlert({ show: true, message: err.response?.data?.error || "Failed to fetch procedures", variant: "danger" });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
    socket.on("procedureUpdated", fetchProcedures);
    return () => {
      socket.off("procedureUpdated", fetchProcedures);
      Object.values(timersRef.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) { 
      setSelected(null); 
      return; 
    }
    const proc = procedures.find(p => p._id === selectedId);
    setSelected(proc || null);
  }, [selectedId, procedures]);

  useEffect(() => {
    Object.values(timersRef.current).forEach(clearInterval);
    timersRef.current = {};
    
    if (selected?.steps?.length) {
      const activeStep = selected.steps.find(s => s.status === "in-progress");
      if (activeStep) setExpandedSteps({ [activeStep._id]: true });
      selected.steps.forEach(s => { 
        if (s.status === "in-progress") startTimer(s._id, s.elapsed || 0); 
      });
    }
  }, [selected]);

  const formatTime = sec => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const calculateProgress = steps => {
    if (!Array.isArray(steps) || steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === "completed").length;
    return Math.round((completed / steps.length) * 100);
  };

  const startTimer = (stepId, initial = 0) => {
    if (timersRef.current[stepId]) return;
    timersRef.current[stepId] = setInterval(() => {
      setSelected(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.steps = updated.steps.map(st =>
          st._id === stepId ? { ...st, elapsed: (st.elapsed || initial) + 1 } : st
        );
        return updated;
      });
    }, 1000);
  };

  const stopTimer = (stepId) => {
    clearInterval(timersRef.current[stepId]);
    delete timersRef.current[stepId];
  };

  const handleAddStep = async () => {
    if (!selected) return setAlert({ show: true, message: "Select a procedure first", variant: "danger" });
    if (!addStepName) return setAlert({ show: true, message: "Choose a procedure to add", variant: "danger" });

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await API.post(`/procedures/${selected._id}/add-step`, { stepName: addStepName }, { headers });
      setAddStepName("");
      setAlert({ show: true, message: "Step added successfully!", variant: "success" });
      fetchProcedures();
      socket.emit("procedureUpdated", { id: selected._id });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to add step", variant: "danger" });
    }
  };

  const handleUpdateStep = async (stepId, newStatus) => {
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const step = selected.steps.find(s => s._id === stepId);
      await API.put(`/procedures/${selected._id}/step/${stepId}`, { 
        status: newStatus,
        elapsed: step?.elapsed || 0
      }, { headers });

      setSelected(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.steps = updated.steps.map(st =>
          st._id === stepId ? {
            ...st,
            status: newStatus,
            startTime: newStatus === "in-progress" ? new Date() : st.startTime,
            endTime: newStatus === "completed" ? new Date() : st.endTime
          } : st
        );
        return updated;
      });

      if (newStatus === "in-progress") startTimer(stepId, step?.elapsed || 0);
      else stopTimer(stepId);

      socket.emit("procedureUpdated", { id: selected._id });
      setAlert({ show: true, message: `Step ${newStatus === "completed" ? "completed" : "started"}!`, variant: "success" });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to update step", variant: "danger" });
    }
  };

  const handleAddVitals = async () => {
    if (!selected) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await API.post(`/procedures/${selected._id}/vitals`, vitalsForm, { headers });
      fetchProcedures();
      setAlert({ show: true, message: "Vitals recorded successfully!", variant: "success" });
      setShowVitalsModal(false);
      setVitalsForm({ heartRate: "", bloodPressure: "", temperature: "" });
      socket.emit("procedureUpdated", { id: selected._id });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to record vitals", variant: "danger" });
    }
  };

  const handleCompleteProcedure = async () => {
    if (!selected) return;
    
    const hasInProgress = selected.steps?.some(s => s.status === "in-progress");
    if (hasInProgress) {
      setAlert({ show: true, message: "Please complete all in-progress steps first", variant: "warning" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await API.put(`/procedures/${selected._id}/complete`, {}, { headers });
      fetchProcedures();
      setAlert({ show: true, message: "Procedure completed successfully! 🎉", variant: "success" });
      socket.emit("procedureUpdated", { id: selected._id, action: "complete" });
      
      setTimeout(() => {
        setSelectedId("");
        setSelected(null);
      }, 2000);
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to complete procedure", variant: "danger" });
    }
  };

  const activeList = procedures.filter(p => p.status !== "completed");
  const completedList = procedures.filter(p => p.status === "completed");

  const getPatientName = (proc) => {
    if (proc?.patientId?.name) return proc.patientId.name;
    if (proc?.patientId) return "Patient ID: " + proc.patientId;
    return "Unknown Patient";
  };

  const getTherapistName = (proc) => {
    if (proc?.therapistId?.name) return proc.therapistId.name;
    if (proc?.therapistId) return "Therapist ID: " + proc.therapistId;
    return "Unknown Therapist";
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="text-success mb-0">
          <i className="bi bi-clipboard-pulse me-2"></i>
          Panchakarma Procedure Tracker
        </h3>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
      </div>

      {alert.show && (
        <Alert 
          variant={alert.variant} 
          onClose={() => setAlert({ ...alert, show: false })} 
          dismissible
        >
          {alert.message}
        </Alert>
      )}

      {/* Select Procedure */}
      <Card className="mb-3 shadow-sm">
        <Card.Body>
          <Form.Group>
            <Form.Label className="fw-bold">
              <i className="bi bi-clipboard-check me-2"></i>
              Select Active Procedure Session
            </Form.Label>
            <Form.Select 
              value={selectedId} 
              onChange={e => setSelectedId(e.target.value)}
              size="lg"
            >
              <option value="">-- Choose an active procedure --</option>
              {activeList.map(p => (
                <option key={p._id} value={p._id}>
                  {p.procedureName || p.therapyType || "Procedure"} — {getPatientName(p)} ({p.status || "active"})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>

      {/* Selected Procedure Summary */}
      {selected ? (
        <Card className="mb-3 shadow-sm border-success">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <h5 className="mb-2 text-success">
                  <i className="bi bi-heart-pulse me-2"></i>
                  {selected.procedureName || selected.therapyType || "Procedure"}
                </h5>
                <div className="mb-1">
                  <strong>👤 Patient:</strong> 
                  <Badge bg="primary" className="ms-2">{getPatientName(selected)}</Badge>
                </div>
                <div className="mb-1">
                  <strong>👨‍⚕️ Therapist:</strong> 
                  <Badge bg="info" className="ms-2">{getTherapistName(selected)}</Badge>
                </div>
                <div>
                  <strong>📅 Started:</strong> {selected.startTime ? new Date(selected.startTime).toLocaleString() : "N/A"}
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center">
                  <ProgressBar 
                    now={calculateProgress(selected.steps)} 
                    label={`${calculateProgress(selected.steps)}%`}
                    variant="success"
                    style={{ height: "30px", fontSize: "16px" }}
                  />
                  <small className="text-muted">Overall Progress</small>
                </div>
              </Col>
              <Col md={3} className="text-end">
                <Button 
                  variant="outline-success" 
                  size="sm" 
                  className="me-2"
                  onClick={() => setShowVitalsModal(true)}
                >
                  <i className="bi bi-heart-pulse-fill me-1"></i>
                  Record Vitals
                </Button>
                <Button 
                  variant="outline-info" 
                  size="sm"
                  onClick={fetchProcedures}
                  disabled={refreshing}
                >
                  {refreshing ? <Spinner animation="border" size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mb-3 shadow-sm">
          <Card.Body className="text-center text-muted py-5">
            <i className="bi bi-clipboard-x" style={{ fontSize: "3rem" }}></i>
            <p className="mt-3">Select an active procedure above to view details and track progress</p>
          </Card.Body>
        </Card>
      )}

      {/* Add Step */}
      {selected && (
        <Card className="mb-3 shadow-sm">
          <Card.Body>
            <Row className="g-2 align-items-center">
              <Col md={8}>
                <Form.Select value={addStepName} onChange={e => setAddStepName(e.target.value)}>
                  <option value="">➕ Add additional procedure step (optional)</option>
                  {AYURVEDIC_PROCEDURES.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </Form.Select>
              </Col>
              <Col md={4}>
                <Button 
                  onClick={handleAddStep} 
                  disabled={!selected || !addStepName}
                  variant="success"
                  className="w-100"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Step
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Steps List */}
      {selected && (
        <Card className="mb-3 shadow-sm">
          <Card.Header className="bg-success text-white">
            <h6 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Procedure Steps ({selected.steps?.length || 0})
            </h6>
          </Card.Header>
          <Card.Body>
            {(!selected.steps || selected.steps.length === 0) && (
              <div className="text-center text-muted py-4">
                <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
                <p className="mt-2">No steps added yet. Add steps above to begin tracking.</p>
              </div>
            )}
            {selected.steps?.map((step, idx) => (
              <div key={step._id} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <h6 className="mb-0 me-2">
                        <Badge bg="secondary" className="me-2">{idx + 1}</Badge>
                        {step.stepName}
                      </h6>
                      <Badge bg={
                        step.status === "completed" ? "success" : 
                        step.status === "in-progress" ? "warning" : 
                        "secondary"
                      }>
                        {step.status === "in-progress" ? "⏱️ " : step.status === "completed" ? "✅ " : "⏸️ "}
                        {step.status}
                      </Badge>
                    </div>
                    {step.description && <div className="text-muted small mb-2">{step.description}</div>}
                    <div className="d-flex gap-3 small">
                      <span className="text-info">
                        <i className="bi bi-stopwatch me-1"></i>
                        <strong>{formatTime(step.elapsed || 0)}</strong>
                      </span>
                      {step.startTime && (
                        <span className="text-muted">
                          Started: {new Date(step.startTime).toLocaleTimeString()}
                        </span>
                      )}
                      {step.endTime && (
                        <span className="text-success">
                          Ended: {new Date(step.endTime).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline-secondary"
                      onClick={() => setExpandedSteps(prev => ({ ...prev, [step._id]: !prev[step._id] }))}
                    >
                      {expandedSteps[step._id] ? "Hide ▲" : "Details ▼"}
                    </Button>
                    {step.status !== "completed" && (
                      <Button 
                        size="sm" 
                        variant={step.status === "in-progress" ? "success" : "primary"}
                        onClick={() => handleUpdateStep(step._id, step.status === "in-progress" ? "completed" : "in-progress")}
                      >
                        {step.status === "in-progress" ? "✓ Complete" : "▶ Start"}
                      </Button>
                    )}
                  </div>
                </div>

                <Collapse in={!!expandedSteps[step._id]}>
                  <div className="mt-3 p-3 bg-light rounded">
                    <Row>
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>📝 Notes:</strong> {step.notes || "No notes"}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-2">
                          <strong>⏰ Duration:</strong> {formatTime(step.elapsed || 0)}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Collapse>
              </div>
            ))}

            {selected.steps?.length > 0 && (
              <div className="mt-4 d-flex justify-content-end gap-2">
                <Button variant="outline-secondary" onClick={fetchProcedures}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleCompleteProcedure}
                  disabled={selected.steps?.some(s => s.status === "in-progress")}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Complete Procedure
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Active Procedures List */}
      <Card className="mb-3 shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h6 className="mb-0">
            <i className="bi bi-activity me-2"></i>
            Active Procedures ({activeList.length})
          </h6>
        </Card.Header>
        <Card.Body>
          {loading && <Spinner animation="border" variant="success" />}
          {activeList.length === 0 && !loading && (
            <div className="text-center text-muted py-3">No active procedures</div>
          )}
          {activeList.map(proc => (
            <Card className="mb-2 border" key={proc._id} style={{ 
              backgroundColor: selectedId === proc._id ? "#e7f5ff" : "white" 
            }}>
              <Card.Body className="py-2">
                <Row className="align-items-center">
                  <Col md={6}>
                    <div>
                      <strong>{proc.procedureName || proc.therapyType || "Procedure"}</strong>
                    </div>
                    <small className="text-muted">
                      👤 {getPatientName(proc)} • 👨‍⚕️ {getTherapistName(proc)}
                    </small>
                  </Col>
                  <Col md={3} className="text-center">
                    <Badge bg="info" style={{ fontSize: "0.9rem" }}>
                      {calculateProgress(proc.steps)}% Complete
                    </Badge>
                  </Col>
                  <Col md={3} className="text-end">
                    <Button 
                      size="sm" 
                      variant={selectedId === proc._id ? "success" : "outline-primary"}
                      onClick={() => setSelectedId(proc._id)}
                    >
                      {selectedId === proc._id ? "✓ Tracking" : "Track →"}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>

      {/* Completed Procedures */}
      <Card className="shadow-sm">
        <Card.Header className="bg-success text-white">
          <h6 className="mb-0">
            <i className="bi bi-check-circle me-2"></i>
            Completed Procedures ({completedList.length})
          </h6>
        </Card.Header>
        <Card.Body>
          {completedList.length === 0 && (
            <div className="text-center text-muted py-3">No completed procedures yet</div>
          )}
          {completedList.map(proc => (
            <Card key={proc._id} className="mb-2 border-success">
              <Card.Body className="py-2">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div>
                      <strong>{proc.procedureName || proc.therapyType}</strong>
                    </div>
                    <small className="text-muted">
                      👤 {getPatientName(proc)} • 
                      Completed: {proc.endTime ? new Date(proc.endTime).toLocaleString() : "N/A"}
                    </small>
                  </Col>
                  <Col md={4} className="text-end">
                    <Badge bg="success">✓ Completed</Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>

      {/* Vitals Modal */}
      <Modal show={showVitalsModal} onHide={() => setShowVitalsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-heart-pulse-fill text-danger me-2"></i>
            Record Patient Vitals
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Heart Rate (bpm)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., 72"
                value={vitalsForm.heartRate}
                onChange={(e) => setVitalsForm({...vitalsForm, heartRate: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Blood Pressure (mmHg)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., 120/80"
                value={vitalsForm.bloodPressure}
                onChange={(e) => setVitalsForm({...vitalsForm, bloodPressure: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Temperature (°F)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., 98.6"
                value={vitalsForm.temperature}
                onChange={(e) => setVitalsForm({...vitalsForm, temperature: e.target.value})}
              />
            </Form.Group>
          </Form>

          {selected?.vitals?.length > 0 && (
            <div className="mt-3">
              <h6>Previous Records</h6>
              <Table striped bordered size="sm">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>HR</th>
                    <th>BP</th>
                    <th>Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.vitals.slice(-3).reverse().map((v, i) => (
                    <tr key={i}>
                      <td>{new Date(v.recordedAt).toLocaleTimeString()}</td>
                      <td>{v.heartRate}</td>
                      <td>{v.bloodPressure}</td>
                      <td>{v.temperature}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVitalsModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleAddVitals}>
            <i className="bi bi-save me-2"></i>
            Save Vitals
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}