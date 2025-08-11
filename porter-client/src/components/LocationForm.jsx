// File: src/components/LocationForm.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
import socket from "../socket/socket";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
const libraries = ["places"];

// Fare calculation helper
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

export default function LocationForm({ vehicleType: vehicleTypeProp }) {
  const params = useParams();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY, libraries });

  const vehicleType =
    vehicleTypeProp ||
    params.vehicleType ||
    localStorage.getItem("selectedVehicleType") ||
    "";

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [confirmedDriver, setConfirmedDriver] = useState(null);

  const userId = localStorage.getItem("userId") || "guest";

  useEffect(() => {
    if (vehicleType) {
      localStorage.setItem("selectedVehicleType", vehicleType);
    }
  }, [vehicleType]);

  // Socket listeners
  useEffect(() => {
    socket.on("ride-confirmed", (data) => {
      if (data.vehicleType === vehicleType) {
        setConfirmedDriver(data.driverName || "Driver 🚚");
      }
    });

    socket.on("ride-unavailable", () => {
      alert("❌ This ride is no longer available.");
    });

    return () => {
      socket.off("ride-confirmed");
      socket.off("ride-unavailable");
    };
  }, [vehicleType]);

  // Send booking request
  const handleBooking = async () => {
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      alert("❗ Please select both pickup and drop locations.");
      return;
    }

    setLoading(true);

    try {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [{ lat: pickup.lat, lng: pickup.lng }],
          destinations: [{ lat: drop.lat, lng: drop.lng }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        async (response, status) => {
          if (status !== "OK") {
            setLoading(false);
            alert("❌ Failed to fetch distance.");
            return;
          }

          const result = response.rows[0].elements[0];
          if (result.status !== "OK") {
            setLoading(false);
            alert("🚫 No route found.");
            return;
          }

          const distanceInKm = result.distance.value / 1000;
          const fare = calculateFare(distanceInKm);

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

          // Save ride request in DB
          const res = await fetch("http://localhost:8080/api/ride-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingRequest),
          });

          const savedBooking = await res.json();

          // ✅ Use bookingId from backend response
          const bookingId = savedBooking.bookingId;

          if (!bookingId) {
            throw new Error("Failed to get bookingId from backend");
          }

          // Send only bookingId to backend via socket
          console.log("Sending rideRequest for bookingId:", bookingId);
        socket.emit("rideRequest", { bookingId });

          setLoading(false);
          setRequestSent(true);
        }
      );
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("🚫 Error sending ride request.");
    }
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-100 via-purple-100 to-pink-100 px-4 py-10">
      <div className="bg-white w-full max-w-2xl p-8 rounded-3xl shadow-2xl border border-purple-100">
        <h2 className="text-4xl font-extrabold text-center text-red-700 mb-8">
          🚛 Book a {vehicleType} in Agra
        </h2>

        <div className="space-y-6">
          {/* Pickup */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              📍 Pickup Location
            </label>
            <GoogleAutocompleteInput
              placeholder="Enter Pickup Location"
              onPlaceSelect={(place) => setPickup(place)}
            />
          </div>

          {/* Drop */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              🏁 Drop Location
            </label>
            <GoogleAutocompleteInput
              placeholder="Enter Drop Location"
              onPlaceSelect={(place) => setDrop(place)}
            />
          </div>

          {/* Send Request */}
          {!confirmedDriver && (
            <button
              onClick={handleBooking}
              disabled={loading}
              className={`w-full text-white font-bold py-3 rounded-xl ${
                loading
                  ? "bg-purple-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800"
              }`}
            >
              {loading ? "⏳ Sending Request..." : "📡 Send Ride Request"}
            </button>
          )}

          {/* Confirmation */}
          {confirmedDriver && (
            <div className="text-center text-green-600 font-semibold text-lg mt-4">
              ✅ Ride confirmed with driver: <strong>{confirmedDriver}</strong>
            </div>
          )}

          {/* Waiting */}
          {requestSent && !confirmedDriver && (
            <div className="text-center text-yellow-600 font-semibold text-lg mt-4 animate-pulse">
              ⏳ Looking for a {vehicleType} driver nearby...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
