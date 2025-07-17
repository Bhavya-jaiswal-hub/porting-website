// pages/WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import welcome from "../assets/welcome.jpg";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-6">
      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-bold text-white mt-6 text-center drop-shadow-md">
        Delivery King
      </h1>

      {/* Image */}
      <img
        src={welcome}
        alt="Delivery Illustration"
        className="w-full max-w-md h-auto mt-8 rounded-xl shadow-lg"
      />

      {/* Buttons */}
      <div className="w-full max-w-md flex flex-col items-center gap-4 mb-10">
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-white text-purple-700 py-3 rounded-xl text-lg font-semibold shadow hover:bg-purple-100 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="w-full bg-white border border-white text-purple-700 py-3 rounded-xl text-lg font-semibold hover:bg-purple-100 transition"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;