// File: src/components/Navbar.jsx
import React from "react";

export default function Navbar() {
  return (
    <nav className="w-full bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <div className="text-2xl font-bold text-blue-600 flex items-center space-x-1">
        <span>DELIVERY KING</span>
        <span className="text-blue-500 text-lg">📍</span>
      </div>

      {/* Center Nav Links */}
      <div className="hidden md:flex space-x-8 text-black font-medium">
        <a href="#" className="hover:text-blue-600">For Enterprise</a>
        <a href="#" className="hover:text-blue-600">Delivery Partners</a>
      </div>

      {/* Right Link */}
      <div className="text-black font-medium hover:text-blue-600">
        <a href="#">Support</a>
      </div>
    </nav>
  );
}
