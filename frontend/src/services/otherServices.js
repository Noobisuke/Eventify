import api from './api';

export const favoriteService = {
  getFavorites: () => api.get('/favorites').then((res) => res.data),
  addFavorite: (eventId) => api.post(`/favorites/${eventId}`).then((res) => res.data),
  removeFavorite: (eventId) => api.delete(`/favorites/${eventId}`).then((res) => res.data),
};

export const rsvpService = {
  getMyRsvps: () => api.get('/rsvp/mine').then((res) => res.data),
  createRsvp: (eventId, status = 'going') =>
    api.post(`/rsvp/${eventId}`, { status }).then((res) => res.data),
  cancelRsvp: (eventId) => api.delete(`/rsvp/${eventId}`).then((res) => res.data),
  checkInByQrCode: (qrCode) => api.post('/rsvp/checkin', { qrCode }).then((res) => res.data),
};

export const categoryService = {
  getCategories: () => api.get('/categories').then((res) => res.data),
};

export const notificationService = {
  getNotifications: () => api.get('/notifications').then((res) => res.data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`).then((res) => res.data),
  markAllAsRead: () => api.put('/notifications/read-all').then((res) => res.data),
  deleteNotification: (id) => api.delete(`/notifications/${id}`).then((res) => res.data),
};

export const userService = {
  getUserProfile: (id) => api.get(`/users/${id}`).then((res) => res.data),
  // Admin
  getAllUsers: (params = {}) => api.get('/users', { params }).then((res) => res.data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }).then((res) => res.data),
  toggleUserStatus: (id) => api.put(`/users/${id}/status`).then((res) => res.data),
  deleteUser: (id) => api.delete(`/users/${id}`).then((res) => res.data),
  getAnalytics: () => api.get('/users/admin/analytics').then((res) => res.data),
  moderateEvent: (id, payload) => api.put(`/users/admin/events/${id}/approve`, payload).then((res) => res.data),
};
