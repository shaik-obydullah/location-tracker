import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';
import { useLocation } from '../context/LocationContext';
import {
  configureBackgroundGeolocation,
  startTracking,
  stopTracking,
  destroyTracking,
} from '../services/locationService';
import { clearAllData } from '../database/locationDB';
import MapComponent from '../components/MapComponent';

interface HomeScreenProps {
  onShowHistory: () => void;
}

export default function HomeScreen({ onShowHistory }: HomeScreenProps) {
  const {
    isTrackingActive,
    setIsTrackingActive,
    locationCount,
    refreshLocations,
  } = useLocation();

  useEffect(() => {
    configureBackgroundGeolocation();
    return () => {
      destroyTracking();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isTrackingActive) {
        refreshLocations();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isTrackingActive, refreshLocations]);

  const handleToggleTracking = async () => {
    try {
      if (isTrackingActive) {
        await stopTracking();
        setIsTrackingActive(false);
      } else {
        await startTracking();
        setIsTrackingActive(true);
        await refreshLocations();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle tracking');
    }
  };

  const handleClearData = async () => {
    Alert.alert('Clear Data', 'Delete all saved locations and history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await clearAllData();
          await refreshLocations();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MapComponent />
      <View style={styles.controlPanel}>
        <View style={styles.header}>
          <Text style={styles.title}>Location Tracker</Text>
          <Text style={styles.subtitle}>{locationCount} locations saved</Text>
        </View>
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, isTrackingActive ? styles.stopButton : styles.startButton]}
            onPress={handleToggleTracking}>
            <Text style={styles.buttonText}>
              {isTrackingActive ? 'STOP TRACKING' : 'START TRACKING'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearData}>
            <Text style={styles.buttonText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.historyLink} onPress={onShowHistory}>
          <Text style={styles.historyLinkText}>View History ›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26,26,46,0.95)',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 14,
  },
  button: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#00b894',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#636e72',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  historyLink: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  historyLinkText: {
    color: '#74b9ff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
