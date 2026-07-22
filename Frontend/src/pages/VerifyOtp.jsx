import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import authService from "../services/authService";

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Prefer email passed from Signup page.
  // Fallback to sessionStorage so refresh does not lose it.
  const email =
    location.state?.email ||
    sessionStorage.getItem("verification_email") ||
    "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);

  const [message, setMessage] = useState(
    location.state?.message || "",
  );

  const [error, setError] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (seconds <= 0) return undefined;

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleChange = (index, value) => {
    const number = value.replace(/\D/g, "");

    const newOtp = [...otp];
    newOtp[index] = number.slice(-1);

    setOtp(newOtp);
    setError("");
    setMessage("");

    if (number && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (
      event.key === "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();

    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedOtp) return;

    const newOtp = ["", "", "", "", "", ""];

    pastedOtp.split("").forEach((number, index) => {
      newOtp[index] = number;
    });

    setOtp(newOtp);
    setError("");
    setMessage("");

    // Focus last filled OTP input
    const focusIndex = Math.min(pastedOtp.length, 6) - 1;

    if (focusIndex >= 0) {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const getBackendErrorMessage = (errorData) => {
    if (!errorData) {
      return "Something went wrong. Please try again.";
    }

    // Example:
    // { "message": "Invalid OTP." }
    if (errorData.message) {
      return errorData.message;
    }

    // Example:
    // { "otp": ["This field is required."] }
    if (typeof errorData === "object") {
      const firstError = Object.values(errorData)[0];

      if (Array.isArray(firstError)) {
        return firstError[0];
      }

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    return "Something went wrong. Please try again.";
  };

  // POST /api/auth/verify-otp/
  const handleVerify = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Verification email is missing. Please sign up again.",
      );
      return;
    }

    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setVerifying(true);

      const payload = {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      };

      const response = await authService.verifyOtp(payload);

      /*
        Expected backend response:

        {
          "message":
            "Email verified successfully. You can now log in.",
          "data": {
            "email": "laiba@example.com",
            "is_verified": true,
            "is_active": true
          }
        }
      */

      if (!response?.data?.is_verified) {
        setError(
          "Email verification was not completed. Please try again.",
        );
        return;
      }

      // Email is no longer needed after successful verification
      sessionStorage.removeItem("verification_email");

      navigate("/login", {
        replace: true,
        state: {
          message:
            response.message ||
            "Email verified successfully. You can now log in.",
        },
      });
    } catch (err) {
      if (err.response) {
        setError(
          getBackendErrorMessage(err.response.data),
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the backend. Make sure the Django server is running.",
        );
      } else {
        setError(
          "OTP verification failed. Please try again.",
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  // POST /api/auth/resend-otp/
  const handleResend = async () => {
    if (seconds > 0 || resending) return;

    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Verification email is missing. Please sign up again.",
      );
      return;
    }

    try {
      setResending(true);

      const payload = {
        email: email.trim().toLowerCase(),
      };

      const response = await authService.resendOtp(payload);

      /*
        Expected response:

        {
          "message":
            "A new verification OTP has been sent to your email."
        }
      */

      setOtp(["", "", "", "", "", ""]);

      setMessage(
        response?.message ||
          "A new verification OTP has been sent to your email.",
      );

      // Restart resend countdown
      setSeconds(30);

      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err.response) {
        setError(
          getBackendErrorMessage(err.response.data),
        );
      } else if (err.request) {
        setError(
          "Unable to connect to the backend. Make sure the Django server is running.",
        );
      } else {
        setError(
          "Unable to resend OTP. Please try again.",
        );
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#06152F]">
      {/* Background */}
      <div className="pointer-events-none absolute -left-52 top-0 h-[600px] w-[600px] rounded-full bg-blue-600/25 blur-[150px]" />

      <div className="pointer-events-none absolute -right-52 bottom-0 h-[600px] w-[600px] rounded-full bg-blue-400/10 blur-[150px]" />

      {/* LEFT SIDE */}
      <div className="relative hidden w-[48%] items-center justify-center p-14 lg:flex">
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
            One quick step to{" "}
            <span className="text-blue-400">
              secure your account.
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Enter the verification code sent to your email to
            complete your JiraLite account setup.
          </p>

          {/* 3D Card */}
          <div
            className="mt-12 max-w-sm rounded-[26px] border border-white/15 bg-white/10 p-6 shadow-[0_35px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            style={{
              transform:
                "perspective(900px) rotateY(-7deg) rotateX(3deg)",
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-2xl text-blue-300">
                ✉
              </div>

              <div>
                <p className="font-extrabold text-white">
                  Email Verification
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Protecting your JiraLite account
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Feature text="Secure account access" />
              <Feature text="6-digit verification code" />
              <Feature text="Quick email confirmation" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-10 lg:w-[52%] lg:bg-slate-50">
        <div className="w-full max-w-[520px] rounded-[30px] border border-white/20 bg-white p-7 shadow-[0_40px_100px_rgba(0,0,0,0.28)] sm:p-10">
          <Link
            to="/"
            className="mb-8 flex justify-center text-3xl font-black text-[#172B4D] lg:hidden"
          >
            Jira
            <span className="text-[#0C66E4]">
              Lite
            </span>
          </Link>

          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-50 to-blue-100 text-3xl shadow-[0_15px_35px_rgba(12,102,228,0.15)]">
            ✉
          </div>

          <h2 className="mt-7 text-center text-3xl font-black tracking-[-1px] text-[#172B4D] sm:text-4xl">
            Verify your email
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-center leading-7 text-slate-500">
            We sent a 6-digit verification code to
          </p>

          <p className="mt-1 break-all text-center font-extrabold text-[#0C66E4]">
            {email || "your email address"}
          </p>

          {message && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleVerify}
            className="mt-8"
          >
            <label className="block text-center text-sm font-bold text-[#172B4D]">
              Enter verification code
            </label>

            {/* OTP Inputs */}
            <div
              className="mt-5 flex justify-center gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] =
                      element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={
                    index === 0
                      ? "one-time-code"
                      : "off"
                  }
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleChange(
                      index,
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(index, event)
                  }
                  disabled={verifying}
                  className="h-14 w-11 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-black text-[#172B4D] outline-none transition-all duration-200 focus:-translate-y-1 focus:border-[#0C66E4] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:w-14 sm:text-2xl"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={
                verifying ||
                otp.join("").length !== 6
              }
              className="mt-8 w-full rounded-xl bg-[#0C66E4] py-3.5 font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0055CC] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {verifying
                ? "Verifying..."
                : "Verify OTP"}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-7 text-center">
            <p className="text-sm text-slate-500">
              Didn't receive the verification code?
            </p>

            {seconds > 0 ? (
              <p className="mt-2 text-sm font-bold text-slate-500">
                Resend code in{" "}
                <span className="text-[#0C66E4]">
                  00:
                  {String(seconds).padStart(
                    2,
                    "0",
                  )}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="mt-2 rounded-lg px-4 py-2 text-sm font-extrabold text-[#0C66E4] transition-all hover:bg-blue-50 hover:text-[#0055CC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resending
                  ? "Sending..."
                  : "Resend OTP"}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Wrong email?
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            to="/signup"
            className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3.5 font-bold text-[#172B4D] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0C66E4] hover:text-[#0C66E4] hover:shadow-md"
          >
            ← Change email address
          </Link>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ text }) => {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">
        ✓
      </span>

      <span className="font-semibold">
        {text}
      </span>
    </div>
  );
};

export default VerifyOtp;