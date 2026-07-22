import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import authService from "../services/authService";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  // This can show the success message passed from VerifyOtp.jsx
  const [message, setMessage] = useState(
    location.state?.message || "",
  );

  const [loading, setLoading] = useState(false);

  // Handle email/password input
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  // Extract backend error messages
  const getBackendErrorMessage = (errorData) => {
    if (!errorData) {
      return "Login failed. Please try again.";
    }

    // Example:
    // { "message": "Invalid email or password." }
    if (errorData.message) {
      return errorData.message;
    }

    // Example:
    // {
    //   "email": ["This field is required."]
    // }
    if (typeof errorData === "object") {
      const firstError = Object.values(errorData)[0];

      if (Array.isArray(firstError)) {
        return firstError[0];
      }

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    return "Login failed. Please check your email and password.";
  };

  // Login API integration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    // Frontend validation
    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Please enter your email and password.",
      );
      return;
    }

    try {
      setLoading(true);

      // Exact payload expected by Django backend
      const payload = {
        email: formData.email
          .trim()
          .toLowerCase(),
        password: formData.password,
      };

      /*
        Calls:

        POST /api/auth/login/

        Through:

        authService.login(payload)
      */

      const response =
        await authService.login(payload);

      /*
        Expected backend response:

        {
          "success": true,
          "message": "Login successful.",
          "data": {
            "user": {
              "id": "1",
              "first_name": "Laiba",
              "last_name": "Anwar",
              "email": "laiba@example.com"
            },
            "tokens": {
              "access": "...",
              "refresh": "..."
            }
          }
        }
      */

      const user = response?.data?.user;

      const accessToken =
        response?.data?.tokens?.access;

      const refreshToken =
        response?.data?.tokens?.refresh;

      // Validate expected backend response
      if (
        !user ||
        !accessToken ||
        !refreshToken
      ) {
        setError(
          "Login succeeded, but authentication data was not returned correctly.",
        );

        return;
      }

      /*
        Save authentication data.

        Remember Me checked:
        -> localStorage

        Remember Me unchecked:
        -> sessionStorage
      */

      // Clear any previous authentication data first
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
      sessionStorage.removeItem("user");

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem(
        "access_token",
        accessToken,
      );

      storage.setItem(
        "refresh_token",
        refreshToken,
      );

      storage.setItem(
        "user",
        JSON.stringify(user),
      );

      // Remove OTP email if still present
      sessionStorage.removeItem(
        "verification_email",
      );

      /*
        After successful login.

        Change "/dashboard" if your actual
        dashboard route has another path.
      */

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      // Backend returned 400, 401, 403, etc.
      if (err.response) {
        setError(
          getBackendErrorMessage(
            err.response.data,
          ),
        );

        return;
      }

      // Backend did not respond
      if (err.request) {
        setError(
          "Unable to connect to the backend. Make sure the Django server is running.",
        );

        return;
      }

      setError(
        "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#06152F]">
      {/* Background effects */}

      <div className="pointer-events-none absolute -left-52 top-0 h-[600px] w-[600px] rounded-full bg-blue-600/25 blur-[150px]" />

      <div className="pointer-events-none absolute right-0 top-[30%] h-[450px] w-[450px] rounded-full bg-blue-400/10 blur-[130px]" />

      {/* Left Branding */}

      <div className="relative hidden w-1/2 items-center justify-center p-14 lg:flex">
        <div className="relative z-10 max-w-lg">
          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >
            <div className="relative h-11 w-11">
              <div className="absolute left-[8px] top-[3px] h-8 w-8 rotate-45 rounded-md bg-gradient-to-br from-blue-400 to-blue-700" />

              <div className="absolute left-[16px] top-[11px] h-4 w-4 rotate-45 bg-white" />
            </div>

            <span className="text-3xl font-black text-white">
              Jira
              <span className="text-blue-400">
                Lite
              </span>
            </span>
          </Link>

          <h1 className="mt-12 text-5xl font-black leading-tight tracking-[-2px] text-white">
            Welcome back to your{" "}
            <span className="text-blue-400">
              workspace.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Sign in to manage your projects,
            check assigned tasks, collaborate
            with your team, and continue where
            you left off.
          </p>

          {/* 3D Task Card */}

          <div
            className="mt-12 max-w-sm rounded-[24px] border border-white/15 bg-white/10 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            style={{
              transform:
                "perspective(900px) rotateY(-8deg) rotateX(3deg)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-extrabold text-white">
                  Website Redesign
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Sprint progress
                </p>
              </div>

              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-300">
                Active
              </span>
            </div>

            <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-[72%] rounded-full bg-blue-400" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-300">
              72% completed
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-10 lg:w-1/2 lg:bg-slate-50">
        <div className="w-full max-w-[470px] rounded-[28px] border border-white/20 bg-white p-7 shadow-[0_40px_100px_rgba(0,0,0,0.28)] sm:p-10">
          {/* Mobile Logo */}

          <Link
            to="/"
            className="mb-8 flex justify-center text-3xl font-black text-[#172B4D] lg:hidden"
          >
            Jira
            <span className="text-[#0C66E4]">
              Lite
            </span>
          </Link>

          <h2 className="text-center text-3xl font-black tracking-[-1px] text-[#172B4D] sm:text-4xl">
            Welcome back
          </h2>

          <p className="mt-3 text-center text-slate-500">
            Log in to continue to your workspace.
          </p>

          {/* OTP Verification Success Message */}

          {message && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {/* Login Error */}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#172B4D]"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 outline-none transition-all placeholder:text-slate-400 focus:border-[#0C66E4] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-bold text-[#172B4D]"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-bold text-[#0C66E4] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 outline-none transition-all placeholder:text-slate-400 focus:border-[#0C66E4] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Remember Me */}

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
                disabled={loading}
                className="h-4 w-4 accent-[#0C66E4]"
              />

              <label
                htmlFor="remember"
                className="text-sm text-slate-600"
              >
                Remember me
              </label>
            </div>

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0C66E4] py-3.5 font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0055CC] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading
                ? "Logging in..."
                : "Log in"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-extrabold text-[#0C66E4] hover:underline"
            >
              Sign up
            </Link>
          </p>

          <div className="mt-5 text-center">
            <Link
              to="/"
              className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#0C66E4]"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;