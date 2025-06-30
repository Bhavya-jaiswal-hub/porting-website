import React, { useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import GoogleAutocompleteInput from "./GoogleAutocompleteInput";

const API_KEY = "AIzaSyAFh8YiJxXIUKPpn54IUORCf3IePgsO-nc"; // ✅ Use your active key
const RATE_PER_KM = 30;
const libraries = ["places"];

export default function LocationForm() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    libraries,
  });

  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [distance, setDistance] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold text-purple-600">Loading Google Maps…</p>
      </div>
    );
  }

  const handleEstimate = () => {
  console.log("Pickup:", pickup);
  console.log("Drop:", drop);

  // Validate both locations
  if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
    alert("❗ Please select both pickup and drop locations from suggestions.");
    return;
  }

  setLoading(true); // Show loading state if used

  const service = new window.google.maps.DistanceMatrixService();

  service.getDistanceMatrix(
    {
      origins: [{ lat: pickup.lat, lng: pickup.lng }],
      destinations: [{ lat: drop.lat, lng: drop.lng }],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
    },
    (response, status) => {
      setLoading(false); // Hide loading spinner

      if (status !== "OK") {
        console.error("Distance Matrix Error:", status, response);
        alert("❌ Failed to fetch distance. Please try again.");
        return;
      }

      const result = response.rows[0].elements[0];

      if (result.status === "OK") {
        const distanceInKm = result.distance.value / 1000; // Convert meters to km
        const estimatedFare = (distanceInKm * RATE_PER_KM).toFixed(0);

        setDistance(distanceInKm.toFixed(1));
        setFare(estimatedFare);
      } else {
        alert("🚫 No route found between selected locations.");
      }
    }
  );
};


  const handleBooking = () => {
    alert(`✅ Booking Confirmed!\nFrom: ${pickup.address}\nTo: ${drop.address}`);
    // TODO: Send data to backend if needed
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
  onPlaceSelect={(place) => {
    console.log("Pickup selected:", place);
    setPickup(place);
  }}
/>

<GoogleAutocompleteInput
  placeholder="🏁 Enter Drop Location"
  onPlaceSelect={(place) => {
    console.log("Drop selected:", place);
    setDrop(place);
  }}
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

          {fare && (
            <button
              onClick={handleBooking}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 mt-4 rounded-lg transition duration-300"
            >
              ✅ Book Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
