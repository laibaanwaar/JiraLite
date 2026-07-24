const API_BASE_URL =
  "http://127.0.0.1:8000/api";

// ==========================================
// ACCESS TOKEN
// ==========================================
//
// Supports both:
// - Remember Me -> localStorage
// - Normal login -> sessionStorage
//
const getAccessToken = () => {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("access_token")
  );
};

// ==========================================
// FORMAT BACKEND ERRORS
// ==========================================

const getErrorMessage = (data) => {
  if (!data) {
    return "Something went wrong.";
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
    const error = Object.entries(data)
      .map(([field, value]) => {
        const readableField = field
          .replaceAll("_", " ")
          .replace(
            /\b\w/g,
            (letter) =>
              letter.toUpperCase(),
          );

        const message =
          Array.isArray(value)
            ? value.join(" ")
            : String(value);

        return `${readableField}: ${message}`;
      })
      .join(" ");

    if (error) {
      return error;
    }
  }

  return "Something went wrong.";
};

// ==========================================
// COMMON REQUEST
// ==========================================

const apiRequest = async (
  url,
  options = {},
) => {
  const accessToken =
    getAccessToken();

  if (!accessToken) {
    throw new Error(
      "Authentication token not found. Please log in again.",
    );
  }

  const response = await fetch(
    url,
    {
      ...options,

      headers: {
        Accept:
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
// GET PROFILE
// GET /api/auth/profile/
// ==========================================

export const getDashboardProfile =
  async () => {
    return apiRequest(
      `${API_BASE_URL}/auth/profile/`,
      {
        method: "GET",
      },
    );
  };

// ==========================================
// GET USER PROJECTS
// GET /api/projects/
// ==========================================

export const getDashboardProjects =
  async () => {
    return apiRequest(
      `${API_BASE_URL}/projects/`,
      {
        method: "GET",
      },
    );
  };

// ==========================================
// GET PROJECT MEMBERS
// GET /api/projects/{id}/members/
// ==========================================

export const getDashboardProjectMembers =
  async (projectId) => {
    if (!projectId) {
      throw new Error(
        "Project ID is required.",
      );
    }

    return apiRequest(
      `${API_BASE_URL}/projects/${projectId}/members/`,
      {
        method: "GET",
      },
    );
  };

// ==========================================
// GET PROJECT TASKS
// GET /api/projects/{id}/tasks/
// ==========================================

export const getDashboardProjectTasks =
  async (projectId) => {
    if (!projectId) {
      throw new Error(
        "Project ID is required.",
      );
    }

    return apiRequest(
      `${API_BASE_URL}/projects/${projectId}/tasks/`,
      {
        method: "GET",
      },
    );
  };