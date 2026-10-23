import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import BackgroundFetch from 'react-native-background-fetch';
import { insertLocation, getLastLocation, createSession, endSession } from '../database/locationDB';

let watchId: number | null = null;
let backgroundConfigured = false;
let currentSessionId: number | null = null;

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 20,
  interval: 30000,
  fastestInterval: 15000,
  showLocationDialog: true,
  forceRequestLocation: true,
  useLocation: true,
};

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('always');
    return auth === 'granted';
  }
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'This app collects your location to record your movement trail.',
      buttonPositive: 'Allow',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function savePosition(position: any): void {
  const { latitude, longitude, accuracy, speed } = position.coords;
  insertLocation(latitude, longitude, accuracy ?? null, speed ?? null, currentSessionId)
    .then(() => console.log('[LocationService] Saved:', latitude, longitude))
    .catch((error) => console.error('[LocationService] Save failed:', error));
}

export async function configureBackgroundGeolocation(): Promise<void> {
  await BackgroundFetch.configure(
    {
      minimumFetchInterval: 15,
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      forceAlarmManager: true,
    },
    async (taskId) => {
      console.log('[LocationService] Background fetch fired');
      try {
        const position = await new Promise((resolve, reject) => {
          Geolocation.getCurrentPosition(
            resolve,
            reject,
            { enableHighAccuracy: true, timeout: 25000, maximumAge: 60000 },
          );
        });
        savePosition(position);
      } catch (error) {
        console.error('[LocationService] Background fetch location error:', error);
      } finally {
        BackgroundFetch.finish(taskId);
      }
    },
  );
  backgroundConfigured = true;
  console.log('[LocationService] Background geolocation configured');
}

export async function startTracking(): Promise<void> {
  if (!backgroundConfigured) {
    await configureBackgroundGeolocation();
  }
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission denied');
  }
  if (watchId === null) {
    currentSessionId = await createSession();
    watchId = Geolocation.watchPosition(
      (position) => savePosition(position),
      (error) => console.error('[LocationService] watchPosition error:', error.code, error.message),
      WATCH_OPTIONS,
    );
    console.log('[LocationService] Tracking started (watchId:', watchId + ', session:', currentSessionId + ')');
  }
}

export function stopTracking(): void {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (currentSessionId !== null) {
    endSession(currentSessionId).catch((e) =>
      console.error('[LocationService] Failed to end session:', e),
    );
    currentSessionId = null;
  }
  console.log('[LocationService] Tracking stopped');
}

export function isTrackingActive(): boolean {
  return watchId !== null;
}

export function destroyTracking(): void {
  stopTracking();
}
