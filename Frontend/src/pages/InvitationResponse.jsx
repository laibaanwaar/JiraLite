import {
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router";

import { toast } from "react-toastify";

import {
  acceptInvitation,
  declineInvitation,
} from "../services/invitationService";

const InvitationResponse = () => {
  const [searchParams] =
    useSearchParams();

  const token =
    searchParams.get("token") ||
    "";

  /*
    ==========================================================
    PRESERVE INVITATION URL DURING LOGIN
    ==========================================================

    Example:

    Invitation page:
    /invitations/respond?token=ABC123

    Login page:
    /login?redirect=%2Finvitations%2Frespond%3Ftoken%3DABC123

    After successful login, Login.jsx will use the "redirect"
    parameter and return the user to the invitation page.
  */
  const invitationReturnUrl =
    token
      ? `/invitations/respond?token=${encodeURIComponent(
          token,
        )}`
      : "";

  const loginRedirectUrl =
    invitationReturnUrl
      ? `/login?redirect=${encodeURIComponent(
          invitationReturnUrl,
        )}`
      : "/login";

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    completedAction,
    setCompletedAction,
  ] = useState("");

  const [
    resultMessage,
    setResultMessage,
  ] = useState("");

  const [error, setError] =
    useState("");

  /*
    ==========================================================
    CHECK WHETHER LOGIN LINK SHOULD BE SHOWN
    ==========================================================

    Handles backend errors such as:

    - Please log in with the invited email address...
    - This invitation does not belong to you.
    - Authentication credentials were not provided.
  */
  const normalizedError =
    error.toLowerCase();

  const shouldShowLoginLink =
    normalizedError.includes(
      "log in",
    ) ||
    normalizedError.includes(
      "login",
    ) ||
    normalizedError.includes(
      "does not belong",
    ) ||
    normalizedError.includes(
      "invited email",
    ) ||
    normalizedError.includes(
      "authentication",
    ) ||
    normalizedError.includes(
      "credentials",
    );

  // ==========================================
  // ACCEPT INVITATION
  // ==========================================

  const handleAccept = async () => {
    if (!token) {
      setError(
        "Invitation token is missing from this link.",
      );

      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response =
        await acceptInvitation(
          token,
        );

      setCompletedAction(
        "accepted",
      );

      setResultMessage(
        response?.message ||
          "Invitation accepted successfully.",
      );

      toast.success(
        response?.message ||
          "Invitation accepted successfully.",
      );
    } catch (err) {
      /*
        Keep the error on the invitation page.

        We intentionally do not call toast.error()
        here because the same error would otherwise
        appear twice:
        1. Toast notification
        2. Red error box
      */
      setError(
        err?.message ||
          "Unable to accept invitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // DECLINE INVITATION
  // ==========================================

  const handleDecline =
    async () => {
      if (!token) {
        setError(
          "Invitation token is missing from this link.",
        );

        return;
      }

      try {
        setIsSubmitting(true);
        setError("");

        const response =
          await declineInvitation(
            token,
          );

        setCompletedAction(
          "declined",
        );

        setResultMessage(
          response?.message ||
            "Invitation declined successfully.",
        );

        toast.success(
          response?.message ||
            "Invitation declined successfully.",
        );
      } catch (err) {
        /*
          Same reason as Accept:
          show the error only once
          inside the invitation form.
        */
        setError(
          err?.message ||
            "Unable to decline invitation.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  // ==========================================
  // INVALID LINK
  // ==========================================

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-[520px] rounded-[22px] border border-red-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,30,51,0.10)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#14223A]">
            Invalid invitation link
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            The invitation token is
            missing from this link.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#3563E9] px-5 py-3 font-extrabold text-white transition hover:bg-[#2F58D3]"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // COMPLETED RESULT
  // ==========================================

  if (completedAction) {
    const wasAccepted =
      completedAction ===
      "accepted";

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-[520px] rounded-[22px] border border-slate-200 bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,30,51,0.10)]">
          <div
            className={`
              mx-auto
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-full
              text-3xl
              font-black
              ${
                wasAccepted
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-600"
              }
            `}
          >
            {wasAccepted
              ? "✓"
              : "×"}
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#14223A]">
            Invitation{" "}
            {wasAccepted
              ? "accepted"
              : "declined"}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {resultMessage}
          </p>

          {wasAccepted ? (
            <Link
              to="/projects"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#3563E9] px-5 py-3 font-extrabold text-white transition hover:bg-[#2F58D3]"
            >
              View projects
            </Link>
          ) : (
            <Link
              to="/dashboard"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#3563E9] px-5 py-3 font-extrabold text-white transition hover:bg-[#2F58D3]"
            >
              Go to dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // INVITATION FORM
  // ==========================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] px-4 py-8">
      <div className="w-full max-w-[560px] rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,30,51,0.12)] sm:p-9">

        {/* =====================================
            HEADER
        ====================================== */}

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-3xl text-[#3563E9]">
            ✉
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#14223A]">
            Project invitation
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            You have been invited to
            join a JiraLite project.
            Choose whether you want to
            accept or decline this
            invitation.
          </p>
        </div>

        {/* =====================================
            LOGIN INFORMATION
        ====================================== */}

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm leading-6 text-blue-700">
            You must be signed in with
            the same email address that
            received this invitation.
            If you are already signed in
            with that account, you can
            accept or decline directly.
          </p>
        </div>

        {/* =====================================
            ERROR MESSAGE
        ====================================== */}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            <p>
              {error}
            </p>

            {shouldShowLoginLink && (
              <Link
                /*
                  IMPORTANT:

                  The invitation token is preserved
                  inside the redirect query parameter.

                  After successful login, Login.jsx
                  should redirect the user back here.
                */
                to={loginRedirectUrl}
                className="mt-3 inline-block font-extrabold text-[#3563E9] underline underline-offset-2"
              >
                Log in with invited email
              </Link>
            )}
          </div>
        )}

        {/* =====================================
            ACTION BUTTONS
        ====================================== */}

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#3563E9] px-5 py-3.5 font-extrabold text-white shadow-[0_8px_22px_rgba(53,99,233,0.25)] transition hover:bg-[#2F58D3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Processing..."
              : "Accept invitation"}
          </button>

          <button
            type="button"
            onClick={handleDecline}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-bold text-[#14223A] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Decline invitation
          </button>
        </div>

        {/* =====================================
            FOOTER MESSAGE
        ====================================== */}

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          The invitation may stop working
          after its expiration date or
          after it has already been
          processed.
        </p>
      </div>
    </div>
  );
};

export default InvitationResponse;