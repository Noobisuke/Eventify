import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data).then((res) => res.data),
  verifyEmail: (email, otp) => api.post('/auth/verify-email', { email, otp }).then((res) => res.data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }).then((res) => res.data),
  login: (data) => api.post('/auth/login', data).then((res) => res.data),
  getMe: () => api.get('/auth/me').then((res) => res.data),
  updateProfile: (data) => api.put('/auth/profile', data).then((res) => res.data),
  changePassword: (data) => api.put('/auth/change-password', data).then((res) => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((res) => res.data),
  resetPassword: (email, otp, newPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword }).then((res) => res.data),
};
