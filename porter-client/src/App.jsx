import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import DriverDashboard from "./pages/DriverDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";


export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/book/:vehicleType" element={<BookingPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/driver" element={<DriverDashboard />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>

    
  );
}
