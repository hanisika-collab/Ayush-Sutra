// src/components/SessionForm.js
import React, { useState, useEffect } from "react";
import { Form, Button, Modal } from "react-bootstrap";

const SessionForm = ({ session, onClose, onSaved }) => {
  const [form, setForm] = useState({
    patientId: "",
    therapistId: "",
    roomId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (session) setForm(session);
  }, [session]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = session ? "PUT" : "POST";
    const url = session
      ? `http://localhost:5000/api/sessions/${session._id}`
      : `http://localhost:5000/api/sessions`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Session saved!");
      onSaved();
      onClose();
    } else {
      alert(data.error || "Error saving session.");
    }
  };

  return (
    <Modal.Body>
      <h5>{session ? "Edit Session" : "New Session"}</h5>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-2">
          <Form.Label>Patient ID</Form.Label>
          <Form.Control
            name="patientId"
            value={form.patientId}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Therapist ID</Form.Label>
          <Form.Control
            name="therapistId"
            value={form.therapistId}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Room ID</Form.Label>
          <Form.Control
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Start Time</Form.Label>
          <Form.Control
            type="datetime-local"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>End Time</Form.Label>
          <Form.Control
            type="datetime-local"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="notes"
            value={form.notes}
            onChange={handleChange}
          />
        </Form.Group>

        <div className="text-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>{" "}
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </Form>
    </Modal.Body>
  );
};

export default SessionForm;
