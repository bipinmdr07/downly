import { Download } from '@/pages/api/downloads';
import path from 'path';
import sqlite3 from 'sqlite3'

const isDocker = process.env.IS_DOCKER === 'true';
const dbLocation = isDocker ? '/data/db' : (process.env.DB_LOCATION || '')
const DB_PATH = path.join(dbLocation, './downloads.db')
const db = new sqlite3.Database(DB_PATH)
type paramTypes = string | number | undefined


// Initialize database
export async function initDB() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      status TEXT NOT NULL,
      progress REAL DEFAULT 0,
      size INTEGER,
      download_path TEXT NOT NULL,
      speed REAL,
      eta INTEGER,
      downloaded TEXT,
      total TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export const dbRun = (query: string, params: paramTypes[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID, changes, etc.
    });
  });
};

export const dbGet = (query: string, params: paramTypes[] = []): Promise<Download> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err: Error | null, row: Download) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query: string, params: paramTypes[] = []): Promise<Download[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err: Error | null, rows: Download[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
