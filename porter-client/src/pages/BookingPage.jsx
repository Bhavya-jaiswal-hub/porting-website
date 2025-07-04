// File: src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LocationForm from "../components/LocationForm";
import Navbar from "../components/Navbar";
import { EventBus } from "../utils/EventBus";

export default function BookingPage() {
  const { vehicleType } = useParams();
  const [rideRequested, setRideRequested] = useState(false);
  const [rideConfirmed, setRideConfirmed] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const handleRideAccepted = (driver) => {
      setRideConfirmed(true);
      setDriverInfo(driver);
    };

    EventBus.on("rideAccepted", handleRideAccepted);

    return () => {
      EventBus.off("rideAccepted", handleRideAccepted);
    };
  }, []);

  const handleRideRequest = (rideDetails) => {
    setRideRequested(true);
    EventBus.emit("requestRide", {
      ...rideDetails,
      vehicle: vehicleType,
    });
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
              ⏳ Looking for drivers near you...
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
