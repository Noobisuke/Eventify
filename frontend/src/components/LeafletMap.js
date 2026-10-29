import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Renders an OpenStreetMap (via Leaflet.js) inside a WebView, since
 * react-native-maps only ships Google/Apple map providers out of the box.
 * This keeps the app fully OSM-based with no Google Maps API key needed.
 *
 * Props:
 *  - center: { latitude, longitude }
 *  - markers: [{ id, latitude, longitude, title, category }]
 *  - onMarkerPress: (id) => void
 *  - zoom: number
 *  - pickable: if true, tapping the map drops/moves a single draggable pin
 *              and calls onLocationPick({ latitude, longitude })
 *  - pickedLocation: { latitude, longitude } - controlled pin position when pickable
 */
export default function LeafletMap({
  center,
  markers = [],
  onMarkerPress,
  zoom = 13,
  pickable = false,
  pickedLocation = null,
  onLocationPick,
}) {
  const webviewRef = useRef(null);

  const html = useMemo(() => {
    const markersJs = markers
      .map(
        (m) => `
        L.marker([${m.latitude}, ${m.longitude}])
          .addTo(map)
          .bindPopup(${JSON.stringify(m.title || 'Event')})
          .on('click', function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_press', id: ${JSON.stringify(m.id)} }));
          });`
      )
      .join('\n');

    const pickedLat = pickedLocation ? pickedLocation.latitude : center.latitude;
    const pickedLng = pickedLocation ? pickedLocation.longitude : center.longitude;

    const pickableJs = pickable
      ? `
        var pickIcon = L.divIcon({
          className: '',
          html: '<div style="width:28px;height:28px;margin-left:-14px;margin-top:-28px;">'
            + '<svg viewBox="0 0 24 24" width="28" height="28"><path fill="#EF476F" d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"/><circle cx="12" cy="8" r="3" fill="white"/></svg>'
            + '</div>',
          iconSize: [28, 28],
        });
        var pinMarker = L.marker([${pickedLat}, ${pickedLng}], { icon: pickIcon, draggable: true }).addTo(map);

        function reportPin(latlng) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location_pick', latitude: latlng.lat, longitude: latlng.lng }));
        }
        pinMarker.on('dragend', function(e) { reportPin(e.target.getLatLng()); });
        map.on('click', function(e) {
          pinMarker.setLatLng(e.latlng);
          reportPin(e.latlng);
        });
      `
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <script>
          var map = L.map('map', { zoomControl: true }).setView([${center.latitude}, ${center.longitude}], ${zoom});
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          ${
            !pickable
              ? `
          // Current location marker (view-only maps)
          var currentIcon = L.divIcon({
            className: '',
            html: '<div style="width:16px;height:16px;background:#6C63FF;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
          });
          L.marker([${center.latitude}, ${center.longitude}], { icon: currentIcon }).addTo(map);
          `
              : ''
          }

          ${markersJs}
          ${pickableJs}
        </script>
      </body>
      </html>
    `;
  }, [center, markers, zoom, pickable]);

const lastSentPin = useRef(pickedLocation);

React.useEffect(() => {
  if (!pickable || !pickedLocation || !webviewRef.current) return;
  const prev = lastSentPin.current;
  if (prev && prev.latitude === pickedLocation.latitude && prev.longitude === pickedLocation.longitude) {
    return;
  }
  lastSentPin.current = pickedLocation;

  const js = `
    (function() {
      if (typeof pinMarker !== 'undefined') {
        pinMarker.setLatLng([${pickedLocation.latitude}, ${pickedLocation.longitude}]);
        map.panTo([${pickedLocation.latitude}, ${pickedLocation.longitude}]);
      }
      true;
    })();
  `;
  webviewRef.current.injectJavaScript(js);
}, [pickedLocation, pickable]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'marker_press' && onMarkerPress) {
        onMarkerPress(data.id);
      }
      if (data.type === 'location_pick' && onLocationPick) {
        onLocationPick({ latitude: data.latitude, longitude: data.longitude });
      }
    } catch (e) {
      // Ignore malformed messages
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
