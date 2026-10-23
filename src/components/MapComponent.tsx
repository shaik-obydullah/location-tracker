import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocation } from '../context/LocationContext';

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  var trailOverlay = L.layerGroup().addTo(map);
  var currentMarker = L.marker([20.5937, 78.9629], { title: 'Current position' }).addTo(map);

  window.__setTrail = function (coords) {
    trailOverlay.clearLayers();
    if (!coords || coords.length === 0) return;
    if (coords.length === 1) {
      currentMarker.setLatLng(coords[0]);
      map.setView(coords[0], 16);
    } else {
      currentMarker.setLatLng(coords[coords.length - 1]);
      L.polyline(coords, { color: '#0000ff', weight: 4 }).addTo(trailOverlay);
      map.fitBounds(L.latLngBounds(coords).pad(0.15));
    }
  };
</script>
</body>
</html>`;

export default function MapComponent() {
  const { lastLocations, isTrackingActive } = useLocation();
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!readyRef.current || !webViewRef.current) return;
    const coords = lastLocations.map((loc) => [loc.latitude, loc.longitude]);
    webViewRef.current.injectJavaScript(
      `window.__setTrail(${JSON.stringify(coords)}); true;`,
    );
  }, [lastLocations, mapReady]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML }}
        onLoadEnd={() => {
          readyRef.current = true;
          setMapReady(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={styles.map}
      />
      <View style={styles.trailInfo}>
        <Text style={styles.trailText}>
          {isTrackingActive ? 'Tracking Active' : 'Tracking Paused'} |{' '}
          {lastLocations.length} points
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  trailInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  trailText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});