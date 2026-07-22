import { useState } from "react";
import { Link, useNavigate } from "react-router";

import authService from "../services/authService";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Update form values
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Extract useful backend validation messages
  const getBackendErrorMessage = (errorData) => {
    if (!errorData) {
      return "Signup failed. Please try again.";
    }

    // Example:
    // { "message": "Email already exists." }
    if (errorData.message) {
      return errorData.message;
    }

    // Example:
    // {
    //   "email": ["This field is required."]
    // }
    if (typeof errorData === "object") {
      const firstFieldError = Object.values(errorData)[0];

      if (Array.isArray(firstFieldError)) {
        return firstFieldError[0];
      }

      if (typeof firstFieldError === "string") {
        return firstFieldError;
      }
    }

    return "Signup failed. Please check your details.";
  };

  // Submit signup form
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Frontend required-field validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Exact payload expected by Django backend
      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      // POST /api/auth/signup/
      const response = await authService.signup(payload);

      /*
        Expected backend response:

        {
          "message":
            "Signup successful. A verification OTP has been sent to your email.",
          "data": {
            "email": "laiba@example.com",
            "is_verified": false
          }
        }
      */

      const verificationEmail = response?.data?.email;

      if (!verificationEmail) {
        setError(
          "Account was created, but the verification email was not returned.",
        );
        return;
      }

      // Save email temporarily for OTP verification page
      sessionStorage.setItem(
        "verification_email",
        verificationEmail,
      );

      // Redirect to OTP verification screen
      navigate("/verify-otp", {
        state: {
          email: verificationEmail,
          message: response.message,
        },
      });
    } catch (err) {
      // Request reached backend and backend returned an error
      if (err.response) {
        setError(
          getBackendErrorMessage(err.response.data),
        );
        return;
      }

      // Request was sent but no response received
      if (err.request) {
        setError(
          "Unable to connect to the backend. Make sure the Django server is running.",
        );
        return;
      }

      // Unexpected frontend error
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#06152F]">
      {/* Background glow */}
      <div className="pointer-events-none absolute -left-52 top-0 h-[600px] w-[600px] rounded-full bg-blue-600/25 blur-[150px]" />

      <div className="pointer-events-none absolute -right-52 bottom-0 h-[600px] w-[600px] rounded-full bg-violet-500/15 blur-[150px]" />

      {/* Left Side */}
      <div className="relative hidden w-[48%] items-center justify-center overflow-hidden p-14 lg:flex">
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
            Start organizing your work{" "}
            <span className="text-blue-400">
              better.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Create your account and bring your projects,
            tasks, and team into one organized workspace.
          </p>

          <div className="mt-10 space-y-5">
            <SignupBenefit text="Create and manage projects" />
            <SignupBenefit text="Collaborate with your team" />
            <SignupBenefit text="Track progress in real time" />
          </div>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-10 lg:w-[52%] lg:bg-slate-50">
        <div className="w-full max-w-[520px] rounded-[28px] border border-white/20 bg-white p-7 shadow-[0_40px_100px_rgba(0,0,0,0.28)] sm:p-10">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
          >
            <span className="text-3xl font-black text-[#172B4D]">
              Jira
              <span className="text-[#0C66E4]">
                Lite
              </span>
            </span>
          </Link>

          <h2 className="text-center text-3xl font-black tracking-[-1px] text-[#172B4D] sm:text-4xl">
            Create your account
          </h2>

          <p className="mt-3 text-center text-slate-500">
            Start managing your projects with JiraLite.
          </p>

          {/* Error Message */}
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
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                label="First Name"
                type="text"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />

              <FormInput
                label="Last Name"
                type="text"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </div>

            <FormInput
              label="Email Address"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <FormInput
              label="Password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Enter your password again"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#0C66E4] py-3.5 font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0055CC] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-extrabold text-[#0C66E4] hover:underline"
            >
              Log in
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

// Reusable input component
const FormInput = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  autoComplete,
}) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-[#172B4D]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-[#172B4D] outline-none transition-all placeholder:text-slate-400 focus:border-[#0C66E4] focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
};

// Left-side benefits
const SignupBenefit = ({ text }) => {
  return (
    <div className="flex items-center gap-4 text-slate-200">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 font-bold text-white">
        ✓
      </span>

      <span className="font-semibold">
        {text}
      </span>
    </div>
  );
};

export default Signup;