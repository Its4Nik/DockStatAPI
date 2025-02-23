import Database from "bun:sqlite";

const db = new Database("dockstatapi.db");

export const dbFunctions = {
  init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS docker_hosts (
        id TEXT PRIMARY KEY,
        name TEXT,
        url TEXT,
        poll_interval INTEGER
      );

      CREATE TABLE IF NOT EXISTS container_metrics (
        host_id TEXT,
        container_id TEXT,
        cpu REAL,
        memory REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS backend_log_entries (
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        message TEXT,
        file TEXT,
        line NUMBER
      );
    `);
  },

  insertMetric(hostId: string, metric: any) {
    const stmt = db.prepare(`
      INSERT INTO container_metrics (host_id, container_id, cpu, memory)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(hostId, metric.containerId, metric.cpu, metric.memory);
  },

  addLogEntry: (
    level: string,
    message: string,
    file_name: string,
    line: number,
  ) => {
    const stmt = db.prepare(`
      INSERT INTO backend_log_entries (level, message, file, line)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(level, message, file_name, line);
  },

  getAllLogs() {
    const stmt = db.prepare(`
        SELECT timestamp, level, message, file, line
        FROM backend_log_entries
        ORDER BY timestamp DESC
      `);
    return stmt.all();
  },

  getLogsByLevel(level: string) {
    const stmt = db.prepare(`
        SELECT timestamp, level, message, file, line
        FROM backend_log_entries
        WHERE level = ?
        ORDER BY timestamp DESC
      `);
    return stmt.all(level);
  },
};

dbFunctions.init();
