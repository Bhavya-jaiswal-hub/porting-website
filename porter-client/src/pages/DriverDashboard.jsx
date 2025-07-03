import { useEffect, useState } from "react";
import { EventBus } from "../utils/EventBus";
import { v4 as uuidv4 } from "uuid";

const driverId = uuidv4(); // Unique driver ID per tab/session

export default function DriverDashboard() {
  const [rideRequest, setRideRequest] = useState(null);
  const [rideStatus, setRideStatus] = useState("waiting"); // waiting | accepted | unavailable

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex flex-col items-center justify-start py-10 px-4">
      <h1 className="text-4xl font-extrabold text-purple-800 mb-8">🚚 Driver Dashboard</h1>

      {rideRequest && rideStatus === "waiting" && (
        <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow-xl text-gray-800 space-y-4">
          <h2 className="text-2xl font-semibold text-green-700 mb-2">📦 New Ride Request</h2>
          <p><strong>📍 Pickup:</strong> {rideRequest.pickup?.address}</p>
          <p><strong>🏁 Drop:</strong> {rideRequest.drop?.address}</p>
          <p><strong>📏 Distance:</strong> {rideRequest.distance} km</p>
          <p><strong>💰 Total Fare:</strong> ₹{rideRequest.fare}</p>
          {rideRequest.fareDetails && (
            <>
              <p><strong>⚙️ Base Fare:</strong> ₹{rideRequest.fareDetails.baseFare}</p>
              <p><strong>🕒 Time Slot:</strong> {rideRequest.fareDetails.timeSlot}</p>
              <p><strong>📊 Rate Per Km:</strong> ₹{rideRequest.fareDetails.perKmRate}</p>
            </>
          )}
          <button
            onClick={handleAccept}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
          >
            ✅ Accept Ride
          </button>
        </div>
      )}

      {rideStatus === "accepted" && (
        <div className="mt-6 text-xl font-semibold text-green-700">
          🎉 You accepted the ride! Get ready to pick up the goods.
        </div>
      )}

      {rideStatus === "unavailable" && (
        <div className="mt-6 text-xl font-semibold text-red-600">
          🚫 This ride has already been accepted by another driver.
        </div>
      )}
    </div>
  );
}
