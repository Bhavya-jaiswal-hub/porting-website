// File: src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
// import io from "socket.io-client";
import LocationForm from "../components/LocationForm";
import { EventBus } from "../utils/EventBus";


// const socket = io("https://your-backend-url.com"); // ✅ Replace with real backend URL

export default function HomePage() {
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

  // ✅ This is triggered by LocationForm when user clicks "Book Now"
  const handleRideRequest = (rideDetails) => {
    setRideRequested(true);
    EventBus.emit("requestRide", rideDetails); // Send to drivers
  };
  return (
    <div className="p-4">
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
          ✅ Ride confirmed with driver: {driverInfo.name} (📞 {driverInfo.phone})
        </div>
      )}
    </div>
  );
}
