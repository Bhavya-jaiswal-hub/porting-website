import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import SignupPage from './pages/SignupPage';
import LocationForm from './components/LocationForm';
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book/:vehicleType"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/location"
            element={
              <ProtectedRoute>
                <LocationForm />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
