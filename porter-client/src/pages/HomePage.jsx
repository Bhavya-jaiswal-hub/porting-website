import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMotorcycle, FaTruck, FaCouch, FaShippingFast } from "react-icons/fa";
import Navbar from "../components/Navbar";
import bgImage from "../assets/banner.jpg"; // ✅ replace with your image path

export default function HomePage() {
  const navigate = useNavigate();

  const handleVehicleSelect = (vehicleType) => {
    navigate(`/book/${vehicleType}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full" style={{ height: "70vh" }}>
        {/* Background Image */}
        <img
          src={bgImage}
          alt="Banner"
          className="w-full h-full object-cover"
        />

        {/* Headline Text Overlay */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
            Delivery hai, ho jayega!
          </h1>
        </div>

        {/* Vehicle Selection Box overlapping image bottom */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[-130px] w-[95%] max-w-5xl z-10">
          <div className="bg-white bg-opacity-95 backdrop-blur-md p-6 md:p-10 rounded-2xl shadow-2xl">
            {/* Header + City Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-700 text-center sm:text-left">
                🚚 Select Vehicle Type
              </h2>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                defaultValue="Agra"
              >
                <option value="Agra">📍 Agra</option>
                {/* Add more cities here */}
              </select>
            </div>

            {/* Vehicle Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VehicleCard
                icon={<FaMotorcycle size={28} />}
                label="Two Wheeler"
                onClick={() => handleVehicleSelect("Two-Wheeler")}
              />
              <VehicleCard
                icon={<FaTruck size={28} />}
                label="Truck"
                onClick={() => handleVehicleSelect("Truck")}
              />
              <VehicleCard
                icon={<FaCouch size={28} />}
                label="Packers & Movers"
                onClick={() => handleVehicleSelect("Packers-Movers")}
              />
              <VehicleCard
                icon={<FaShippingFast size={28} />}
                label="Courier"
                onClick={() => handleVehicleSelect("Courier")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({ icon, label, onClick }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-5 sm:p-6 border rounded-xl shadow-md cursor-pointer hover:bg-blue-100 transition"
      onClick={onClick}
    >
      <div className="text-purple-600 mb-2">{icon}</div>
      <p className="text-gray-700 font-medium text-center text-sm sm:text-base">
        {label}
      </p>
    </div>
  );
}