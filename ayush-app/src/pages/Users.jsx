import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import API from "../api";
import { Table, Container, Card, Spinner } from "react-bootstrap";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/users")
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div
        className="flex-grow-1 bg-light"
        style={{
          minHeight: "100vh",
          marginLeft: "250px",
          overflowX: "hidden",
        }}
      >
        <Header title="User Management" />
        <Container className="py-4">
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <h5 className="mb-3 text-success">Registered Users</h5>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <Table hover responsive className="align-middle">
                  <thead className="table-success">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default Users;
