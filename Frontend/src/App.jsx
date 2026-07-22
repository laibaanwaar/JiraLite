import { BrowserRouter, Route, Routes } from "react-router";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Invitations from "./pages/Invitations";
import Projects from "./pages/Projects";
import Signup from "./pages/Signup";
import VerifyOtp from "./pages/VerifyOtp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />

        {/* Authenticated Layout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/invitations"
            element={<Invitations />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
