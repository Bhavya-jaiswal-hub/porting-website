// File: src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LocationForm from "../components/LocationForm";
import Navbar from "../components/Navbar";
import socket from "../socket/socket";
import axios from "axios";

export default function BookingPage() {
  const params = useParams();
  const navigate = useNavigate();

  // Get vehicleType from URL or localStorage
  const [vehicleType, setVehicleType] = useState(
    params.vehicleType || localStorage.getItem("selectedVehicleType") || ""
  );

  const [rideRequested, setRideRequested] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    // If no vehicle type found, go back home
    if (!vehicleType) {
      navigate("/");
      return;
    }
    // Save to localStorage so it survives refresh
    localStorage.setItem("selectedVehicleType", vehicleType);
  }, [vehicleType, navigate]);

  useEffect(() => {
    // Listen for driver acceptance
    socket.on("rideAccepted", (driver) => {
      console.log("✅ Ride accepted by driver:", driver);
      setRideConfirmed(true);
      setDriverInfo(driver);
    });

    // Ride booked by another driver
    socket.on("rideAlreadyBooked", () => {
      console.warn("⚠ Ride already booked by another driver.");
      alert("Ride has already been accepted by another driver.");
      setRideRequested(false);
    });

    // No drivers found
    socket.on("noDriversAvailable", () => {
      console.warn("❌ No drivers found for this vehicle type.");
      alert("No drivers available for the selected vehicle type nearby.");
      setRideRequested(false);
    });

    return () => {
      socket.off("rideAccepted");
      socket.off("rideAlreadyBooked");
      socket.off("noDriversAvailable");
    };
  }, []);

  const handleRideRequest = async (rideDetails) => {
    try {
      setRideRequested(true);

      // Save ride to backend DB
      const res = await axios.post(
        "http://localhost:8080/api/ride-requests",
        {
          ...rideDetails, // bookingId, pickupLocation, dropLocation, etc.
          vehicleType,
        }
      );

      const savedRide = res.data;
      console.log("💾 Ride saved to backend:", savedRide);

      // Notify drivers via Socket.IO
      const ridePayload = {
        ...savedRide,
        vehicleType,
      };
      console.log("📤 Sending ride request via socket:", ridePayload);
      socket.emit("rideRequest", ridePayload);

    } catch (err) {
      console.error("Error creating ride request:", err);
      alert("Failed to send ride request. Please try again.");
      setRideRequested(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center text-purple-700 mb-4">
            🚛 Book a {vehicleType} in Agra
          </h2>

          {!rideRequested && (
            <LocationForm onRequestRide={handleRideRequest} />
          )}

          {rideRequested && !rideConfirmed && (
            <div className="text-center mt-10 text-purple-600">
              ⏳ Looking for {vehicleType} drivers near you...
            </div>
          )}

          {rideConfirmed && (
            <div className="text-center mt-10 text-green-600">
              ✅ Ride confirmed with driver: {driverInfo.name} (📞{" "}
              {driverInfo.phone})
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
