import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Container, Row, Col, Card, Spinner, Alert, Button } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { PeopleFill, Activity, HouseFill } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import API from "../api";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({ patients: 0, therapies: 0, rooms: 0 });
  const [latestProcedure, setLatestProcedure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      // Fetch current user info
      const meRes = await API.get("/admin/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRole(meRes.data.role);

      let patientsCount = 0;
      let therapiesCount = 0;
      let roomsCount = 0;

      if (meRes.data.role === "admin") {
        const [patientsRes, roomsRes] = await Promise.all([
          API.get("/patients", { headers: { Authorization: `Bearer ${token}` } }),
          API.get("/admin/rooms", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        patientsCount = Array.isArray(patientsRes.data) ? patientsRes.data.length : 0;
        roomsCount = Array.isArray(roomsRes.data) ? roomsRes.data.length : 0;
        therapiesCount = 0;
      } else if (meRes.data.role === "doctor") {
        patientsCount = meRes.data.patients?.length || 0;
      } else if (meRes.data.role === "therapist") {
        therapiesCount = meRes.data.therapies?.length || 0;
      } else if (meRes.data.role === "patient") {
        therapiesCount = meRes.data.therapies?.length || 0;
      }

      setStats({ patients: patientsCount, therapies: therapiesCount, rooms: roomsCount });

      // 🧘 Fetch latest procedure summary
      try {
        const procRes = await API.get("/procedure-sessions/latest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLatestProcedure(procRes.data || null);
      } catch (err) {
        console.warn("No recent procedure found");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.error || "Failed to fetch dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = {
    labels: ["Patients", "Therapies", "Rooms"],
    datasets: [
      {
        label: "Current Stats",
        data: [stats.patients, stats.therapies, stats.rooms],
        backgroundColor: ["rgba(25,135,84,0.8)"],
      },
    ],
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Spinner animation="border" variant="success" />
      </div>
    );

  if (error)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <Alert variant="danger">{error}</Alert>
      </div>
    );

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px", overflowX: "hidden" }}
      >
        <Header title={`Dashboard (${role.toUpperCase()})`} />
        <Container className="py-4">
          {/* Stats Cards */}
          <Row className="g-4 mb-4">
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <PeopleFill size={28} color="#198754" />
                <h5 className="mt-2">Patients</h5>
                <h3 className="fw-bold text-success">{stats.patients}</h3>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <Activity size={28} color="#198754" />
                <h5 className="mt-2">Therapies</h5>
                <h3 className="fw-bold text-success">{stats.therapies}</h3>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm border-0 rounded-4 text-center py-3">
                <HouseFill size={28} color="#198754" />
                <h5 className="mt-2">Rooms</h5>
                <h3 className="fw-bold text-success">{stats.rooms}</h3>
              </Card>
            </Col>
          </Row>

          {/* Chart */}
          <Card className="shadow-sm border-0 rounded-4 p-4 mb-4">
            <h6 className="fw-semibold mb-3 text-success">Overview Statistics</h6>
            <div style={{ height: "280px", width: "80%", margin: "0 auto" }}>
              <Bar
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </Card>

          {/* 🧘 Procedure Details Summary */}
          <Card className="shadow-sm border-0 rounded-4 p-4">
            <h6 className="fw-semibold mb-3 text-success">🧘 Latest Procedure Details</h6>
            {latestProcedure ? (
              <>
                <p><strong>Patient:</strong> {latestProcedure.patientName}</p>
                <p><strong>Disease:</strong> {latestProcedure.disease}</p>
                <p><strong>Procedure:</strong> {latestProcedure.procedureName}</p>
                <p><strong>Current Step:</strong> {latestProcedure.currentStep}</p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      latestProcedure.status === "completed"
                        ? "text-success"
                        : "text-primary"
                    }
                  >
                    {latestProcedure.status}
                  </span>
                </p>
                <Button
                  variant="success"
                  as={Link}
                  to={`/procedure-details/${latestProcedure._id}`}
                >
                  View Full Details →
                </Button>
              </>
            ) : (
              <p className="text-muted">No ongoing or recent procedure found.</p>
            )}
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default Dashboard;
