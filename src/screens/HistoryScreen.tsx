import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { SessionRecord, getSessions, clearAllData } from '../database/locationDB';

interface HistoryScreenProps {
  onBack: () => void;
  onSelectSession: (sessionId: number) => void;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen({ onBack, onSelectSession }: HistoryScreenProps) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const list = await getSessions();
    setSessions(list);
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClearAll = () => {
    Alert.alert('Clear All History', 'Delete all sessions and locations?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await clearAllData();
          load();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
          <Text style={styles.clearText2}>Clear All</Text>
        </TouchableOpacity>
      </View>
      {loaded && sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No tracking sessions yet.{'\n\n'}Press START TRACKING on the map to record one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectSession(item.id)}>
              <View style={styles.cardRow}>
                <Text style={styles.cardDate}>{formatDateTime(item.start_time)}</Text>
                <Text style={styles.cardCount}>{item.point_count} points</Text>
              </View>
              {item.end_time ? (
                <Text style={styles.cardEnd}>Ended {formatDateTime(item.end_time)}</Text>
              ) : (
                <Text style={styles.cardEndInProgress}>In progress</Text>
              )}
              <Text style={styles.cardTap}>Tap to view on map ›</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  clearBtn: {
    minWidth: 84,
    alignItems: 'flex-end',
  },
  clearText2: {
    color: '#ff7675',
    fontSize: 15,
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#1f2d50',
    borderRadius: 14,
    padding: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardCount: {
    color: '#00b894',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardEnd: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 8,
  },
  cardEndInProgress: {
    color: '#fdcb6e',
    fontSize: 13,
    marginTop: 8,
  },
  cardTap: {
    color: '#74b9ff',
    fontSize: 13,
    marginTop: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 26,
  },
});