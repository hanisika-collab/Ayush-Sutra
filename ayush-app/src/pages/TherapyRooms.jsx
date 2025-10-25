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
} from "react-bootstrap";
import { PlusCircle, Pencil, Trash } from "react-bootstrap-icons";

const TherapyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Room form
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    capacity: "",
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

  // Fetch all rooms
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/rooms");
      setRooms(res.data);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
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
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
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
    if (!slotForm.startTime || !slotForm.endTime) return;
    if (editingSlotIndex !== null) {
      const updatedSlots = [...slots];
      updatedSlots[editingSlotIndex] = slotForm;
      setSlots(updatedSlots);
    } else {
      setSlots([...slots, slotForm]);
    }
    setSlotForm({ dayOfWeek: 0, startTime: "", endTime: "", maxConcurrent: 1 });
    setEditingSlotIndex(null);
  };

  const editSlot = (index) => {
    setSlotForm(slots[index]);
    setEditingSlotIndex(index);
  };

  const deleteSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  // Open modal for add/edit
  const handleShowModal = (room = null) => {
    if (room) {
      setEditMode(true);
      setSelectedRoom(room);
      setFormData({
        name: room.name,
        type: room.type,
        capacity: room.capacity || "",
        available: room.available,
        resources: room.resources || [],
      });
      setSlots(room.slots || []);
    } else {
      setEditMode(false);
      setFormData({ name: "", type: "", capacity: "", available: true, resources: [] });
      setSlots([]);
    }
    setEditingSlotIndex(null);
    setSlotForm({ dayOfWeek: 0, startTime: "", endTime: "", maxConcurrent: 1 });
    setShowModal(true);
  };

  // Save room (create or update)
  const handleSave = async () => {
    if (!formData.name || !formData.type) return alert("Please fill required fields");
    try {
      const payload = { ...formData, slots };
      if (editMode) {
        await API.put(`/admin/rooms/${selectedRoom._id}`, payload);
      } else {
        await API.post("/admin/rooms", payload);
      }
      setShowModal(false);
      fetchRooms();
    } catch (err) {
      console.error("Error saving room", err);
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await API.delete(`/admin/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      console.error("Failed to delete room", err);
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
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-success mb-0">Therapy Rooms</h5>
                <Button
                  variant="success"
                  className="rounded-pill d-flex align-items-center"
                  onClick={() => handleShowModal()}
                >
                  <PlusCircle className="me-2" /> Add Room
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-success">
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td>{room.name}</td>
                        <td>{room.type}</td>
                        <td>{room.capacity}</td>
                        <td>
                          {room.available ? (
                            <span className="badge bg-success">Yes</span>
                          ) : (
                            <span className="badge bg-danger">No</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(room)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRoom(room._id)}
                          >
                            <Trash />
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
              {editMode ? "Edit Room" : "Add Room"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Room Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter room name"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Control
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  placeholder="e.g. Shirodhara, Abhyanga"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Capacity</Form.Label>
                <Form.Control
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Available"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                />
              </Form.Group>

              {/* Slots Management */}
              <h6>Slots</h6>
              <div className="d-flex gap-2 mb-2">
                <select
                  name="dayOfWeek"
                  value={slotForm.dayOfWeek}
                  onChange={handleSlotChange}
                  className="form-select"
                >
                  {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  name="startTime"
                  value={slotForm.startTime}
                  onChange={handleSlotChange}
                  className="form-control"
                />
                <input
                  type="time"
                  name="endTime"
                  value={slotForm.endTime}
                  onChange={handleSlotChange}
                  className="form-control"
                />
                <input
                  type="number"
                  name="maxConcurrent"
                  value={slotForm.maxConcurrent}
                  onChange={handleSlotChange}
                  className="form-control"
                  min={1}
                />
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={addOrUpdateSlot}
                >
                  {editingSlotIndex !== null ? "Update" : "Add"}
                </button>
              </div>

              {/* Slots Table */}
              <Table size="sm" bordered>
                <thead>
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
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleSave}>
              {editMode ? "Update" : "Save"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default TherapyRooms;
