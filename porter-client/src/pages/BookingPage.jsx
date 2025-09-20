import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LocationForm from "../components/LocationForm";
import Navbar from "../components/Navbar";
import socket from "../socket/socket";
import axios from "axios";

export default function BookingPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [vehicleType, setVehicleType] = useState(
    params.vehicleType || localStorage.getItem("selectedVehicleType") || ""
  );

  const [rideRequested, setRideRequested] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);

  // ✅ Check socket connection immediately on page load
  useEffect(() => {
    socket.on("connect", () => {
      console.log("🟢 Connected to backend socket:", socket.id);
      setIsSocketReady(true);
      // Optional: send a test event to backend
      socket.emit("test-event");
    });

    socket.on("test-response", (data) => {
      console.log("📦 Test response from backend:", data);
    });

    return () => {
      socket.off("connect");
      socket.off("test-response");
    };
  }, []);

  // Save vehicle type or redirect if missing
  useEffect(() => {
    if (!vehicleType) {
      navigate("/");
      return;
    }
    localStorage.setItem("selectedVehicleType", vehicleType);
  }, [vehicleType, navigate]);

  // Ride-related socket listeners
  useEffect(() => {
    socket.on("ride-confirmed", (driver) => {
      console.log("✅ Ride confirmed by driver:", driver);
      setRideConfirmed(true);
      setDriverInfo(driver);
    });

    socket.on("rideAlreadyBooked", () => {
      console.warn("⚠ Ride already booked by another driver.");
      alert("Ride has already been accepted by another driver.");
      setRideRequested(false);
    });

    socket.on("noDriversAvailable", () => {
      console.warn("❌ No drivers found for this vehicle type.");
      alert("No drivers available for the selected vehicle type nearby.");
      setRideRequested(false);
    });

    return () => {
      socket.off("ride-confirmed");
      socket.off("rideAlreadyBooked");
      socket.off("noDriversAvailable");
    };
  }, []);

  const handleRideRequest = async (rideDetails) => {
    try {
      if (!isSocketReady) {
        alert("Socket not ready yet, please wait a moment and try again.");
        return;
      }

      setRideRequested(true);

     console.log("📡 About to send booking request. socket.connected =", socket.connected, "socket.id =", socket.id);


      const res = await axios.post(
        "http://localhost:8080/api/ride-requests",
        {
          ...rideDetails,
          vehicleType,
          userSocketId: socket.id, // ✅ send the live socket ID
        }
      );

      const savedRide = res.data.ride;
      console.log("💾 Ride saved to backend:", savedRide);

      // Notify drivers via Socket.IO
      socket.emit("rideRequest", { bookingId: savedRide.bookingId });

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
              ✅ Ride confirmed with driver: {driverInfo.driverName} (📞{" "}
              {driverInfo.driverPhone})
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
