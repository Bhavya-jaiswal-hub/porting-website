// src/api/bookingApi.js
import api from "./index"; // axios instance

export const createBooking = (bookingRequest, token) =>
  api.post("/ride-requests", bookingRequest, {
    headers: { Authorization: `Bearer ${token}` }
  });
