// File: src/components/LocationForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
import socket from "../socket/socket";
import { useAuth } from "../context/AuthContext";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
const libraries = ["places"];

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
  const { token } = useAuth();

  // Normalize and persist vehicleType
  const rawVehicleType =
    vehicleTypeProp ||
    params.vehicleType ||
    localStorage.getItem("selectedVehicleType") ||
    "";
  const vehicleType = String(rawVehicleType).trim().toLowerCase();

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [confirmedDriver, setConfirmedDriver] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Track current booking to ignore stray events
  const activeBookingIdRef = useRef(null);
  // Optional: cancel find-driver after a while
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (vehicleType) {
      localStorage.setItem("selectedVehicleType", vehicleType);
    }
  }, [vehicleType]);

  useEffect(() => {
    // Ensure a single socket connection across the app
    if (!socket.connected) {
      socket.connect();
    }

    const onConfirmed = (data) => {
      // Expecting: { bookingId, driverId, driverName, vehicleType, ... }
      if (!data?.bookingId || data.bookingId !== activeBookingIdRef.current) return;
      setConfirmedDriver(data.driverName || "Driver 🚚");
      setRequestSent(false);
      setStatusMsg("");
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const onUnavailable = (data) => {
      // Expecting: { bookingId }
      if (!data?.bookingId || data.bookingId !== activeBookingIdRef.current) return;
      setRequestSent(false);
      setStatusMsg("");
      activeBookingIdRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      alert("❌ This ride is no longer available.");
    };

    // Consistent customer-facing events
    socket.on("ride-confirmed", onConfirmed);
    socket.on("ride-unavailable", onUnavailable);

    return () => {
      socket.off("ride-confirmed", onConfirmed);
      socket.off("ride-unavailable", onUnavailable);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleBooking = async () => {
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      alert("❗ Please select both pickup and drop locations.");
      return;
    }
    if (!token) {
      alert("⚠️ Please log in before booking a ride.");
      return;
    }
    // Prevent duplicate sends for the same pending booking
    if (requestSent && activeBookingIdRef.current) {
      return;
    }

    setLoading(true);

    try {
      const service = new window.google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [{ lat: Number(pickup.lat), lng: Number(pickup.lng) }],
          destinations: [{ lat: Number(drop.lat), lng: Number(drop.lng) }],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        async (response, status) => {
          if (status !== "OK") {
            setLoading(false);
            alert("❌ Failed to fetch distance.");
            return;
          }

          const result = response.rows[0]?.elements?.[0];
          if (!result || result.status !== "OK") {
            setLoading(false);
            alert("🚫 No route found.");
            return;
          }

          const distanceInKm = result.distance.value / 1000;
          const fare = calculateFare(distanceInKm);

          const bookingRequest = {
            vehicleType, // normalized
            pickupLocation: {
              lat: Number(pickup.lat),
              lng: Number(pickup.lng),
              address: pickup.address,
            },
            dropLocation: {
              lat: Number(drop.lat),
              lng: Number(drop.lng),
              address: drop.address,
            },
            fareEstimate: fare,
            distanceKm: Number(distanceInKm.toFixed(2)),
          };

          try {
            const res = await fetch("http://localhost:8080/api/ride-requests", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(bookingRequest),
            });

            const text = await res.text();
            let payload = {};
            try {
              payload = text ? JSON.parse(text) : {};
            } catch {
              // keep as empty object for resilience
            }

            if (!res.ok) {
              const msg =
                payload?.message ||
                (typeof text === "string" && text) ||
                `Request failed with status ${res.status}`;
              console.warn("Ride request error:", res.status, msg);
              if (res.status === 401 || res.status === 403) {
                alert(`🚫 Unauthorized: ${msg}. Please log in again.`);
              } else {
                alert(`🚫 Error: ${msg}`);
              }
              setLoading(false);
              return;
            }

            // Expect backend: { message, bookingId, ride }
            const bookingId =
              payload?.bookingId || payload?.ride?.bookingId || payload?.id || payload?._id;

            if (!bookingId) {
              throw new Error("Failed to get bookingId from backend");
            }

            // Correlate subsequent socket events to this booking
            activeBookingIdRef.current = bookingId;

            // Emit once for server-side filtered dispatch to nearby matching drivers
            socket.emit("rideRequest", { bookingId });

            setRequestSent(true);
            setStatusMsg(`⏳ Looking for a ${vehicleType} driver nearby...`);
            setLoading(false);

            // Optional: timeout to reset UI if no driver confirms in time (e.g., 45s)
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              if (activeBookingIdRef.current === bookingId && !confirmedDriver) {
                setRequestSent(false);
                setStatusMsg("");
                activeBookingIdRef.current = null;
                alert("⌛ No driver responded in time. Please try again.");
              }
            }, 45000);
          } catch (err) {
            console.error("Network/parse error:", err);
            setLoading(false);
            alert("🚫 Error sending ride request.");
          }
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

          {confirmedDriver && (
            <div className="text-center text-green-600 font-semibold text-lg mt-4">
              ✅ Ride confirmed with driver: <strong>{confirmedDriver}</strong>
            </div>
          )}

          {requestSent && !confirmedDriver && (
            <div className="text-center text-yellow-600 font-semibold text-lg mt-4 animate-pulse">
              {statusMsg || `⏳ Looking for a ${vehicleType} driver nearby...`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
