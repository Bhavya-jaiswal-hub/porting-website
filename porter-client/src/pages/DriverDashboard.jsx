import { useEffect, useState } from "react";
import { EventBus } from "../utils/EventBus";
import { v4 as uuidv4 } from "uuid";

const driverId = uuidv4(); // unique mock driver ID for this tab

export default function DriverDashboard() {
  const [rideRequest, setRideRequest] = useState(null);
  const [rideStatus, setRideStatus] = useState("waiting"); // 'waiting', 'accepted', 'unavailable'

 useEffect(() => {
  console.log("📥 Listening for ride requests...");

  const handleRideRequest = (data) => {
    if (rideStatus === "waiting") {
      console.log("📥 Ride request received:", data);
      setRideRequest(data);
    }
  };

  const handleRideConfirmed = (data) => {
    if (rideRequest?.id === data.rideId && data.driverId !== driverId) {
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

const handleAccept = () => {
  if (!rideRequest) return;

  EventBus.emit("ride-accepted", {
    rideId: rideRequest.id,
    driverId: driverId,
    driverName: "Driver John",
  });

  setRideStatus("accepted");
};

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Driver Dashboard</h1>

      {rideRequest && rideStatus === "waiting" && (
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-md mx-auto">
          <p>📍 Pickup: {rideRequest.pickup.address}</p>
          <p>🏁 Drop: {rideRequest.drop.address}</p>
          <p>💰 Fare: ₹{rideRequest.fare}</p>

          <button
            onClick={handleAccept}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg"
          >
            ✅ Accept Ride
          </button>
        </div>
      )}

      {rideStatus === "accepted" && (
        <p className="text-green-700 text-xl mt-4">🎉 You accepted the ride!</p>
      )}

      {rideStatus === "unavailable" && (
        <p className="text-red-600 text-xl mt-4">🚫 This ride has already been accepted.</p>
      )}
    </div>
  );
}
