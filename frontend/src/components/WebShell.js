// Native (iOS/Android): no wrapper needed. The browser version lives in WebShell.web.js,
// which Metro picks automatically on web.
export default function WebShell({ children }) {
  return children;
}