import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import DriverDashboard from "./pages/DriverDashboard";
import WelcomePage from "./pages/WelcomePage";
import SignupPage from './pages/SignupPage';
import { ErrorBoundary } from "./components/ErrorBoundary";


export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/book/:vehicleType" element={<BookingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>

    
  );
}
