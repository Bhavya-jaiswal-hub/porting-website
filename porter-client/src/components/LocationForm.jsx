import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useJsApiLoader } from "@react-google-maps/api";
import { EventBus } from "../utils/EventBus";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
// import io from "socket.io-client";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
// const RATE_PER_KM = 30;
const libraries = ["places"];
// MOCK SOCKET (for testing without backend)
const socket = {
  emit: (...args) => console.log("📡 socket.emit:", ...args),
  on: (...args) => console.log("🔌 socket.on (mock):", ...args),
  off: (...args) => console.log("🔌 socket.off (mock):", ...args),
};


function calculateFare(distanceInKm) {
  const baseFare = 40;
  const now = new Date();
  const hours = now.getHours();

  let perKmRate = 0;

  // Morning: 8 AM – 11 AM
  if (hours >= 8 && hours < 11) {
    if (distanceInKm <= 5) perKmRate = 19;
    else if (distanceInKm <= 15) perKmRate = 14;
    else perKmRate = 14;

  // Afternoon: 11 AM – 5 PM
  } else if (hours >= 11 && hours < 17) {
    if (distanceInKm <= 5) perKmRate = 17.5;
    else if (distanceInKm <= 15) perKmRate = 12.5;
    else perKmRate = 9.5;

  // Evening: 5 PM – 12 AM
  } else if (hours >= 17 && hours < 24) {
    if (distanceInKm <= 5) perKmRate = 19;
    else if (distanceInKm <= 15) perKmRate = 14;
    else perKmRate = 14;

  // Early morning fallback
  } else {
    perKmRate = 14;
  }

  const variableFare = distanceInKm * perKmRate;
  const totalFare = baseFare + variableFare;

  return Math.round(totalFare);
}



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
        const roundedDistance = parseFloat(distanceInKm.toFixed(1));
        const estimatedFare = calculateFare(roundedDistance);

        setDistance(roundedDistance);
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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 px-4 py-10">
    <div className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl border border-purple-100 transition-all duration-300">
      <h2 className="text-4xl font-extrabold text-center text-red-700 mb-8 tracking-tight">
        🚛 Book a Bike in Agra
      </h2>

      <div className="space-y-6">
        {/* Pickup Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            📍 Pickup Location
          </label>
          <GoogleAutocompleteInput
            placeholder="Enter Pickup Location"
            onPlaceSelect={(place) => setPickup(place)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
          />
        </div>

        {/* Drop Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            🏁 Drop Location
          </label>
          <GoogleAutocompleteInput
            placeholder="Enter Drop Location"
            onPlaceSelect={(place) => setDrop(place)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-sm"
          />
        </div>

        {/* Estimate Fare Button */}
        <button
          onClick={handleEstimate}
          disabled={loading}
          className={`w-full text-white font-bold py-3 rounded-xl transition-all duration-300 ${
            loading
              ? "bg-purple-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md hover:shadow-lg"
          }`}
        >
          {loading ? "Estimating..." : "🚦 Estimate Fare"}
        </button>

        {/* Distance and Fare */}
        {distance && (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner text-center">
            <p className="text-gray-700 text-lg">
              <strong>Distance:</strong> {distance} km
            </p>
            <p className="text-gray-700 text-lg">
              <strong>Estimated Fare:</strong> ₹{fare}
            </p>
          </div>
        )}

        {/* Book Button */}
        {fare && !confirmedDriver && (
          <button
            onClick={handleBooking}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 mt-2 rounded-xl transition duration-300 shadow-lg hover:shadow-xl"
          >
            📡 Send Ride Request
          </button>
        )}

        {/* Ride Confirmed */}
        {confirmedDriver && (
          <div className="text-center text-green-600 font-semibold text-lg mt-4">
            ✅ Ride confirmed with driver: <span className="font-bold">{confirmedDriver}</span>
          </div>
        )}

        {/* Waiting Message */}
        {requestSent && !confirmedDriver && (
          <div className="text-center text-yellow-600 font-semibold text-lg mt-4 animate-pulse">
            ⏳ Looking for a driver nearby...
          </div>
        )}
      </div>
    </div>
  </div>
);
}