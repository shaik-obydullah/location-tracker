import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { LocationRecord, getLocationsBySession } from '../database/locationDB';

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
  var overlay = L.layerGroup().addTo(map);
  var startMarker = L.marker([0, 0], { title: 'Start' }).addTo(map);
  var endMarker = L.marker([0, 0], { title: 'End' }).addTo(map);

  window.__showTrack = function (coords) {
    overlay.clearLayers();
    if (!coords || coords.length === 0) return;
    if (coords.length === 1) {
      map.setView(coords[0], 16);
      return;
    }
    startMarker.setLatLng(coords[0]);
    endMarker.setLatLng(coords[coords.length - 1]);
    L.circleMarker(coords[0], { radius: 7, color: '#00b894', fillColor: '#00b894', fillOpacity: 1 }).addTo(overlay);
    L.circleMarker(coords[coords.length - 1], { radius: 7, color: '#e74c3c', fillColor: '#e74c3c', fillOpacity: 1 }).addTo(overlay);
    L.polyline(coords, { color: '#0000ff', weight: 4 }).addTo(overlay);
    map.fitBounds(L.latLngBounds(coords).pad(0.15));
  };
  window.__moveTo = function (i) {
    map.setView(this.__coords[i], 17);
  };
</script>
</body>
</html>`;

interface SessionDetailScreenProps {
  sessionId: number;
  onBack: () => void;
}

export default function SessionDetailScreen({ sessionId, onBack }: SessionDetailScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    getLocationsBySession(sessionId).then(setLocations);
  }, [sessionId]);

  useEffect(() => {
    if (!readyRef.current || !webViewRef.current) return;
    const coords = locations.map((loc) => [loc.latitude, loc.longitude]);
    webViewRef.current.injectJavaScript(
      `window.__showTrack(${JSON.stringify(coords)}); true;`,
    );
  }, [locations, ready]);

  const coords = locations.map((loc) => [loc.latitude, loc.longitude]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track #{sessionId}</Text>
        <Text style={styles.pointCount}>{locations.length}</Text>
      </View>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: MAP_HTML }}
        onLoadEnd={() => {
          readyRef.current = true;
          setReady(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={styles.map}
      />
      <View style={styles.info}>
        <Text style={styles.infoText}>
          <Text style={styles.green}>●</Text> Start  <Text style={styles.red}>●</Text> End  |  {locations.length} points captured
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  backBtn: {
    minWidth: 84,
  },
  backText: {
    color: '#00b894',
    fontSize: 17,
    fontWeight: 'bold',
  },
  pointCount: {
    minWidth: 84,
    textAlign: 'right',
    color: '#aaa',
    fontSize: 15,
  },
  map: {
    flex: 1,
    backgroundColor: '#e8e8e8',
  },
  info: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  green: {
    color: '#00b894',
  },
  red: {
    color: '#e74c3c',
  },
});