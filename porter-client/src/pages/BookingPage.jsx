// File: src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LocationForm from "../components/LocationForm";
import Navbar from "../components/Navbar";
import socket from "../socket/socket";

export default function BookingPage() {
  const params = useParams();
  const navigate = useNavigate();

  // Try to get vehicleType from URL or localStorage
  const [vehicleType, setVehicleType] = useState(
    params.vehicleType || localStorage.getItem("selectedVehicleType") || ""
  );

  const [rideRequested, setRideRequested] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    // If no vehicle type is found anywhere, redirect back to homepage
    if (!vehicleType) {
      navigate("/");
      return;
    }

    // Store vehicleType in localStorage (so refresh works)
    localStorage.setItem("selectedVehicleType", vehicleType);
  }, [vehicleType, navigate]);

  useEffect(() => {
    // Listen for driver acceptance
    socket.on("rideAccepted", (driver) => {
      console.log("✅ Ride accepted by driver:", driver);
      setRideConfirmed(true);
      setDriverInfo(driver);
    });

    // If ride is booked by someone else before our driver accepts
    socket.on("rideAlreadyBooked", () => {
      console.warn("⚠ Ride already booked by another driver.");
      alert("Ride has already been accepted by another driver.");
      setRideRequested(false);
    });

    // No drivers available
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

  const handleRideRequest = (rideDetails) => {
    setRideRequested(true);

    const ridePayload = {
      ...rideDetails, // contains bookingId, pickupLocation, dropLocation, etc.
      vehicleType, // from state (URL or localStorage)
    };

    console.log("📤 Sending ride request to backend:", ridePayload);

    socket.emit("rideRequest", ridePayload);
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
