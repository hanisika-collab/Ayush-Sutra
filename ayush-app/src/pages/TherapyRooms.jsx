import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import { PlusCircle, Pencil, Trash, DoorOpen } from "react-bootstrap-icons";

const TherapyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Room form
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    location: "",
    capacity: 1,
    available: true,
    resources: [],
  });

  // Slots state
  const [slots, setSlots] = useState([]);
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: 0,
    startTime: "",
    endTime: "",
    maxConcurrent: 1,
  });
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);

  // ✅ FIXED: Fetch rooms with proper error handling
  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please login.");
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('🏠 Fetching rooms with token...');
      const res = await API.get("/admin/rooms", { headers });
      
      console.log("📋 Fetched rooms:", res.data);
      setRooms(res.data || []);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("❌ Failed to fetch rooms:", err);
      
      // ✅ FIXED: Better error handling without redirecting
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Authentication failed. Please logout and login again.");
      } else {
        setError(err.response?.data?.error || "Failed to fetch rooms");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Room form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" ? checked : (name === "capacity" ? Number(value) : value)
    });
  };

  // Slot form change
  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setSlotForm({
      ...slotForm,
      [name]: ["dayOfWeek", "maxConcurrent"].includes(name) ? Number(value) : value,
    });
  };

  // Add or update slot
  const addOrUpdateSlot = () => {
    if (!slotForm.startTime || !slotForm.endTime) {
      setError("Please fill in start and end time");
      setTimeout(() => setError(""), 2000);
      return;
    }
    
    if (editingSlotIndex !== null) {
      const updatedSlots = [...slots];
      updatedSlots[editingSlotIndex] = slotForm;
      setSlots(updatedSlots);
      setSuccess("Slot updated");
    } else {
      setSlots([...slots, slotForm]);
      setSuccess("Slot added");
    }
    
    setSlotForm({ dayOfWeek: 0, startTime: "", endTime: "", maxConcurrent: 1 });
    setEditingSlotIndex(null);
    
    setTimeout(() => setSuccess(""), 2000);
  };

  const editSlot = (index) => {
    setSlotForm(slots[index]);
    setEditingSlotIndex(index);
  };

  const deleteSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
    setSuccess("Slot removed");
    setTimeout(() => setSuccess(""), 2000);
  };

  // Open modal for add/edit
  const handleShowModal = (room = null) => {
    setError("");
    setSuccess("");
    
    if (room) {
      setEditMode(true);
      setSelectedRoom(room);
      setFormData({
        name: room.name || "",
        type: room.type || "",
        location: room.location || "",
        capacity: room.capacity || 1,
        available: room.available !== undefined ? room.available : true,
        resources: room.resources || [],
      });
      setSlots(room.slots || []);
    } else {
      setEditMode(false);
      setSelectedRoom(null);
      setFormData({ 
        name: "", 
        type: "", 
        location: "",
        capacity: 1, 
        available: true, 
        resources: [] 
      });
      setSlots([]);
    }
    setEditingSlotIndex(null);
    setSlotForm({ dayOfWeek: 0, startTime: "", endTime: "", maxConcurrent: 1 });
    setShowModal(true);
  };

  // ✅ FIXED: Save room with proper error handling
  const handleSave = async () => {
    setError("");
    setSuccess("");
    
    if (!formData.name || !formData.type) {
      setError("Please fill in room name and type");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = { 
        ...formData, 
        slots,
        capacity: Number(formData.capacity) || 1
      };
      
      console.log("💾 Saving room:", payload);
      
      if (editMode && selectedRoom) {
        await API.put(`/admin/rooms/${selectedRoom._id}`, payload, { headers });
        setSuccess("Room updated successfully!");
      } else {
        await API.post("/admin/rooms", payload, { headers });
        setSuccess("Room created successfully!");
      }
      
      setShowModal(false);
      fetchRooms();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Error saving room:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Authentication failed. Please logout and login again.");
      } else {
        setError(err.response?.data?.error || "Failed to save room");
      }
    }
  };

  // ✅ FIXED: Delete with proper error handling
  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      
      await API.delete(`/admin/rooms/${id}`, { headers });
      setSuccess("Room deleted successfully!");
      fetchRooms();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("❌ Failed to delete room:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Authentication failed. Please logout and login again.");
      } else {
        setError(err.response?.data?.error || "Failed to delete room");
      }
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{ minHeight: "100vh", marginLeft: "250px", overflowX: "hidden" }}
      >
        <Header title="Therapy Room Management" />
        <Container className="py-4">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              <strong>Error:</strong> {error}
              {error.includes("Authentication") && (
                <div className="mt-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = "/";
                    }}
                  >
                    Go to Login
                  </Button>
                </div>
              )}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-success mb-0">
                  <DoorOpen className="me-2" />
                  Therapy Rooms ({rooms.length})
                </h5>
                <Button
                  variant="success"
                  className="rounded-pill d-flex align-items-center"
                  onClick={() => handleShowModal()}
                  disabled={loading}
                >
                  <PlusCircle className="me-2" /> Add Room
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                  <p className="mt-2 text-muted">Loading rooms...</p>
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <DoorOpen size={48} className="mb-3" />
                  <p>No therapy rooms found. Create one to get started!</p>
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-success">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Slots</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td><strong>{room.name}</strong></td>
                        <td>{room.type || "N/A"}</td>
                        <td>{room.location || "N/A"}</td>
                        <td>{room.capacity || 1}</td>
                        <td>
                          <Badge bg="info">{room.slots?.length || 0} slots</Badge>
                        </td>
                        <td>
                          {room.available ? (
                            <Badge bg="success">Available</Badge>
                          ) : (
                            <Badge bg="danger">Unavailable</Badge>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(room)}
                          >
                            <Pencil /> Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRoom(room._id)}
                          >
                            <Trash /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="text-success">
              {editMode ? "Edit Room" : "Add New Room"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Room Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Shirodhara Room 1"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Shirodhara">Shirodhara</option>
                  <option value="Abhyanga">Abhyanga</option>
                  <option value="Pizhichil">Pizhichil</option>
                  <option value="Swedana">Swedana</option>
                  <option value="Udvartana">Udvartana</option>
                  <option value="Nasya">Nasya</option>
                  <option value="General">General Purpose</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Ground Floor, Wing A"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  max="10"
                />
                <Form.Text className="text-muted">
                  Maximum number of patients that can be treated simultaneously
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Room is Available"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                />
              </Form.Group>

              <hr />

              {/* Slots Management */}
              <h6 className="mb-3">Time Slots</h6>
              <div className="d-flex gap-2 mb-2 flex-wrap">
                <Form.Select
                  name="dayOfWeek"
                  value={slotForm.dayOfWeek}
                  onChange={handleSlotChange}
                  style={{ flex: "1 1 150px" }}
                >
                  {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="time"
                  name="startTime"
                  value={slotForm.startTime}
                  onChange={handleSlotChange}
                  style={{ flex: "1 1 120px" }}
                />
                <Form.Control
                  type="time"
                  name="endTime"
                  value={slotForm.endTime}
                  onChange={handleSlotChange}
                  style={{ flex: "1 1 120px" }}
                />
                <Form.Control
                  type="number"
                  name="maxConcurrent"
                  value={slotForm.maxConcurrent}
                  onChange={handleSlotChange}
                  min={1}
                  placeholder="Max"
                  style={{ flex: "1 1 80px" }}
                />
                <Button
                  variant="success"
                  onClick={addOrUpdateSlot}
                  style={{ flex: "0 0 auto" }}
                >
                  {editingSlotIndex !== null ? "Update" : "Add"}
                </Button>
              </div>

              {/* Slots Table */}
              {slots.length > 0 ? (
                <Table size="sm" bordered striped className="mt-3">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Max</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((s, i) => (
                      <tr key={i}>
                        <td>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][s.dayOfWeek]}</td>
                        <td>{s.startTime}</td>
                        <td>{s.endTime}</td>
                        <td>{s.maxConcurrent}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => editSlot(i)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteSlot(i)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted small mt-2">No slots added yet</p>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSave}>
              {editMode ? "Update Room" : "Create Room"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default TherapyRooms;