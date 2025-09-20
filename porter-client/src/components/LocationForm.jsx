  // src/components/LocationForm.jsx
  // src/components/LocationForm.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../api/bookingApi";
import calculateFare from "../utils/calculateFare";
import useRideSocket from "../hooks/useSocket"; // updated hook

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc";
const libraries = ["places"];

export default function LocationForm({ vehicleType: vehicleTypeProp }) {
  const params = useParams();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: API_KEY, libraries });
  const { token } = useAuth();

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
  const [rideStatus, setRideStatus] = useState("");
  const [driverLocation, setDriverLocation] = useState(null);

  const activeBookingIdRef = useRef(null);
  const timeoutRef = useRef(null);

  // ✅ Updated socket hook with all event handlers
  const { socket, isSocketReady } = useRideSocket({
    "ride-confirmed": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setConfirmedDriver(data.driverName || "Driver 🚚");
      setRequestSent(false);
      setStatusMsg("");
      setRideStatus("Driver on the way");
      clearTimeout(timeoutRef.current);
    },
    "ride-unavailable": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setRequestSent(false);
      setStatusMsg("");
      activeBookingIdRef.current = null;
      clearTimeout(timeoutRef.current);
      alert("❌ This ride is no longer available.");
    },
    "driver-location-update": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setDriverLocation(data.location);
    },
    "pickup-complete-update": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setRideStatus("Arrived at pickup");
    },
    "ride-started-update": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setRideStatus("Ride in progress");
    },
    "ride-completed-update": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setRideStatus("Ride completed");
      alert("✅ Ride completed successfully!");
      activeBookingIdRef.current = null;
      setConfirmedDriver(null);
    },
    "no-drivers-found": (data) => {
      if (data?.bookingId !== activeBookingIdRef.current) return;
      setRequestSent(false);
      setStatusMsg("");
      activeBookingIdRef.current = null;
      alert("🚫 No drivers found nearby.");
    }
  });

  useEffect(() => {
    if (vehicleType) {
      localStorage.setItem("selectedVehicleType", vehicleType);
    }
  }, [vehicleType]);

  const handleBooking = async () => {
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      alert("❗ Please select both pickup and drop locations.");
      return;
    }
    if (!token) {
      alert("⚠️ Please log in before booking a ride.");
      return;
    }
    if (!isSocketReady) {
      alert("⚠️ Socket not ready yet. Please wait a moment and try again.");
      return;
    }
    if (requestSent && activeBookingIdRef.current) return;

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
            vehicleType,
            pickupLocation: { ...pickup, lat: Number(pickup.lat), lng: Number(pickup.lng) },
            dropLocation: { ...drop, lat: Number(drop.lat), lng: Number(drop.lng) },
            fareEstimate: fare,
            distanceKm: Number(distanceInKm.toFixed(2)),
            userSocketId: socket.id,
          };

          try {
            const res = await createBooking(bookingRequest, token);
            const bookingId =
              res.data?.bookingId ||
              res.data?.ride?.bookingId ||
              res.data?.id ||
              res.data?._id;

            if (!bookingId) throw new Error("Failed to get bookingId from backend");

            activeBookingIdRef.current = bookingId;
            socket.emit("rideRequest", { bookingId });

            setRequestSent(true);
            setStatusMsg(`⏳ Looking for a ${vehicleType} driver nearby...`);
            setRideStatus("Searching for driver");
            setLoading(false);

            timeoutRef.current = setTimeout(() => {
              if (activeBookingIdRef.current === bookingId && !confirmedDriver) {
                setRequestSent(false);
                setStatusMsg("");
                activeBookingIdRef.current = null;
                alert("⌛ No driver responded in time. Please try again.");
              }
            }, 45000);
          } catch (err) {
            console.error("Booking error:", err);
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
