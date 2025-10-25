import React, { useEffect, useState, useRef } from "react";
import { Card, Form, Button, ProgressBar, Spinner, Alert } from "react-bootstrap";
import API from "../api";
import io from "socket.io-client";
import { Link } from "react-router-dom";

const socket = io("http://localhost:4000");

export default function ProcedureTracker() {
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({ heartRate: "", bloodPressure: "", temperature: "" });
  const [updatingStep, setUpdatingStep] = useState(false);
  const [addingVitals, setAddingVitals] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "danger" });
  const timersRef = useRef({});
  const [totalElapsed, setTotalElapsed] = useState(0);

  useEffect(() => {
    fetchProcedures();
    socket.on("refreshProcedures", fetchProcedures);

    return () => {
      socket.off("refreshProcedures", fetchProcedures);
      Object.values(timersRef.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    Object.values(timersRef.current).forEach(clearInterval);
    timersRef.current = {};
    setTotalElapsed(0);

    if (selectedProcedure) {
      selectedProcedure.steps.forEach((step, index) => {
        if (step.status === "in-progress") startStepTimer(index, step.elapsed || 0);
      });
    }
  }, [selectedProcedure]);

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      const res = await API.get("/procedures");
      setProcedures(res.data);
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Failed to fetch procedures", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleVitalsSubmit = async () => {
    if (!selectedProcedure) return;
    try {
      setAddingVitals(true);
      await API.post(`/procedures/${selectedProcedure._id}/vitals`, vitals);
      setVitals({ heartRate: "", bloodPressure: "", temperature: "" });
      fetchProcedures();
      setAlert({ show: true, message: "Vitals added successfully", variant: "success" });
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Error adding vitals", variant: "danger" });
    } finally {
      setAddingVitals(false);
    }
  };

  const updateStep = async (stepIndex, status) => {
    if (!selectedProcedure) return;
    try {
      setUpdatingStep(true);

      setProcedures((prev) =>
        prev.map((proc) => {
          if (proc._id === selectedProcedure._id) {
            const updatedSteps = proc.steps.map((s, i) =>
              i === stepIndex ? { ...s, status, elapsed: s.elapsed || 0 } : s
            );
            return { ...proc, steps: updatedSteps };
          }
          return proc;
        })
      );

      await API.put(`/procedures/${selectedProcedure._id}/step`, { stepIndex, status });

      if (status === "in-progress") startStepTimer(stepIndex);
      else stopStepTimer(stepIndex, false);

      fetchProcedures();
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Error updating step", variant: "danger" });
    } finally {
      setUpdatingStep(false);
    }
  };

  const startStepTimer = (index, initial = 0) => {
    if (timersRef.current[index]) return;

    timersRef.current[index] = setInterval(() => {
      setProcedures((prev) =>
        prev.map((proc) => {
          if (proc._id === selectedProcedure._id) {
            const updatedSteps = proc.steps.map((s, i) => {
              if (i === index) {
                const newElapsed = (s.elapsed || initial) + 1;
                setTotalElapsed((prev) => prev + 1);
                return { ...s, elapsed: newElapsed };
              }
              return s;
            });
            return { ...proc, steps: updatedSteps };
          }
          return proc;
        })
      );
    }, 1000);
  };

  const stopStepTimer = (index, reset = false) => {
    clearInterval(timersRef.current[index]);
    delete timersRef.current[index];

    if (reset && selectedProcedure) {
      setProcedures((prev) =>
        prev.map((proc) => {
          if (proc._id === selectedProcedure._id) {
            const updatedSteps = proc.steps.map((s, i) =>
              i === index ? { ...s, elapsed: 0, status: "pending" } : s
            );
            return { ...proc, steps: updatedSteps };
          }
          return proc;
        })
      );
    }
  };

  const completeProcedure = async () => {
    if (!selectedProcedure) return;

    try {
      setUpdatingStep(true);
      setProcedures((prev) =>
        prev.map((proc) =>
          proc._id === selectedProcedure._id
            ? { ...proc, status: "completed" }
            : proc
        )
      );

      Object.values(timersRef.current).forEach(clearInterval);
      timersRef.current = {};

      await API.put(`/procedures/${selectedProcedure._id}/complete`);
      setAlert({ show: true, message: "Procedure marked as completed!", variant: "success" });
      fetchProcedures();
    } catch (err) {
      console.error(err);
      setAlert({ show: true, message: "Error completing procedure", variant: "danger" });
    } finally {
      setUpdatingStep(false);
    }
  };

  const current = procedures.find((p) => p._id === selectedProcedure?._id);

  const calculateProgress = (steps) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter((s) => s.status === "completed").length;
    return Math.round((completed / steps.length) * 100);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-success fw-bold">✅ Panchakarma Procedure Tracker</h3>

      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}

      <Card className="shadow-sm p-3 mb-4">
        <Form.Group>
          <Form.Label className="fw-semibold">Select Ongoing Procedure</Form.Label>
          <Form.Select
            onChange={(e) =>
              setSelectedProcedure(procedures.find((p) => p._id === e.target.value))
            }
          >
            <option value="">-- Choose a session --</option>
            {procedures.map((p) => (
              <option key={p._id} value={p._id}>
                {p.procedureName} — {p.patientId?.name} ({p.status})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Card>

      {loading && <Spinner animation="border" className="text-success" />}

      {current && (
        <>
          <Card className="shadow-sm p-3 mb-4 border-success">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="text-success fw-bold">🧘 Procedure: {current.procedureName}</h5>
              <strong>Total Time: {formatTime(totalElapsed)}</strong>
            </div>

            <p>
              <strong>Patient:</strong> {current.patientId?.name || "Unknown"} <br />
              <strong>Therapist:</strong> {current.therapistId?.name || "Unknown"} <br />
              <strong>Status:</strong>{" "}
              <span className="text-primary">{current.status}</span>
            </p>

            {/* ✅ Corrected Link to include procedure ID */}
            <div className="mb-3">
              <Link
                to={`/procedure-details/${current._id}`}
                className="btn btn-info"
              >
                View Details
              </Link>
            </div>

            {current.status !== "completed" && (
              <Button
                variant="success"
                className="mb-3"
                onClick={completeProcedure}
                disabled={updatingStep}
              >
                Complete Procedure ✅
              </Button>
            )}

            <h6 className="fw-semibold mb-2">Procedure Steps</h6>
            <ProgressBar
              now={calculateProgress(current.steps)}
              label={`${calculateProgress(current.steps)}%`}
              className="mb-3"
            />

            {current.steps.map((step, index) => (
              <Card
                key={index}
                className="mb-2 p-2 border border-success-subtle rounded-3"
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <strong>{step.stepName}</strong>
                    <div className="text-muted small">{step.notes || ""}</div>
                    <div className="text-info small">
                      ⏱ {formatTime(step.elapsed || 0)}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      variant={
                        step.completed ? "success" : "outline-success"
                      }
                      size="sm"
                      disabled={updatingStep || current.status === "completed"}
                      onClick={() =>
                        updateStep(
                          index,
                          step.completed ? "pending" : "in-progress"
                        )
                      }
                    >
                      {step.completed ? "✓ Done" : "Start / Complete"}
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      disabled={updatingStep || current.status === "completed"}
                      onClick={() => stopStepTimer(index, true)}
                    >
                      Stop / Reset
                    </Button>
                  </div>
                </div>
                <ProgressBar
                  now={step.completed ? 100 : 50}
                  variant={step.completed ? "success" : "info"}
                />
              </Card>
            ))}
          </Card>

          {/* Vitals Section */}
          <Card className="shadow-sm p-3 border border-success">
            <h6 className="fw-semibold text-success mb-3">💓 Record Patient Vitals</h6>
            <div className="row">
              <div className="col-md-3 mb-2">
                <Form.Control
                  placeholder="Heart Rate (bpm)"
                  value={vitals.heartRate}
                  onChange={(e) =>
                    setVitals({ ...vitals, heartRate: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3 mb-2">
                <Form.Control
                  placeholder="Blood Pressure"
                  value={vitals.bloodPressure}
                  onChange={(e) =>
                    setVitals({ ...vitals, bloodPressure: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3 mb-2">
                <Form.Control
                  placeholder="Temperature (°C)"
                  value={vitals.temperature}
                  onChange={(e) =>
                    setVitals({ ...vitals, temperature: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <Button
                  variant="success"
                  onClick={handleVitalsSubmit}
                  disabled={addingVitals}
                >
                  {addingVitals ? "Adding..." : "Add Vitals"}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
