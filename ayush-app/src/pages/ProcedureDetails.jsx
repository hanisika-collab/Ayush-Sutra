import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";
import { Spinner, Card } from "react-bootstrap";

export default function ProcedureDetails() {
  const { id } = useParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const res = await API.get(`/sessions/${id}`);
      setSession(res.data);
    };
    fetchSession();
  }, [id]);

  if (!session) return <Spinner animation="border" className="m-5" />;

  return (
    <Card className="p-3">
      <h4>{session.therapyType} — {session.patientId?.name}</h4>
      <p>Therapist: {session.therapistId?.name}</p>
      <p>Status: {session.status}</p>
      <h5>Steps:</h5>
      {session.steps.map((s, i) => (
        <div key={i}>
          {s.stepName} — {s.status}
        </div>
      ))}
      <h5>Vitals:</h5>
      {session.vitals?.map((v, i) => (
        <div key={i}>{v.heartRate} bpm | {v.bloodPressure} | {v.temperature}°C</div>
      ))}
    </Card>
  );
}
