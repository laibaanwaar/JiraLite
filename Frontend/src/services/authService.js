import api from "./api";

const authService = {
  signup: async (payload) => {
    const response = await api.post("/auth/signup/", payload);
    return response.data;
  },

  verifyOtp: async (payload) => {
    const response = await api.post("/auth/verify-otp/", payload);
    return response.data;
  },

  resendOtp: async (payload) => {
    const response = await api.post("/auth/resend-otp/", payload);
    return response.data;
  },

  login: async (payload) => {
    const response = await api.post("/auth/login/", payload);
    return response.data;
  },
};

export default authService;