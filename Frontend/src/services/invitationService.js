const API_BASE_URL =
  "http://127.0.0.1:8000/api";

// ==========================================
// GET ACCESS TOKEN
// ==========================================
//
// Login.jsx stores authentication token:
//
// Remember Me checked:
// -> localStorage
//
// Remember Me unchecked:
// -> sessionStorage
//
// Therefore invitation APIs must check both.
//
const getAccessToken = () => {
  return (
    // localStorage
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||

    // sessionStorage
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("access_token")
  );
};

// ==========================================
// FORMAT ERROR
// ==========================================

const getErrorMessage = (data) => {
  if (!data) {
    return "Unable to process invitation.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === "object") {
    const message = Object.entries(data)
      .map(([field, value]) => {
        const fieldName = field
          .replaceAll("_", " ")
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase(),
          );

        const errorValue =
          Array.isArray(value)
            ? value.join(" ")
            : String(value);

        return `${fieldName}: ${errorValue}`;
      })
      .join(" ");

    if (message) {
      return message;
    }
  }

  return "Unable to process invitation.";
};

// ==========================================
// AUTHENTICATED REQUEST
// ==========================================

const invitationRequest = async (
  url,
  options = {},
) => {
  const accessToken =
    getAccessToken();

  if (!accessToken) {
    throw new Error(
      "Please log in with the invited email address before responding.",
    );
  }

  const response = await fetch(
    url,
    {
      ...options,

      headers: {
        Accept:
          "application/json",

        "Content-Type":
          "application/json",

        Authorization: `Bearer ${accessToken}`,

        ...options.headers,
      },
    },
  );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data),
    );
  }

  return data;
};

// ==========================================
// ACCEPT INVITATION
// POST /api/invitations/{token}/accept/
// ==========================================

export const acceptInvitation =
  async (token) => {
    if (!token?.trim()) {
      throw new Error(
        "Invitation token is missing.",
      );
    }

    return invitationRequest(
      `${API_BASE_URL}/invitations/${encodeURIComponent(
        token.trim(),
      )}/accept/`,
      {
        method: "POST",

        body: JSON.stringify({}),
      },
    );
  };

// ==========================================
// DECLINE INVITATION
// POST /api/invitations/{token}/decline/
// ==========================================

export const declineInvitation =
  async (token) => {
    if (!token?.trim()) {
      throw new Error(
        "Invitation token is missing.",
      );
    }

    return invitationRequest(
      `${API_BASE_URL}/invitations/${encodeURIComponent(
        token.trim(),
      )}/decline/`,
      {
        method: "POST",

        body: JSON.stringify({}),
      },
    );
  };

// ==========================================
// GET MY INVITATIONS
// GET /api/invitations/
// ==========================================

export const getMyInvitations =
  async () => {
    return invitationRequest(
      `${API_BASE_URL}/invitations/`,
      {
        method: "GET",
      },
    );
  };