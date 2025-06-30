import React, { useEffect, useRef } from "react";

export default function GoogleAutocompleteInput({ placeholder, onPlaceSelect }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        inputRef.current &&
        !autocompleteRef.current
      ) {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
          types: ["geocode"],
          componentRestrictions: { country: "in" },
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry) return;

          const selectedPlace = {
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };

          console.log("📍 Place selected:", selectedPlace);
          onPlaceSelect(selectedPlace);
        });

        clearInterval(interval);
      }
    }, 200);

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      clearInterval(interval);
    };
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
    />
  );
}
