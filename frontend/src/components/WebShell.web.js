import React, { useEffect } from 'react';
import { Image, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Browser-only layout. The app is designed phone-first, so on a wide desktop screen it used to
 * stretch edge to edge (huge cards, squashed images, wrong proportions). This shell:
 *  - phones/small windows: app fills the screen, as before
 *  - tablets/desktops: app sits in a phone-proportioned card, centred on a branded backdrop
 *  - large desktops: adds a brand panel beside the card
 */

const CARD_BREAKPOINT = 720;
const BRAND_BREAKPOINT = 1080;
const CARD_WIDTH = 430;
const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const FEATURES = [
  ['📍', 'Find events on the map near you'],
  ['🎟️', 'RSVP in one tap and get your QR ticket'],
  ['❤️', 'Save favourites so you never miss out'],
  ['🎤', 'Host your own events as an organizer'],
];

const h = React.createElement;

export default function WebShell({ children }) {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const c = theme.colors;
  const isDark = theme.mode === 'dark';
  const logoSource = require('../assets/icon.png');

  // Page-level styles: background behind everything, font, slim scrollbars
  useEffect(() => {
    document.title = 'Eventify';
    const style = document.createElement('style');
    style.setAttribute('data-eventify', 'web-shell');
    style.textContent = `
      html, body { margin: 0; height: 100%; overscroll-behavior: none; }
      body { background: ${isDark ? '#0B0C12' : '#EEF0FA'}; font-family: ${FONT}; -webkit-font-smoothing: antialiased; }
      * { scrollbar-width: thin; scrollbar-color: rgba(128,128,150,.45) transparent; }
      *::-webkit-scrollbar { width: 6px; height: 6px; }
      *::-webkit-scrollbar-thumb { background: rgba(128,128,150,.45); border-radius: 6px; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isDark]);

  // Small screens (phone browsers, narrow windows): full screen, no frame
  if (width < CARD_BREAKPOINT) {
    return h(
      'div',
      {
        style: {
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.background,
        },
      },
      children
    );
  }

  const showBrand = width >= BRAND_BREAKPOINT;
  const cardHeight = Math.max(560, Math.min(height - 40, 900));

  const backdrop = isDark
    ? 'radial-gradient(1100px 600px at 12% 8%, rgba(108,99,255,0.38), transparent 60%), radial-gradient(900px 520px at 92% 92%, rgba(255,107,107,0.22), transparent 55%), #0B0C12'
    : 'radial-gradient(1100px 600px at 12% 8%, rgba(108,99,255,0.24), transparent 60%), radial-gradient(900px 520px at 92% 92%, rgba(255,107,107,0.18), transparent 55%), #EEF0FA';

  const brandPanel = h(
    'div',
    { style: { maxWidth: 440, color: c.text } },
    h(
      'div',
      { style: { width: 72, height: 72, borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 30px rgba(108,99,255,0.45)' } },
      h(Image, { source: logoSource, style: { width: 72, height: 72 }, resizeMode: 'cover' })
    ),
    h('div', { style: { fontSize: 46, fontWeight: 800, letterSpacing: -1, marginTop: 20, lineHeight: 1.05 } }, 'Eventify'),
    h('div', { style: { fontSize: 19, marginTop: 10, color: c.textSecondary, lineHeight: 1.45 } }, "Discover what's happening near you."),
    h(
      'div',
      { style: { marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 } },
      FEATURES.map(([icon, text]) =>
        h(
          'div',
          { key: text, style: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 } },
          h('span', { style: { width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(139,132,255,0.16)' : 'rgba(108,99,255,0.12)' } }, icon),
          h('span', null, text)
        )
      )
    )
  );

  const card = h(
    'div',
    {
      style: {
        width: CARD_WIDTH, height: cardHeight, flexShrink: 0, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', background: c.background, borderRadius: 28,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(26,27,37,0.08)'}`,
        boxShadow: isDark
          ? '0 30px 80px rgba(0,0,0,0.55), 0 0 0 6px rgba(255,255,255,0.03)'
          : '0 30px 70px rgba(60,50,140,0.22), 0 0 0 6px rgba(255,255,255,0.55)',
      },
    },
    children
  );

  return h(
    'div',
    {
      style: {
        width: '100%', height: '100vh', boxSizing: 'border-box', padding: 20, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 72,
        background: backdrop, fontFamily: FONT,
      },
    },
    showBrand ? brandPanel : null,
    card
  );
}