import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocationProvider } from './src/context/LocationContext';
import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SessionDetailScreen from './src/screens/SessionDetailScreen';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'history' | 'detail'>('home');
  const [sessionId, setSessionId] = useState<number | null>(null);

  return (
    <SafeAreaProvider>
      <LocationProvider>
        {screen === 'home' && (
          <HomeScreen onShowHistory={() => setScreen('history')} />
        )}
        {screen === 'history' && (
          <HistoryScreen
            onBack={() => setScreen('home')}
            onSelectSession={(id) => {
              setSessionId(id);
              setScreen('detail');
            }}
          />
        )}
        {screen === 'detail' && sessionId !== null && (
          <SessionDetailScreen
            sessionId={sessionId}
            onBack={() => setScreen('history')}
          />
        )}
      </LocationProvider>
    </SafeAreaProvider>
  );
}