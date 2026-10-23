import { open, DB } from '@op-engineering/op-sqlite';

let db: DB | null = null;

async function getDatabase(): Promise<DB> {
  if (db) return db;
  db = await open({ name: 'locationtracker.sqlite' });
  await db.execute(
    'CREATE TABLE IF NOT EXISTS locations (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'latitude REAL NOT NULL, ' +
      'longitude REAL NOT NULL, ' +
      'accuracy REAL, ' +
      'speed REAL, ' +
      'session_id INTEGER, ' +
      'timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)',
  );
  await db.execute(
    'CREATE TABLE IF NOT EXISTS sessions (' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'start_time DATETIME DEFAULT CURRENT_TIMESTAMP, ' +
      'end_time DATETIME, ' +
      'point_count INTEGER DEFAULT 0)',
  );
  const info = db.executeSync('PRAGMA table_info(locations)');
  const hasSessionCol = (info.rows as Array<{ name: string }>).some(
    (col) => col.name === 'session_id',
  );
  if (!hasSessionCol) {
    await db.execute('ALTER TABLE locations ADD COLUMN session_id INTEGER');
  }
  return db;
}

export interface SessionRecord {
  id: number;
  start_time: string;
  end_time: string | null;
  point_count: number;
}

export interface LocationRecord {
  id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  session_id: number | null;
  timestamp: string;
}

export async function insertLocation(
  latitude: number,
  longitude: number,
  accuracy: number | null,
  speed: number | null,
  sessionId: number | null,
): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    'INSERT INTO locations (latitude, longitude, accuracy, speed, session_id) VALUES (?, ?, ?, ?, ?)',
    [latitude, longitude, accuracy ?? null, speed ?? null, sessionId],
  );
  return result.insertId ?? 0;
}

export async function getAllLocations(): Promise<LocationRecord[]> {
  const database = await getDatabase();
  const result = await database.execute('SELECT * FROM locations ORDER BY timestamp ASC');
  return result.rows as unknown as LocationRecord[];
}

export async function getLocationsBySession(sessionId: number): Promise<LocationRecord[]> {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM locations WHERE session_id = ? ORDER BY timestamp ASC',
    [sessionId],
  );
  return result.rows as unknown as LocationRecord[];
}

export async function clearLocations(): Promise<void> {
  const database = await getDatabase();
  await database.execute('DELETE FROM locations');
}

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execute('DELETE FROM locations');
  await database.execute('DELETE FROM sessions');
}

export async function getLastLocation(): Promise<LocationRecord | null> {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT * FROM locations ORDER BY id DESC LIMIT 1',
  );
  if (result.rows.length === 0) return null;
  return result.rows[0] as unknown as LocationRecord;
}

export async function createSession(): Promise<number> {
  const database = await getDatabase();
  const result = await database.execute(
    'INSERT INTO sessions (start_time) VALUES (CURRENT_TIMESTAMP)',
  );
  return result.insertId ?? 0;
}

export async function endSession(sessionId: number): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    'UPDATE sessions SET end_time = CURRENT_TIMESTAMP, ' +
      'point_count = (SELECT COUNT(*) FROM locations WHERE session_id = ?) ' +
      'WHERE id = ?',
    [sessionId, sessionId],
  );
}

export async function getSessions(): Promise<SessionRecord[]> {
  const database = await getDatabase();
  const result = await database.execute(
    'SELECT s.*, ' +
      '(SELECT COUNT(*) FROM locations WHERE session_id = s.id) as point_count ' +
      'FROM sessions s ORDER BY s.start_time DESC',
  );
  return result.rows as unknown as SessionRecord[];
}
