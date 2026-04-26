import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import type { ChatMessage } from '../preload';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'crisis.db');
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, fromId TEXT, toId TEXT,
      content TEXT, type TEXT, encrypted INTEGER,
      timestamp INTEGER, delivered INTEGER
    ); CREATE INDEX IF NOT EXISTS idx_peer ON messages(fromId,toId);`);
  }

  saveMessage(m: ChatMessage) {
    this.db.prepare('INSERT OR REPLACE INTO messages VALUES (?,?,?,?,?,?,?,?)')
      .run(m.id, m.fromId, m.toId, m.content, m.type, m.encrypted?1:0, m.timestamp, m.delivered?1:0);
  }

  getHistory(peerId: string, myId: string): ChatMessage[] {
    const r = this.db.prepare(
      'SELECT * FROM messages WHERE (fromId=? AND toId=?) OR (fromId=? AND toId=?) ORDER BY timestamp'
    ).all(myId, peerId, peerId, myId) as any[];
    return r.map(x => ({...x, encrypted: !!x.encrypted, delivered: !!x.delivered}));
  }

  close() { this.db.close(); }
}
