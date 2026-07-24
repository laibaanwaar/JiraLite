const PROFILE_API_URL =
  "http://127.0.0.1:8000/api/auth/profile/";

const getAccessToken = () => {
  return (
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token")
  );
};

// GET PROFILE
export const getProfile = async () => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error(
      "Authentication token not found. Please log in again.",
    );
  }

  const response = await fetch(PROFILE_API_URL, {
    method: "GET",

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.detail ||
        "Unable to retrieve profile.",
    );
  }

  return data;
};

// PATCH PROFILE
export const updateProfile = async ({
  first_name,
  last_name,
}) => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error(
      "Authentication token not found. Please log in again.",
    );
  }

  const response = await fetch(PROFILE_API_URL, {
    method: "PATCH",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },

    body: JSON.stringify({
      first_name,
      last_name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.detail ||
        "Unable to update profile.",
    );
  }

  return data;
};