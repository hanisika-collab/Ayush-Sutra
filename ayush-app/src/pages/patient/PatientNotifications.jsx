// src/pages/patient/PatientNotifications.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  ListGroup,
  Tab,
  Tabs,
  Button,
} from "react-bootstrap";
import {
  Bell,
  Envelope,
  EnvelopeOpen,
  Trash,
  CheckCircleFill,
} from "react-bootstrap-icons";
import PatientSidebar from "../../components/PatientSidebar";
import Header from "../../components/Header";
import API from "../../api";

const PatientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = currentUser._id || currentUser.id || localStorage.getItem("userId");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await API.get(`/notifications/user/${userId}`, { headers });

      console.log("📬 Fetched notifications:", res.data);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
      setError(err.response?.data?.error || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      setError("User ID not found. Please login again.");
      setLoading(false);
    }
  }, []);

  // Mark as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.put(`/notifications/${id}/read`, {}, { headers });
      setSuccess("Notification marked as read");
      fetchNotifications();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("❌ Mark as read error:", err);
      setError("Failed to mark notification as read");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const unreadNotifications = notifications.filter(
        (n) => n.status !== "read"
      );

      // Mark all unread as read
      await Promise.all(
        unreadNotifications.map((n) =>
          API.put(`/notifications/${n._id}/read`, {}, { headers })
        )
      );

      setSuccess("All notifications marked as read");
      fetchNotifications();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("❌ Mark all as read error:", err);
      setError("Failed to mark all as read");
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await API.delete(`/notifications/${id}`, { headers });
      setSuccess("Notification deleted");
      fetchNotifications();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("❌ Delete notification error:", err);
      setError("Failed to delete notification");
    }
  };

  // Filter notifications
  const filterNotifications = (type) => {
    if (type === "all") return notifications;
    if (type === "unread")
      return notifications.filter((n) => n.status !== "read");
    return notifications.filter((n) => n.type === type);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "pre-therapy":
        return "🧘";
      case "post-therapy":
        return "✨";
      case "daily-tip":
        return "💡";
      case "appointment-reminder":
        return "📅";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "pre-therapy":
        return "primary";
      case "post-therapy":
        return "success";
      case "daily-tip":
        return "info";
      case "appointment-reminder":
        return "warning";
      default:
        return "secondary";
    }
  };

  const filteredNotifications = filterNotifications(activeTab);

  return (
    <div className="d-flex">
      <PatientSidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px" }}
      >
        <Header title="My Notifications" />
        <Container className="py-4">
          {/* Header Section */}
          <Card className="mb-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <h4 className="mb-2">
                    <Bell className="me-2" />
                    Notifications & Reminders
                    {unreadCount > 0 && (
                      <Badge bg="danger" className="ms-2">
                        {unreadCount} New
                      </Badge>
                    )}
                  </h4>
                  <p className="text-muted mb-0">
                    Stay updated with your therapy sessions, wellness tips, and
                    reminders
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      <CheckCircleFill className="me-2" />
                      Mark All Read
                    </Button>
                  )}
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

          {/* Notifications List */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="all" title={`All (${notifications.length})`}>
                  {/* Content rendered below */}
                </Tab>
                <Tab
                  eventKey="unread"
                  title={
                    <>
                      Unread{" "}
                      {unreadCount > 0 && (
                        <Badge bg="danger">{unreadCount}</Badge>
                      )}
                    </>
                  }
                >
                  {/* Content rendered below */}
                </Tab>
                <Tab eventKey="pre-therapy" title="Pre-Therapy">
                  {/* Content rendered below */}
                </Tab>
                <Tab eventKey="post-therapy" title="Post-Therapy">
                  {/* Content rendered below */}
                </Tab>
                <Tab eventKey="daily-tip" title="Daily Tips">
                  {/* Content rendered below */}
                </Tab>
                <Tab eventKey="appointment-reminder" title="Appointments">
                  {/* Content rendered below */}
                </Tab>
              </Tabs>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2 text-muted">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Bell size={48} className="mb-3 opacity-50" />
                  <p>No notifications found</p>
                  {activeTab === "unread" && (
                    <p className="small">All caught up! 🎉</p>
                  )}
                </div>
              ) : (
                <ListGroup variant="flush">
                  {filteredNotifications.map((notification) => (
                    <ListGroup.Item
                      key={notification._id}
                      className={`${
                        notification.status !== "read" ? "bg-light" : ""
                      } border-start border-4 border-${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      <Row className="align-items-start">
                        <Col xs={1} className="text-center">
                          <span style={{ fontSize: "2rem" }}>
                            {getNotificationIcon(notification.type)}
                          </span>
                        </Col>
                        <Col xs={9}>
                          <div className="d-flex align-items-center mb-1">
                            <h6 className="mb-0 me-2">{notification.title}</h6>
                            <Badge
                              bg={getNotificationColor(notification.type)}
                            >
                              {notification.type}
                            </Badge>
                            {notification.status !== "read" && (
                              <Badge bg="danger" className="ms-2">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="mb-2 text-muted">
                            {notification.message}
                          </p>
                          <small className="text-muted">
                            {notification.channel === "email" && (
                              <Envelope className="me-1" />
                            )}
                            {new Date(notification.createdAt).toLocaleString()}
                            {notification.metadata?.therapyType && (
                              <> • {notification.metadata.therapyType}</>
                            )}
                            {notification.metadata?.therapistName && (
                              <> • Therapist: {notification.metadata.therapistName}</>
                            )}
                          </small>
                        </Col>
                        <Col xs={2} className="text-end">
                          {notification.status !== "read" && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => markAsRead(notification._id)}
                              title="Mark as read"
                            >
                              <EnvelopeOpen size={14} />
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="mb-1"
                            onClick={() =>
                              deleteNotification(notification._id)
                            }
                            title="Delete"
                          >
                            <Trash size={14} />
                          </Button>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          {/* Statistics Card */}
          <Card className="mt-4 shadow-sm border-0 rounded-4">
            <Card.Body>
              <h6 className="mb-3">Notification Statistics</h6>
              <Row>
                <Col md={3} className="text-center">
                  <div className="p-3 bg-primary bg-opacity-10 rounded">
                    <h3 className="text-primary mb-0">
                      {notifications.length}
                    </h3>
                    <small className="text-muted">Total</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="p-3 bg-danger bg-opacity-10 rounded">
                    <h3 className="text-danger mb-0">{unreadCount}</h3>
                    <small className="text-muted">Unread</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="p-3 bg-info bg-opacity-10 rounded">
                    <h3 className="text-info mb-0">
                      {
                        notifications.filter((n) => n.type === "daily-tip")
                          .length
                      }
                    </h3>
                    <small className="text-muted">Daily Tips</small>
                  </div>
                </Col>
                <Col md={3} className="text-center">
                  <div className="p-3 bg-success bg-opacity-10 rounded">
                    <h3 className="text-success mb-0">
                      {
                        notifications.filter((n) => n.type === "pre-therapy")
                          .length
                      }
                    </h3>
                    <small className="text-muted">Therapy Reminders</small>
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

export default PatientNotifications;