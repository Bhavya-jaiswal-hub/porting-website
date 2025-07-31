import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
import socket from "../socket/socket";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
const libraries = ["places"];

// Fare calculation logic
function calculateFare(distanceInKm) {
  const baseFare = 40;
  const now = new Date();
  const hours = now.getHours();
  let perKmRate = 14;

  if (hours >= 8 && hours < 11) {
    perKmRate = distanceInKm <= 5 ? 19 : 14;
  } else if (hours >= 11 && hours < 17) {
    perKmRate = distanceInKm <= 5 ? 17.5 : distanceInKm <= 15 ? 12.5 : 9.5;
  } else if (hours >= 17 && hours < 24) {
    perKmRate = distanceInKm <= 5 ? 19 : 14;
  }

  return Math.round(baseFare + distanceInKm * perKmRate);
}

export default function LocationForm() {
  const { vehicleType } = useParams();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY, libraries });

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [confirmedDriver, setConfirmedDriver] = useState(null);

  const userId = localStorage.getItem("userId") || "guest";

  // Socket event listeners
  useEffect(() => {
    socket.on("ride-confirmed", (data) => {
      setConfirmedDriver(data.driverName || "Driver 🚚");
    });

    socket.on("ride-unavailable", () => {
      alert("❌ This ride is no longer available.");
    });

    return () => {
      socket.off("ride-confirmed");
      socket.off("ride-unavailable");
    };
  }, []);

  // Estimate distance and fare
  const handleEstimate = () => {
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      alert("❗ Please select both pickup and drop locations.");
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
          alert("❌ Failed to fetch distance.");
          return;
        }

        const result = response.rows[0].elements[0];
        if (result.status === "OK") {
          const distanceInKm = result.distance.value / 1000;
          setDistance(distanceInKm.toFixed(1));
          setFare(calculateFare(distanceInKm));
        } else {
          alert("🚫 No route found.");
        }
      }
    );
  };

  // Send booking request to backend
  const handleBooking = () => {
    if (!pickup || !drop || !fare) {
      alert("Please provide pickup, drop, and fare.");
      return;
    }

    const bookingRequest = {
      vehicleType,
      userId,
      pickupLocation: {
        lat: pickup.lat,
        lng: pickup.lng,
        address: pickup.address,
      },
      dropLocation: {
        lat: drop.lat,
        lng: drop.lng,
        address: drop.address,
      },
      fareEstimate: fare,
    };

    socket.emit("ride-request", bookingRequest);
    setRequestSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 px-4 py-10">
      <div className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl border border-purple-100">
        <h2 className="text-4xl font-extrabold text-center text-red-700 mb-8">
          🚛 Book a {vehicleType} in Agra
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              📍 Pickup Location
            </label>
            <GoogleAutocompleteInput
              placeholder="Enter Pickup Location"
              onPlaceSelect={(place) => setPickup(place)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              🏁 Drop Location
            </label>
            <GoogleAutocompleteInput
              placeholder="Enter Drop Location"
              onPlaceSelect={(place) => setDrop(place)}
            />
          </div>

          <button
            onClick={handleEstimate}
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-xl ${
              loading
                ? "bg-purple-300 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }`}
          >
            {loading ? "Estimating..." : "🚦 Estimate Fare"}
          </button>

          {distance && (
            <div className="bg-gray-50 p-5 rounded-xl text-center">
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 mt-2 rounded-xl"
            >
              📡 Send Ride Request
            </button>
          )}

          {confirmedDriver && (
            <div className="text-center text-green-600 font-semibold text-lg mt-4">
              ✅ Ride confirmed with driver: <strong>{confirmedDriver}</strong>
            </div>
          )}

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
