import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, Spinner, Alert, ProgressBar, Table } from "react-bootstrap";
import API from "../api";

export default function ProcedureDetails() {
  const { id } = useParams();
  const [procedure, setProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProcedure = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/procedures/${id}`);
      setProcedure(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to fetch procedure details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedure();
  }, [id]);

  const calculateProgress = (steps) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter((s) => s.completed).length;
    return Math.round((completed / steps.length) * 100);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <Spinner animation="border" variant="success" />
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="mt-4 text-center">
        {error}
      </Alert>
    );

  if (!procedure)
    return (
      <Alert variant="warning" className="mt-4 text-center">
        Procedure not found
      </Alert>
    );

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-success fw-bold">
        🧘 Procedure Details — {procedure.procedureName}
      </h3>

      <Card className="shadow-sm p-3 mb-4">
        <p>
          <strong>Patient:</strong> {procedure.patientId?.name || "Unknown"} <br />
          <strong>Therapist:</strong> {procedure.therapistId?.name || "Unknown"} <br />
          <strong>Status:</strong>{" "}
          <span className={procedure.status === "completed" ? "text-success" : "text-primary"}>
            {procedure.status}
          </span>
          <br />
          <strong>Diagnosis:</strong> {procedure.diagnosis || "-"} <br />
          <strong>Disease:</strong> {procedure.disease || "-"} <br />
          <strong>Session Date:</strong> {new Date(procedure.sessionDate).toLocaleString()}
        </p>

        <Link to="/procedure-tracker" className="btn btn-outline-success">
          ← Back to Tracker
        </Link>
      </Card>

      {/* Procedure Steps */}
      <Card className="shadow-sm p-3 mb-4 border-success">
        <h5 className="fw-semibold mb-3 text-success">📝 Procedure Steps</h5>
        <ProgressBar
          now={calculateProgress(procedure.steps)}
          label={`${calculateProgress(procedure.steps)}%`}
          className="mb-3"
        />
        {procedure.steps.map((step, index) => (
          <Card key={index} className="mb-2 p-2 border border-success-subtle rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{step.stepName}</strong>
                <div className="text-muted small">{step.notes || ""}</div>
                <div className="text-info small">⏱ {formatTime(step.elapsed || 0)}</div>
              </div>
              <span className={step.completed ? "badge bg-success" : "badge bg-secondary"}>
                {step.completed ? "Completed" : "Pending"}
              </span>
            </div>
          </Card>
        ))}
      </Card>

      {/* Vitals */}
      <Card className="shadow-sm p-3 border-success">
        <h5 className="fw-semibold mb-3 text-success">💓 Recorded Vitals</h5>
        {procedure.vitals?.length > 0 ? (
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Heart Rate (bpm)</th>
                <th>Blood Pressure</th>
                <th>Temperature (°C)</th>
                <th>Remarks</th>
                <th>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {procedure.vitals.map((v, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{v.pulse || "-"}</td>
                  <td>{v.bp || "-"}</td>
                  <td>{v.temperature || "-"}</td>
                  <td>{v.remarks || "-"}</td>
                  <td>{new Date(v.recordedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-muted">No vitals recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
