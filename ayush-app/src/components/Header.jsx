import React from "react";
import { Navbar } from "react-bootstrap";

const Header = ({ title }) => {
  const adminName = "Admin"; // You can pull from decoded JWT later

  return (
    <Navbar
      bg="white"
      className="shadow-sm px-4 py-3 d-flex justify-content-between"
    >
      <h5 className="m-0 fw-semibold text-success">{title}</h5>
      <span className="text-muted small">
        Welcome back, <b>{adminName}</b> 🌱
      </span>
    </Navbar>
  );
};

export default Header;
