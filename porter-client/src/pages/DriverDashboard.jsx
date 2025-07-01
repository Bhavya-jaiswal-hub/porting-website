// src/pages/DriverDashboard.jsx
import React, { useEffect, useState } from "react";
// import io from "socket.io-client";
import { EventBus } from "../utils/EventBus";

// const socket = io("https://your-backend-url.com"); // replace with actual backend URL

export default function DriverDashboard() {
  const [rideRequest, setRideRequest] = useState(null);
  const [rideStatus, setRideStatus] = useState("waiting"); // 'waiting', 'accepted', 'unavailable'

//   useEffect(() => {
//     socket.on("ride-request", (data) => {
//       if (rideStatus === "waiting") {
//         console.log("📥 Ride request received:", data);
//         setRideRequest(data);
//       }
//     });

//     socket.on("ride-confirmed", (data) => {
//       if (rideRequest?.id === data.rideId && data.driverId !== socket.id) {
//         console.log("❌ Another driver accepted the ride:", data);
//         setRideStatus("unavailable");
//         setRideRequest(null);
//       }
//     });

//     return () => {
//       socket.off("ride-request");
//       socket.off("ride-confirmed");
//     };
//   }, [rideRequest, rideStatus]);

useEffect(() => {
  const handleRideRequest = (data) => {
    if (rideStatus === "waiting") {
      console.log("📥 Ride request received:", data);
      setRideRequest(data);
    }
  };

  const handleRideConfirmed = (data) => {
    if (rideRequest?.id === data.rideId && data.driverId !== "mock-driver-id") {
      console.log("❌ Another driver accepted the ride:", data);
      setRideStatus("unavailable");
      setRideRequest(null);
    }
  };

  EventBus.on("ride-request", handleRideRequest);
  EventBus.on("ride-accepted", handleRideConfirmed);

  return () => {
    EventBus.off("ride-request", handleRideRequest);
    EventBus.off("ride-accepted", handleRideConfirmed);
  };
}, [rideRequest, rideStatus]);


//   const handleAccept = () => {
//     if (!rideRequest) return;

//     socket.emit("accept-ride", {
//       rideId: rideRequest.id,
//       driverId: socket.id,
//       driverName: "Driver John" // Replace with actual driver name if available
//     });

//     setRideStatus("accepted");
//   };       

const handleAccept = () => {
  if (!rideRequest) return;

  EventBus.emit("ride-accepted", {
    rideId: rideRequest.id,
    driverId: "mock-driver-id",
    driverName: "Driver John",
  });

  setRideStatus("accepted");
};



  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h2 className="text-3xl font-bold mb-6 text-purple-800">Driver Dashboard</h2>

      {rideStatus === "waiting" && rideRequest && (
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md text-center">
          <p className="mb-4 text-gray-700">📍 <strong>Pickup:</strong> {rideRequest.pickup.address}</p>
          <p className="mb-4 text-gray-700">🏁 <strong>Drop:</strong> {rideRequest.drop.address}</p>
          <p className="mb-4 text-gray-700">💰 <strong>Fare:</strong> ₹{rideRequest.fare}</p>
          <button
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            ✅ Accept Ride
          </button>
        </div>
      )}

      {rideStatus === "accepted" && (
        <p className="text-green-700 text-xl mt-4">🎉 You accepted the ride!</p>
      )}

      {rideStatus === "unavailable" && (
        <p className="text-red-600 text-xl mt-4">🚫 This ride has been taken by another driver.</p>
      )}
    </div>
  );
}
