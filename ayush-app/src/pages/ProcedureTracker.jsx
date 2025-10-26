// src/pages/ProcedureTracker.jsx
import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, ProgressBar, Spinner, Alert, Collapse, Row, Col, Badge } from "react-bootstrap";
import API from "../api";
import io from "socket.io-client";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:4000"); // adjust if needed

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
  const [procedures, setProcedures] = useState([]);
  const [selectedId, setSelectedId] = useState(urlId || "");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "danger" });
  const [addStepName, setAddStepName] = useState("");
  const [expandedSteps, setExpandedSteps] = useState({});
  const timersRef = useRef({}); // stepId -> interval
  const [totalElapsed, setTotalElapsed] = useState(0);

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      const res = await API.get("/procedures");
      setProcedures(res.data || []);
      if (urlId && !selected && Array.isArray(res.data)) {
        const found = res.data.find(p => p._id === urlId);
        if (found) setSelectedId(urlId);
      } else if (selectedId) {
        const found = (res.data || []).find(p => p._id === selectedId);
        setSelected(found || null);
      }
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to fetch procedures", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
    socket.on("procedureUpdated", fetchProcedures);
    return () => {
      socket.off("procedureUpdated", fetchProcedures);
      Object.values(timersRef.current).forEach(clearInterval);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    const proc = procedures.find(p => p._id === selectedId);
    setSelected(proc || null);
  }, [selectedId, procedures]);

  useEffect(() => {
    Object.values(timersRef.current).forEach(clearInterval);
    timersRef.current = {};
    setTotalElapsed(0);
    if (selected?.steps?.length) {
      const activeStep = selected.steps.find(s => s.status === "in-progress");
      if (activeStep) setExpandedSteps({ [activeStep._id]: true });
      selected.steps.forEach(s => { if (s.status === "in-progress") startTimer(s._id, s.elapsed || 0); });
    }
    // eslint-disable-next-line
  }, [selected]);

  const formatTime = sec => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const calculateProgress = steps => {
    if (!Array.isArray(steps) || steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === "completed").length;
    return Math.round((completed / steps.length) * 100);
  };

  // ---------------- Timers ----------------
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
      setTotalElapsed(t => t + 1);
    }, 1000);
  };

  const stopTimer = (stepId, reset = false) => {
    clearInterval(timersRef.current[stepId]);
    delete timersRef.current[stepId];
    if (reset) {
      setSelected(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.steps = updated.steps.map(st =>
          st._id === stepId ? { ...st, elapsed: 0, status: "pending" } : st
        );
        return updated;
      });
    }
  };

  // ---------------- Step/Vitals handlers ----------------
  const handleAddStep = async () => {
    if (!selected) return setAlert({ show: true, message: "Select a procedure first", variant: "danger" });
    if (!addStepName) return setAlert({ show: true, message: "Choose a procedure to add", variant: "danger" });

    try {
      const res = await API.post(`/procedures/${selected._id}/add-step`, { stepName: addStepName });
      setAddStepName("");
      setAlert({ show: true, message: "Step added", variant: "success" });
      fetchProcedures();
      socket.emit?.("procedureUpdated", { id: selected._id });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to add step", variant: "danger" });
    }
  };

  const handleUpdateStep = async (stepId, newStatus) => {
    if (!selected) return;
    try {
      await API.put(`/procedures/${selected._id}/step/${stepId}`, { status: newStatus });

      // Update locally
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

      if (newStatus === "in-progress") startTimer(stepId);
      else stopTimer(stepId);

      socket.emit?.("procedureUpdated", { id: selected._id });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to update step", variant: "danger" });
    }
  };

  const handleAddVitals = async (vitals) => {
    if (!selected) return;
    try {
      await API.post(`/procedures/${selected._id}/vitals`, vitals);
      fetchProcedures();
      setAlert({ show: true, message: "Vitals recorded", variant: "success" });
      socket.emit?.("procedureUpdated", { id: selected._id });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to record vitals", variant: "danger" });
    }
  };

  const handleCompleteProcedure = async () => {
    if (!selected) return;
    try {
      await API.put(`/procedures/${selected._id}/complete`);
      fetchProcedures();
      setAlert({ show: true, message: "Procedure completed", variant: "success" });
      socket.emit?.("procedureUpdated", { id: selected._id, action: "complete" });
      setSelectedId("");
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to complete procedure", variant: "danger" });
    }
  };

  const activeList = procedures.filter(p => p.status !== "completed");
  const completedList = procedures.filter(p => p.status === "completed");

  return (
    <div className="container py-4">
      <h3 className="mb-3 text-success">Panchakarma Procedure Tracker</h3>

      {alert.show && <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>{alert.message}</Alert>}

      <Card className="mb-3 p-3">
        <Form.Group>
          <Form.Label>Select Procedure Session</Form.Label>
          <Form.Select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- choose active procedure --</option>
            {activeList.map(p => (
              <option key={p._id} value={p._id}>
                {p.procedureName || p.therapyType || "Unnamed"} — {p.patientId?.name || "Unknown"} ({p.status || "N/A"})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Card>

      {selected ? (
        <Card className="mb-3 p-3">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="mb-1">{selected.procedureName || selected.therapyType || "Procedure"}</h5>
              <div className="text-muted">
                <strong>Patient:</strong> {selected.patientId?.name || "Unknown"} &nbsp; • &nbsp;
                <strong>Therapist:</strong> {selected.therapistId?.name || "Unknown"}
              </div>
            </Col>
            <Col md={4} className="text-end">
              <div style={{ width: "160px", margin: "0 auto" }}>
                <ProgressBar now={calculateProgress(selected.steps)} label={`${calculateProgress(selected.steps)}%`} />
                <small className="text-muted">Progress</small>
              </div>
            </Col>
          </Row>
        </Card>
      ) : (
        <Card className="mb-3 p-3"><div className="text-muted">Select an active procedure to see summary & controls</div></Card>
      )}

      <Card className="mb-3 p-3">
        <Row className="g-2 align-items-center">
          <Col md={8}>
            <Form.Select value={addStepName} onChange={e => setAddStepName(e.target.value)}>
              <option value="">Add additional procedure (choose)</option>
              {AYURVEDIC_PROCEDURES.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Button onClick={handleAddStep} disabled={!selected || !addStepName}>➕ Add Step</Button>
          </Col>
        </Row>
      </Card>

      <h6 className="mb-2">Active Procedures</h6>
      {loading && <Spinner animation="border" variant="success" />}
      {activeList.length === 0 && <div className="text-muted mb-3">No active procedures</div>}
      {activeList.map(proc => (
        <Card className="mb-2" key={proc._id}>
          <Card.Body>
            <Row>
              <Col md={8}>
                <strong>{proc.procedureName || proc.therapyType || "Procedure"}</strong><br />
                <small className="text-muted">{proc.patientId?.name || "Unknown patient"}</small>
              </Col>
              <Col md={2} className="text-end">
                <Badge bg="info">{calculateProgress(proc.steps)}%</Badge>
              </Col>
              <Col md={2} className="text-end">
                <Button size="sm" variant={selectedId === proc._id ? "outline-secondary" : "primary"} onClick={() => setSelectedId(proc._id)}>
                  Track
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}

      {selected && (
        <Card className="my-3 p-3">
          <h6>Steps</h6>
          {(!selected.steps || selected.steps.length === 0) && <div className="text-muted">No steps yet</div>}
          {selected.steps?.map(step => (
            <div key={step._id} className="mb-2">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{step.stepName}</strong> &nbsp;
                  <Badge bg={step.status === "completed" ? "success" : step.status === "in-progress" ? "warning" : "secondary"}>
                    {step.status}
                  </Badge>
                  <div className="text-muted small">{step.description}</div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <div className="me-2 small text-info">{formatTime(step.elapsed || 0)}</div>
                  <Button size="sm" onClick={() => setExpandedSteps(prev => ({ ...prev, [step._id]: !prev[step._id] }))}>
                    {expandedSteps[step._id] ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant={step.status === "in-progress" ? "outline-success" : "success"} onClick={() => handleUpdateStep(step._id, step.status === "in-progress" ? "completed" : "in-progress")}>
                    {step.status === "in-progress" ? "Complete" : "Start"}
                  </Button>
                </div>
              </div>

              <Collapse in={!!expandedSteps[step._id]}>
                <div className="mt-2 p-2 border rounded">
                  <div className="mb-1"><strong>Notes:</strong> {step.notes || "—"}</div>
                  <div className="mb-1"><strong>Start:</strong> {step.startTime ? new Date(step.startTime).toLocaleTimeString() : "—"}</div>
                  <div className="mb-1"><strong>End:</strong> {step.endTime ? new Date(step.endTime).toLocaleTimeString() : "—"}</div>
                </div>
              </Collapse>
            </div>
          ))}

          <div className="mt-3 d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={fetchProcedures}>Refresh</Button>
            <Button variant="success" onClick={handleCompleteProcedure}>Complete Procedure</Button>
          </div>
        </Card>
      )}

      <h6 className="mt-4">Completed Procedures</h6>
      {completedList.length === 0 && <div className="text-muted">No completed procedures yet</div>}
      {completedList.map(proc => (
        <Card key={proc._id} className="mb-2 p-2">
          <Row>
            <Col>
              <strong>{proc.procedureName || proc.therapyType}</strong>
              <div className="text-muted small">{proc.patientId?.name || "Unknown"}</div>
            </Col>
            <Col className="text-end">
              <Badge bg="success">Completed</Badge>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
}
