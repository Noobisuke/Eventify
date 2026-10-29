# Local Events — Local Event Discovery App

A full-stack mobile application for discovering, creating, and RSVPing to local events (open mics, workshops, festivals, concerts, sports, exhibitions, meetups). Built with **React Native (Expo)**, **Node.js/Express**, and **MongoDB**, using **OpenStreetMap** for all mapping (no Google Maps API key required).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo, React Navigation |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Maps | OpenStreetMap via Leaflet.js (WebView) |
| Image Upload | Multer + Cloudinary (falls back to local disk storage) |
| State | React Context API |
| Push Notifications | Expo Notifications |

---

## Project Structure

```
local-event-app/
├── server/                 # Node.js + Express backend
│   ├── config/              # DB + Cloudinary config
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Auth, error handling, validation
│   ├── models/               # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── utils/                 # JWT helper, seed script
│   ├── uploads/               # Local image storage (dev fallback)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/                # React Native (Expo) app
    ├── src/
    │   ├── components/        # Button, Input, EventCard, LeafletMap, etc.
    │   ├── screens/            # auth/, home/, event/, profile/, admin/
    │   ├── navigation/         # Stack + Tab navigators
    │   ├── services/           # Axios API layer
    │   ├── hooks/               # useLocation, usePushNotifications
    │   ├── context/             # Auth, Theme, Event context providers
    │   ├── constants/           # theme tokens, config
    │   └── assets/
    ├── App.js
    ├── app.json
    └── package.json
```

---

## Features

**Regular Users:** register/login, browse & search events, filter by category/city/date/price/distance, view on map, save favorites, RSVP (going/interested), share events, view event details, rate & comment.

**Organizers:** everything above, plus create/edit/delete events, upload event images, view attendee lists, QR-code check-in.

**Admins:** dashboard with analytics (users, organizers, events, RSVPs, top categories, reported content), manage user roles/status, moderate/approve/hide events, clear reports.

**Cross-cutting:** JWT auth with bcrypt password hashing, role-based authorization, light/dark mode, pull-to-refresh, loading skeletons, empty states, push notifications (RSVP confirmations, reminders), full-text + geospatial search.

---

## Prerequisites

- Node.js 18+
- MongoDB (local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- Expo Go app on your phone (for testing on a physical device), or an Android/iOS simulator

---

## 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/local-event-app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

Cloudinary variables are optional — if left blank, uploaded images are stored locally in `server/uploads/` and served via `/uploads/<filename>`.

**Seed sample data** (creates an admin, an organizer, a regular user, and 4 sample events):
```bash
npm run seed
```
```
Admin login:     admin@example.com / admin123
Organizer login: organizer@example.com / organizer123
User login:      user@example.com / user123
```

**Start the server:**
```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

The API will be running at `http://localhost:5000/api`. Check `http://localhost:5000/api/health` to confirm it's up.

---

## 2. Frontend Setup

```bash
cd frontend
npm install
```

Update the API URL in `app.json` under `expo.extra.apiUrl`:

- **iOS Simulator / Android Emulator on the same machine:** `http://localhost:5000/api` works as-is.
- **Physical device via Expo Go:** replace `localhost` with your computer's LAN IP, e.g. `http://192.168.1.10:5000/api` (find it with `ipconfig`/`ifconfig`). Your phone and computer must be on the same Wi-Fi network.

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a`/`i` to launch an emulator/simulator.

---

## API Overview

| Route | Description |
|---|---|
| `POST /api/auth/register` | Register (role: user or organizer) |
| `POST /api/auth/login` | Login, returns JWT |
| `GET /api/auth/me` | Current user profile |
| `PUT /api/auth/profile` | Update profile |
| `PUT /api/auth/change-password` | Change password |
| `POST /api/auth/forgot-password` / `reset-password/:token` | Password reset flow |
| `GET /api/events` | List/search/filter events (query params: `search, category, city, freeOnly, dateFrom, dateTo, lat, lng, distance, sort, page, limit`) |
| `POST /api/events` | Create event (organizer/admin, multipart with `images`) |
| `GET /api/events/:id` | Event details |
| `PUT /api/events/:id` / `DELETE /api/events/:id` | Update/delete (owner or admin) |
| `GET /api/events/organizer/mine` | Organizer's own events |
| `GET /api/events/:id/attendees` | Attendee list |
| `POST /api/events/:id/report` | Report inappropriate content |
| `POST /api/events/:id/rate` | Rate/review an event |
| `GET/POST/DELETE /api/favorites` | Manage saved events |
| `POST/DELETE /api/rsvp/:eventId` | RSVP / cancel |
| `GET /api/rsvp/mine` | My RSVPs |
| `POST /api/rsvp/checkin` | QR-code check-in (organizer/admin) |
| `GET /api/categories` | List categories |
| `GET/PUT/DELETE /api/notifications` | Notification inbox |
| `GET /api/users/:id` | Public organizer/user profile |
| `GET /api/users` (admin) | List all users |
| `PUT /api/users/:id/role` / `:id/status` (admin) | Manage roles/status |
| `GET /api/users/admin/analytics` (admin) | Dashboard stats |
| `PUT /api/users/admin/events/:id/approve` (admin) | Moderate events |

All protected routes require `Authorization: Bearer <token>`.

---

## Notes & Next Steps

- **Maps:** uses Leaflet.js rendered inside a WebView, tiled from the public OpenStreetMap tile server — no API key needed, but be mindful of OSM's tile usage policy for production traffic at scale.
- **Push notifications:** the Expo push token is captured client-side (`usePushNotifications` hook) but you'll need to call `authService.updateProfile({ pushToken })` after registration and wire up a server-side job (e.g. a cron task) that calls the [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) using stored tokens for reminders/new-nearby-event alerts.
- **Image uploads in Edit Profile:** the avatar picker currently keeps the local URI as a placeholder; wire it through the same Multer/Cloudinary upload endpoint used for events for production use.
- **Offline caching / infinite scroll:** Search screen already paginates; add `react-native-mmkv` or `AsyncStorage`-backed caching if offline support becomes a priority.
- **QR check-in scanning:** the check-in API (`POST /api/rsvp/checkin`) is ready; add `expo-barcode-scanner` or `expo-camera` on the organizer side to actually scan attendee QR codes at the door.

---

## License

This project is provided as a starting point / reference implementation — adapt freely for your own use.
