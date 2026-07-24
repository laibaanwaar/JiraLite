import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";

import {
  getProfile,
  updateProfile,
} from "../services/profileService";

const Profile = () => {
  const [profile, setProfile] = useState({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
  });

  const [originalProfile, setOriginalProfile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // GET PROFILE
  // ==========================================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await getProfile();

        const profileData = response.data;

        const normalizedProfile = {
          id: profileData?.id ?? "",
          first_name: profileData?.first_name ?? "",
          last_name: profileData?.last_name ?? "",
          email: profileData?.email ?? "",
        };

        setProfile(normalizedProfile);
        setOriginalProfile(normalizedProfile);
      } catch (err) {
        setError(
          err.message || "Unable to load your profile.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // DETECT UNSAVED CHANGES
  // ==========================================

  const hasChanges = useMemo(() => {
    if (!originalProfile) {
      return false;
    }

    return (
      profile.first_name.trim() !==
        originalProfile.first_name.trim() ||
      profile.last_name.trim() !==
        originalProfile.last_name.trim()
    );
  }, [profile, originalProfile]);

  // ==========================================
  // UPDATE PROFILE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // First name validation
    if (!profile.first_name.trim()) {
      setError("First name is required.");
      return;
    }

    // Last name validation
    if (!profile.last_name.trim()) {
      setError("Last name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await updateProfile({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
      });

      const updatedProfile = response.data;

      const normalizedProfile = {
        id: updatedProfile?.id ?? profile.id,

        first_name:
          updatedProfile?.first_name ??
          profile.first_name,

        last_name:
          updatedProfile?.last_name ??
          profile.last_name,

        email:
          updatedProfile?.email ??
          profile.email,
      };

      // Update UI with latest backend data
      setProfile(normalizedProfile);

      // Save as original so "Unsaved changes" disappears
      setOriginalProfile(normalizedProfile);

      // Toastify success notification
      toast.success(
        response?.message ||
          "Profile updated successfully.",
        {
          position: "top-right",
          autoClose: 3000,
        },
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // CANCEL CHANGES
  // ==========================================

  const handleCancel = () => {
    if (!originalProfile) {
      return;
    }

    setProfile(originalProfile);
    setError("");
  };

  // ==========================================
  // USER INFORMATION
  // ==========================================

  const initials =
    `${profile.first_name?.[0] || ""}${
      profile.last_name?.[0] || ""
    }`.toUpperCase() || "U";

  const fullName =
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "JiraLite User";

  return (
    <div className="min-h-full bg-[#F4F6F9]">
      <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">

        {/* =====================================
            PAGE HEADING
        ====================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>

            {/* Breadcrumb */}

            <div className="mb-3 flex items-center gap-2 text-sm">
              <Link
                to="/dashboard"
                className="font-semibold text-slate-500 transition hover:text-[#665CFF]"
              >
                Dashboard
              </Link>

              <span className="text-slate-300">
                /
              </span>

              <span className="font-bold text-[#665CFF]">
                Profile
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-[-1px] text-[#14223A]">
              My Profile
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and update your personal account
              information.
            </p>
          </div>
        </div>

        {/* =====================================
            PROFILE HERO CARD
        ====================================== */}

        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#101F35] via-[#152A49] to-[#1A355D] px-7 py-8 shadow-[0_20px_60px_rgba(15,30,51,0.15)] sm:px-9">

          {/* Decorative Glow */}

          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#665CFF]/25 blur-[30px]" />

          <div className="pointer-events-none absolute right-[25%] top-3 h-36 w-36 rotate-45 rounded-[32px] border border-white/5 bg-white/[0.025]" />

          <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">

            {/* Avatar + User Info */}

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative w-fit">

                <div className="flex h-24 w-24 items-center justify-center rounded-[27px] bg-gradient-to-br from-[#536DFE] to-[#795CF8] text-3xl font-black text-white shadow-[0_20px_50px_rgba(102,92,255,0.4)] sm:h-28 sm:w-28">
                  {initials}
                </div>

                {/* Active indicator */}

                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-[#152A49] bg-emerald-400" />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-300">
                  JiraLite Account
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-1px] text-white">
                  {isLoading
                    ? "Loading..."
                    : fullName}
                </h2>

                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  {isLoading
                    ? "Loading email..."
                    : profile.email}
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-xs font-bold text-slate-200">
                    Active Account
                  </span>
                </div>
              </div>
            </div>

            {/* User ID */}

            <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.07] px-6 py-4 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Account ID
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {profile.id
                  ? `#${profile.id}`
                  : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================
            PROFILE DETAILS CARD
        ====================================== */}

        <section className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_45px_rgba(15,30,51,0.07)]">

          {/* Header */}

          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-7 py-6 sm:flex-row sm:items-center sm:px-8">
            <div>
              <h2 className="text-xl font-black text-[#14223A]">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your personal details and account
                information.
              </p>
            </div>

            {/* Unsaved Changes Indicator */}

            {hasChanges && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" />

                Unsaved changes
              </div>
            )}
          </div>

          <div className="p-7 sm:p-8">

            {isLoading ? (
              <ProfileLoading />
            ) : (
              <form onSubmit={handleSubmit}>

                {/* Error Message */}

                {error && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                    <p className="text-sm font-bold text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* ===============================
                    EDITABLE DETAILS
                ================================ */}

                <div>

                  <SectionTitle
                    icon="P"
                    title="Basic Information"
                    subtitle="You can update these details."
                    color="purple"
                  />

                  <div className="mt-6 grid gap-6 md:grid-cols-2">

                    <EditableInput
                      label="First Name"
                      name="first_name"
                      value={profile.first_name}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />

                    <EditableInput
                      label="Last Name"
                      name="last_name"
                      value={profile.last_name}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />

                  </div>
                </div>

                <div className="my-9 h-px bg-slate-100" />

                {/* ===============================
                    READ-ONLY DETAILS
                ================================ */}

                <div>

                  <SectionTitle
                    icon="i"
                    title="Account Information"
                    subtitle="These details cannot be edited."
                    color="blue"
                  />

                  <div className="mt-6 grid gap-6 md:grid-cols-2">

                    <ReadOnlyInput
                      label="Email Address"
                      value={profile.email}
                      helper="Your registered and verified email address."
                    />

                    <ReadOnlyInput
                      label="User ID"
                      value={
                        profile.id
                          ? `#${profile.id}`
                          : ""
                      }
                      helper="Your unique JiraLite account identifier."
                    />

                  </div>
                </div>

                {/* ===============================
                    ACTION BUTTONS
                ================================ */}

                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-7 sm:flex-row sm:justify-end">

                  {/* Cancel */}

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={
                      !hasChanges || isSaving
                    }
                    className="rounded-xl border border-slate-300 bg-white px-7 py-3 font-bold text-[#14223A] transition-all duration-300 hover:border-[#665CFF] hover:text-[#665CFF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  {/* Save */}

                  <button
                    type="submit"
                    disabled={
                      !hasChanges || isSaving
                    }
                    className="rounded-xl bg-gradient-to-r from-[#536DFE] to-[#665CFF] px-8 py-3 font-extrabold text-white shadow-[0_10px_30px_rgba(102,92,255,0.27)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(102,92,255,0.4)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// ==============================================
// SECTION TITLE
// ==============================================

const SectionTitle = ({
  icon,
  title,
  subtitle,
  color,
}) => {
  const styles =
    color === "purple"
      ? "bg-[#665CFF]/10 text-[#665CFF]"
      : "bg-blue-50 text-[#0C66E4]";

  return (
    <div className="flex items-center gap-3">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl font-black ${styles}`}
      >
        {icon}
      </div>

      <div>
        <h3 className="font-black text-[#14223A]">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

    </div>
  );
};

// ==============================================
// EDITABLE INPUT
// ==============================================

const EditableInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-[#14223A]"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 font-medium text-[#14223A] outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-[#665CFF] focus:bg-white focus:ring-4 focus:ring-[#665CFF]/10"
      />

    </div>
  );
};

// ==============================================
// READ-ONLY INPUT
// ==============================================

const ReadOnlyInput = ({
  label,
  value,
  helper,
}) => {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-[#14223A]">
        {label}
      </label>

      <div className="relative">

        <input
          type="text"
          value={value}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3.5 pr-24 font-medium text-slate-500 outline-none"
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-slate-200 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          Read only
        </span>

      </div>

      <p className="mt-2 text-xs text-slate-400">
        {helper}
      </p>

    </div>
  );
};

// ==============================================
// LOADING UI
// ==============================================

const ProfileLoading = () => {
  return (
    <div className="animate-pulse">

      <div className="mb-8">

        <div className="mb-6 h-12 w-56 rounded-xl bg-slate-100" />

        <div className="grid gap-6 md:grid-cols-2">
          <LoadingField />
          <LoadingField />
        </div>

      </div>

      <div className="my-8 h-px bg-slate-100" />

      <div>

        <div className="mb-6 h-12 w-56 rounded-xl bg-slate-100" />

        <div className="grid gap-6 md:grid-cols-2">
          <LoadingField />
          <LoadingField />
        </div>

      </div>
    </div>
  );
};

const LoadingField = () => {
  return (
    <div>

      <div className="mb-3 h-4 w-24 rounded bg-slate-200" />

      <div className="h-14 rounded-xl bg-slate-100" />

    </div>
  );
};

export default Profile;