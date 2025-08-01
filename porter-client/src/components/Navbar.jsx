// File: src/components/Navbar.jsx
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="text-2xl font-bold text-blue-600 flex items-center space-x-1">
        <span>DELIVERY KING</span>
        <span className="text-blue-500 text-lg">📍</span>
      </div>

      {/* Center Nav Links */}
      <div className="hidden md:flex space-x-8 text-black font-medium">
        <a href="#" className="hover:text-blue-600">Customer</a>
        <a href="#" className="hover:text-blue-600">Delivery Partners</a>
      </div>

      {/* Right Side */}
      <div className="text-black font-medium flex items-center space-x-4">
        <a href="#" className="hover:text-blue-600">Support</a>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
