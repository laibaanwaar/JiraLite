import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router";

import { ToastContainer } from "react-toastify";

import AppLayout from "./components/layout/AppLayout";

import Dashboard from "./pages/Dashboard";
import InvitationResponse from "./pages/InvitationResponse";
import Invitations from "./pages/Invitations";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProjectDetails from "./pages/ProjectDetails";
import Projects from "./pages/Projects";
import Signup from "./pages/Signup";
import TaskDetails from "./pages/TaskDetails";
import VerifyOtp from "./pages/VerifyOtp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC PAGES
        ========================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/verify-otp"
          element={<VerifyOtp />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Invitation link from email */}

        <Route
          path="/invitations/respond"
          element={
            <InvitationResponse />
          }
        />

        {/* =========================
            AUTHENTICATED LAYOUT
            Sidebar + Navbar reused
        ========================== */}

        <Route element={<AppLayout />}>
          {/* Dashboard */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Projects Dashboard */}

          <Route
            path="/projects"
            element={<Projects />}
          />

          {/* Single Project Details */}

          <Route
            path="/projects/:projectId"
            element={
              <ProjectDetails />
            }
          />

          {/* =========================
              SINGLE TASK DETAILS
          ========================== */}

          <Route
            path="/tasks/:taskId"
            element={<TaskDetails />}
          />

          {/* Invitations */}

          <Route
            path="/invitations"
            element={<Invitations />}
          />

          {/* Profile */}

          <Route
            path="/profile"
            element={<Profile />}
          />
        </Route>
      </Routes>

      {/* =========================
          GLOBAL TOASTIFY
      ========================== */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
        limit={3}
      />
    </BrowserRouter>
  );
}

export default App;