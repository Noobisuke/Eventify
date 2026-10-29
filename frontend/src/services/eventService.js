import api from './api';

export const eventService = {
  /** params: { search, category, city, freeOnly, dateFrom, dateTo, lat, lng, distance, sort, page, limit } */
  getEvents: (params = {}) => api.get('/events', { params }).then((res) => res.data),

  getEventById: (id) => api.get(`/events/${id}`).then((res) => res.data),

  getMyEvents: () => api.get('/events/organizer/mine').then((res) => res.data),

  /** formData should be a FormData instance including images under 'images' field */
  createEvent: (formData) =>
    api
      .post('/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data),

  updateEvent: (id, formData) =>
    api
      .put(`/events/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data),

  deleteEvent: (id) => api.delete(`/events/${id}`).then((res) => res.data),

  getAttendees: (id) => api.get(`/events/${id}/attendees`).then((res) => res.data),

  reportEvent: (id) => api.post(`/events/${id}/report`).then((res) => res.data),

  rateEvent: (id, rating, comment) =>
    api.post(`/events/${id}/rate`, { rating, comment }).then((res) => res.data),
};
