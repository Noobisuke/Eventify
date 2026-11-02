# Eventify — Local Event Discovery App

Find, create and RSVP to events happening near you: open mics, workshops, festivals, concerts, sports, exhibitions and meetups. Eventify runs on Android, iOS and the web from a single React Native (Expo) codebase, with a Node.js/Express API and MongoDB behind it.

**No Google Maps key, no mapping bills.** Maps use OpenStreetMap + Leaflet.js, and address search uses OSM Nominatim.

---

## Contents

1. [Highlights](#highlights)
2. [Tech stack](#tech-stack)
3. [Quick start](#quick-start)
4. [Configuration reference](#configuration-reference)
5. [Roles and permissions](#roles-and-permissions)
6. [API reference](#api-reference)
7. [Project structure](#project-structure)
8. [How it works](#how-it-works)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Known gaps and next steps](#known-gaps-and-next-steps)
12. [License](#license)

---

## Highlights

- **Discovery:** keyword search, filters (category, city, date, free-only, distance), sorting (upcoming, trending, popular, newest), infinite scroll, and a "Nearby" feed based on GPS.
- **Map view:** events plotted as pins on OpenStreetMap, with a preview card on tap.
- **RSVP and QR tickets:** every RSVP generates a unique QR token. Organizers check attendees in at the door.
- **Three roles:** attendees, organizers and admins, each with their own screens and permissions.
- **Verified sign-up:** emails are checked for typos, disposable domains and valid DNS MX records, then confirmed with a 6-digit OTP.
- **Admin tools:** analytics dashboard, user and role management, event moderation.
- **Polish:** light/dark/system theme, pull-to-refresh, loading skeletons, empty states, optimistic favorites, in-app notifications.
- **Web support:** on wide screens the app renders inside a centered phone frame with a branded sidebar.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React Native 0.86, Expo SDK 57, React 19, React Navigation 6, react-native-web |
| State | React Context (Auth, Theme, Event) |
| HTTP | Axios with a JWT interceptor |
| Maps | Leaflet.js in a WebView (native) or iframe (web), OSM tiles, Nominatim geocoding |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB with Mongoose 8 (2dsphere geo index and text index) |
| Auth | JWT, bcryptjs, HMAC-SHA256 hashed OTPs |
| Email | Brevo HTTPS API, falling back to Gmail SMTP (Nodemailer) |
| Uploads | Multer, Cloudinary (falls back to local disk in development) |
| Security | Helmet, CORS, express-rate-limit, express-validator |
| Device APIs | expo-location, expo-notifications, expo-image-picker, expo-secure-store |
| Tickets | react-native-qrcode-svg |
| Hosting | Vercel (API and web build), Expo EAS (Android/iOS builds) |

---

## Quick start

### Prerequisites

- Node.js 18 or newer
- MongoDB: a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A phone with **Expo Go**, or an Android emulator / iOS simulator. A web browser also works.

### 1. Start the backend

```bash
cd server
npm install
cp .env.example .env     # then edit .env (see below)
npm run seed             # optional: load sample data
npm run dev              # auto-restarts on change; use `npm start` for plain node
```

Minimum `.env` for local development:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/local-event-app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=*
```

Confirm it is running: open <http://localhost:5000/api/health>.

> **Email in development:** if no email credentials are set, verification emails are printed to the server console instead of being sent. Copy the OTP from there.

> **`npm run seed` wipes the database** before inserting data. Never run it against a database you care about.

### 2. Start the frontend

```bash
cd frontend
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS), or `w` (web), or scan the QR code with Expo Go.

**Pointing the app at your API.** The API URL comes from `expo.extra.apiUrl` in `frontend/app.json`. The committed value may point at the hosted production API, so for local work:

| Where you run the app | What to do |
|---|---|
| Emulator or simulator on the same machine | Set `apiUrl` to `http://localhost:5000/api` (Android emulators may need `http://10.0.2.2:5000/api`) |
| Physical phone with Expo Go | Leave `apiUrl` empty in development and the app detects your computer's LAN IP automatically, or set it by hand, e.g. `http://192.168.1.10:5000/api` |
| Web browser | `http://localhost:5000/api` |

Your phone and computer must be on the same Wi-Fi network.

### 3. Log in with sample accounts

After `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Organizer | `organizer@example.com` | `organizer123` |
| User | `user@example.com` | `user123` |

The seed loads default categories and about 60 sample events across 12 categories, located around Ludhiana, India. If you are testing elsewhere, the map falls back to Ludhiana (30.901, 75.8573) when location permission is denied.

Past events drop out of the feed over time. Re-roll dates with the maintenance scripts in `server/utils/` (see [Seed and maintenance scripts](#seed-and-maintenance-scripts)).

---

## Configuration reference

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port. Default `5000`. |
| `MONGO_URI` | **Yes** | MongoDB connection string (local or Atlas). |
| `JWT_SECRET` | **Yes** | Signs JWTs and keys the OTP hash. Use a long random value. |
| `JWT_EXPIRES_IN` | No | Token lifetime. Default `7d`. |
| `CLIENT_URL` | No | Allowed CORS origin. `*` for development. Set your real origin in production. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Production | Image storage. If blank, uploads go to `server/uploads/` and are served at `/uploads/<file>`. **On Vercel, omitting these makes uploads fail** (read-only filesystem). |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | Recommended | Sends OTP emails over HTTPS (port 443), which works on hosts that block SMTP. Preferred over Gmail. |
| `EMAIL_USER`, `EMAIL_PASS` | Fallback | Gmail address and [App Password](https://support.google.com/accounts/answer/185833) for SMTP. |

Email sending order: Brevo if configured, then Gmail SMTP, then console logging.

### Frontend (`frontend/app.json`)

| Key | Description |
|---|---|
| `expo.extra.apiUrl` | Base URL of the API, including `/api`. |
| `expo.extra.eas.projectId` | EAS project ID (needed for builds and push tokens). |
| `expo.android.permissions` | Location permissions (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`). |

### Seed and maintenance scripts

Run from the `server/` folder.

| Command | What it does |
|---|---|
| `npm run seed` | Resets the database, then creates default users, categories and sample events. **Destructive.** |
| `node utils/addSampleEvents.js` | Adds sample events without a full reset. |
| `node utils/refreshSampleEvents.js` | Moves past sample events forward so the feed has upcoming items. |
| `node utils/fetchSampleImages.js` | Downloads and indexes royalty-free Unsplash images for categories (writes `sampleImages.json`). |

---

## Roles and permissions

| Capability | Guest | User | Organizer | Admin |
|---|:-:|:-:|:-:|:-:|
| Browse, search, view details and map | ✅ | ✅ | ✅ | ✅ |
| RSVP and receive a QR ticket | | ✅ | ✅ | ✅ |
| Save favorites, rate, comment, report | | ✅ | ✅ | ✅ |
| Create and edit own events, upload images, drop map pins | | | ✅ | ✅ |
| View attendee roster | | | Own events | All events |
| QR check-in at the door | | | ✅ | ✅ |
| Analytics dashboard | | | | ✅ |
| Moderate events (approve, hide, clear reports) | | | | ✅ |
| Manage users, roles and categories | | | | ✅ |

Users choose **User** or **Organizer** at registration. Only admins can change a role afterwards.

---

## API reference

Base URL: `http://localhost:5000/api`. Protected routes need `Authorization: Bearer <token>`.

### Auth

| Route | Access | Description |
|---|---|---|
| `POST /auth/register` | Public | Create an account and send an OTP. Account starts unverified. |
| `POST /auth/verify-email` | Public | Submit the 6-digit OTP; returns a JWT. |
| `POST /auth/resend-verification` | Public | Resend the OTP (60-second cooldown). |
| `POST /auth/login` | Public | Email and password; returns a JWT. |
| `GET /auth/me` | User | Current profile. |
| `PUT /auth/profile` | User | Update name, bio, avatar, push token. |
| `PUT /auth/change-password` | User | Change password. |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | Public | Two-step OTP password reset. |

### Events

| Route | Access | Description |
|---|---|---|
| `GET /events` | Public | List and search. Query params: `search, category, city, freeOnly, dateFrom, dateTo, lat, lng, distance, sort, page, limit`. `distance` is in meters. |
| `GET /events/:id` | Public | Details (increments view count). |
| `POST /events` | Organizer, Admin | Create (multipart, field `images`). |
| `PUT /events/:id`, `DELETE /events/:id` | Owner, Admin | Update or delete. |
| `GET /events/organizer/mine` | Organizer, Admin | Your own events. |
| `GET /events/:id/attendees` | Owner, Admin | Attendee roster. |
| `POST /events/:id/rate` | User | Rate (1-5) and comment. |
| `POST /events/:id/report` | User | Flag inappropriate content. |

### RSVP, favorites, categories, notifications

| Route | Access | Description |
|---|---|---|
| `POST /rsvp/:eventId`, `DELETE /rsvp/:eventId` | User | RSVP (`going` or `interested`) or cancel. Enforces capacity and rejects past events. |
| `GET /rsvp/mine` | User | Your RSVPs with event details and QR token. |
| `POST /rsvp/checkin` | Organizer, Admin | Validate a QR token and mark the attendee checked in. |
| `GET`, `POST`, `DELETE /favorites` | User | Manage saved events. |
| `GET /categories` | Public | List categories. Admins can create and modify them. |
| `GET`, `PUT`, `DELETE /notifications` | User | Inbox, mark read, delete. |

### Users and admin

| Route | Access | Description |
|---|---|---|
| `GET /users/:id` | Public | Public organizer profile and hosted events. |
| `GET /users` | Admin | List all users. |
| `PUT /users/:id/role`, `PUT /users/:id/status` | Admin | Change role, activate or deactivate. |
| `GET /users/admin/analytics` | Admin | Totals, top categories, reported events. |
| `PUT /users/admin/events/:id/approve` | Admin | Approve, hide, or clear reports. |

Other: `GET /health` returns API status.

---

## Project structure

```
eventify/
├── server/                      # Node.js + Express API
│   ├── server.js                # Entry point (standalone or Vercel serverless)
│   ├── vercel.json
│   ├── .env.example
│   ├── config/                  # db.js (cached connection), cloudinary.js (storage tiers)
│   ├── models/                  # User, Event, Category, Favorite, Rsvp, Notification
│   ├── middleware/              # auth (protect, authorize, optionalAuth), errorHandler, validate
│   ├── controllers/             # auth, event, rsvp, user, favorite, notification, category
│   ├── routes/                  # One router per controller
│   ├── utils/                   # otp, sendEmail, emailCheck, generateToken, seed scripts
│   └── uploads/                 # Local image storage (development fallback)
│
└── frontend/                    # Expo app (Android, iOS, web)
    ├── App.js                   # Provider tree and splash gate
    ├── app.json, eas.json, vercel.json
    └── src/
        ├── constants/           # config.js (API URL, defaults), theme.js (design tokens)
        ├── context/             # AuthContext, EventContext, ThemeContext
        ├── hooks/               # useLocation, usePushNotifications
        ├── navigation/          # Root, Auth, MainTab, HomeStack, ProfileStack
        ├── components/          # LeafletMap(.web), WebShell(.web), EventCard, LocationPickerModal, ...
        ├── services/            # api.js (Axios), auth/event/other services, geocodingService
        ├── utils/               # uploadHelpers.js
        └── screens/             # auth/, home/, event/, profile/, admin/
```

Files ending in `.web.js` are the web-specific versions that Expo picks automatically in the browser.

**Navigation at a glance**

```
RootNavigator
├── AuthNavigator (signed out): Login, Register, VerifyEmail, ForgotPassword
└── MainTabNavigator (signed in)
    ├── Home (stack): Home, EventDetail, EditEvent, Attendees
    ├── Search
    ├── Map
    ├── Create          (organizers and admins only)
    └── Profile (stack): EditProfile, SavedEvents, Notifications, Settings,
                         MyEvents, AdminDashboard, AdminUsers, AdminEvents
```

---

## How it works

```
 Expo app (mobile + web)
        │  HTTPS / JSON
        ▼
 Express API ── Helmet · CORS · rate limits · JWT auth · validation
        │
        ├── MongoDB (2dsphere geo index, text index)
        ├── Cloudinary (images; local disk fallback)
        └── Brevo / Gmail (OTP emails)

 Client-side only: OpenStreetMap tiles, Nominatim geocoding
```

**Sign-up and verification**
1. `register` checks the email for typos (e.g. `gmial.com`), disposable domains and DNS MX records.
2. A 6-digit OTP is generated, stored as an HMAC-SHA256 hash, and emailed.
3. `verify-email` compares it using a timing-safe check. Resends are limited to once per 60 seconds and wrong guesses to 5 attempts.

**Nearby search**
Event locations are stored as GeoJSON `[longitude, latitude]` points. `GET /events?lat=..&lng=..&distance=..` uses `$near` with `$maxDistance` (meters), with paging handled through a `$geoWithin` count.

**RSVP and check-in**
Each RSVP gets a unique 32-character token that the attendee's ticket renders as a QR code. The organizer's check-in call to `POST /rsvp/checkin` marks `checkedIn` and records the time.

**Rate limits:** 300 requests per 15 minutes for the general API, 100 per 15 minutes for auth routes.

---

## Deployment

**Backend on Vercel**
1. Deploy the `server/` folder. `vercel.json` already builds `server.js` with `@vercel/node` and bundles `uploads/samples/`.
2. Add every variable from the [server table](#server-serverenv) in the Vercel dashboard. Cloudinary is required because the filesystem is read-only.
3. Set `CLIENT_URL` to your frontend origin.

**Web build on Vercel**
Deploy `frontend/` after exporting the web build. Its `vercel.json` rewrites all paths to `index.html` for client-side routing.

**Android and iOS with EAS**
```bash
cd frontend
npm install -g eas-cli
eas build --profile preview --platform android     # installable APK for testing
eas build --profile production --platform all      # store builds
```
Set `expo.extra.apiUrl` to your deployed API first.

---

## Troubleshooting

| Problem | Likely fix |
|---|---|
| App cannot reach the API from a phone | Use your computer's LAN IP, not `localhost`. Both devices must share a network. Check your firewall allows port 5000. |
| App talks to the wrong server | Check `expo.extra.apiUrl` in `app.json`. The committed value may be the production URL. |
| No verification email arrives | In development, read the OTP from the server console. In production, check Brevo or Gmail credentials. Gmail needs an App Password, not your normal password. |
| "Email not deliverable" at sign-up | The domain failed the typo, disposable or MX check. Use a real address. |
| Image upload fails on Vercel | Cloudinary variables are missing. |
| Feed is empty after a while | Sample events are in the past. Run `node utils/refreshSampleEvents.js`. |
| Seeded login rejected | Re-run `npm run seed`, and make sure you are connected to the same `MONGO_URI` the server uses. |

---

## Known gaps and next steps

- **Push notifications:** the device token is captured by `usePushNotifications`, but you still need to save it with `authService.updateProfile({ pushToken })` after login and add a server-side job (e.g. cron) that calls the [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/) for reminders and nearby-event alerts.
- **QR scanning:** the check-in endpoint is ready; add a scanner (`expo-camera`) to the organizer screens to read attendee QR codes at the door.
- **Avatar upload:** Edit Profile keeps the local image URI as a placeholder. Send it through the same Multer/Cloudinary endpoint events use.
- **Offline support:** search already paginates; add `react-native-mmkv` or AsyncStorage caching if you need offline use.
- **OSM usage policy:** the public tile and Nominatim servers are fine for development and light use. For heavy production traffic, use a commercial tile provider or self-host.

---

## License

Provided as a starting point and reference implementation. Adapt it freely for your own use.