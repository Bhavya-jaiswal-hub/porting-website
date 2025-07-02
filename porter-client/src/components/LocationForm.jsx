import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useJsApiLoader } from "@react-google-maps/api";
import { EventBus } from "../utils/EventBus";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
// import io from "socket.io-client";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
const RATE_PER_KM = 30;
const libraries = ["places"];
// MOCK SOCKET (for testing without backend)
const socket = {
  emit: (...args) => console.log("📡 socket.emit:", ...args),
  on: (...args) => console.log("🔌 socket.on (mock):", ...args),
  off: (...args) => console.log("🔌 socket.off (mock):", ...args),
};


// const socket = io("https://your-backend-url.com"); // Replace with actual backend URL

export default function LocationForm() {
  console.log("📍 LocationForm loaded");
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries,
  });

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [confirmedDriver, setConfirmedDriver] = useState(null);

  useEffect(() => {
  const handleRideAccepted = (data) => {
    setConfirmedDriver("MockDriver 🚚");
  };

  EventBus.on("ride-accepted", handleRideAccepted);

  return () => {
    EventBus.off("ride-accepted", handleRideAccepted); // must use same function
  };
}, []);

  // useEffect(() => {
  //   socket.on("ride-confirmed", (data) => {
  //     setConfirmedDriver(data.driverName);
  //   });

  //   socket.on("ride-unavailable", () => {
  //     alert("❌ This ride is no longer available");
  //   });

  //   return () => {
  //     socket.off("ride-confirmed");
  //     socket.off("ride-unavailable");
  //   };
  // }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-purple-600">Loading Google Maps…</p>
      </div>
    );
  }

  const handleEstimate = () => {
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      alert("❗ Please select both pickup and drop locations from suggestions.");
      return;
    }

    setLoading(true);

    const service = new window.google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [{ lat: pickup.lat, lng: pickup.lng }],
        destinations: [{ lat: drop.lat, lng: drop.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        setLoading(false);

        if (status !== "OK") {
          console.error("Distance Matrix Error:", status, response);
          alert("❌ Failed to fetch distance. Please try again.");
          return;
        }

        const result = response.rows[0].elements[0];

        if (result.status === "OK") {
          const distanceInKm = result.distance.value / 1000;
          const estimatedFare = (distanceInKm * RATE_PER_KM).toFixed(0);

          setDistance(distanceInKm.toFixed(1));
          setFare(estimatedFare);
        } else {
          alert("🚫 No route found between selected locations.");
        }
      }
    );
  };

  // const handleBooking = () => {
  //   if (!pickup || !drop || !fare) {
  //     alert("Pickup, drop, or fare missing.");
  //     return;
  //   }

  //   const bookingData = {
  //     id: uuidv4(),
  //     pickup,
  //     drop,
  //     fare,
  //     timestamp: Date.now(),
  //   };

  //   socket.emit("ride-request", bookingData);
  //   setRequestSent(true);
  // };

  const handleBooking = () => {
  if (!pickup || !drop || !fare) {
    alert("Pickup, drop, or fare missing.");
    return;
  }

  const rideId = uuidv4(); // unique ride ID for mock
  const bookingData = {
    id: rideId,
    pickup,
    drop,
    fare,
  };

  EventBus.emit("ride-request", bookingData);
  setRequestSent(true);
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">
          🚛 Book Your Truck in Agra
        </h2>

        <div className="space-y-4">
          <GoogleAutocompleteInput
            placeholder="📍 Enter Pickup Location"
            onPlaceSelect={(place) => setPickup(place)}
          />

          <GoogleAutocompleteInput
            placeholder="🏁 Enter Drop Location"
            onPlaceSelect={(place) => setDrop(place)}
          />

          <button
            onClick={handleEstimate}
            disabled={loading}
            className={`w-full ${
              loading ? "bg-purple-300" : "bg-purple-600 hover:bg-purple-700"
            } text-white font-semibold py-3 rounded-lg transition duration-300`}
          >
            {loading ? "Estimating..." : "🚦 Estimate Fare"}
          </button>

          {distance && (
            <div className="bg-gray-50 p-4 rounded-xl mt-4 shadow-inner">
              <p className="text-gray-700 text-lg">
                <strong>Distance:</strong> {distance} km
              </p>
              <p className="text-gray-700 text-lg">
                <strong>Estimated Fare:</strong> ₹{fare}
              </p>
            </div>
          )}

          {fare && !confirmedDriver && (
            <button
              onClick={handleBooking}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mt-4 rounded-lg transition duration-300"
            >
              📡 Send Ride Request
            </button>
          )}

          {confirmedDriver && (
            <div className="mt-4 text-center text-green-700 font-semibold">
              ✅ Ride confirmed with driver: {confirmedDriver}
            </div>
          )}

          {requestSent && !confirmedDriver && (
            <div className="mt-4 text-center text-yellow-700 font-semibold">
              ⏳ Waiting for a driver to accept...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
