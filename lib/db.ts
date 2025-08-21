import sqlite3 from 'sqlite3'

const DB_PATH = './downloads.db'
const db = new sqlite3.Database(DB_PATH)

export const dbRun = (query: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID, changes, etc.
    });
  });
};

export const dbGet = (query: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
