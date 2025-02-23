import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import { typeCheck } from "~/core/utils/type-check";

const db = new Database("dockstatapi.db");

export const dbFunctions = {
  init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS docker_hosts (
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

  addDockerHost(hostId: string, url: string, pollInterval: number) {
    if (
      !typeCheck(hostId, "string") ||
      !typeCheck(url, "string") ||
      !typeCheck(pollInterval, "number")
    ) {
      logger.crit("Invalid parameter types for addDockerHost");
      throw new TypeError("Invalid parameter types for addDockerHost");
    }

    const stmt = db.prepare(`
          INSERT INTO docker_hosts (name, url, poll_interval)
          VALUES (?, ?, ?)
        `);
    return stmt.run(hostId, url, pollInterval);
  },

  getDockerHosts() {
    const stmt = db.prepare(`
      SELECT name, url, poll_interval
      FROM docker_hosts
      ORDER BY name DESC
    `);
    return stmt.all();
  },

  insertMetric(hostId: string, metric: any) {
    if (!typeCheck(hostId, "string") || !typeCheck(metric, "object")) {
      logger.crit("Invalid parameter types for insertMetric");
      throw new TypeError("Invalid parameter types for insertMetric");
    }

    if (
      !typeCheck(metric.containerId, "string") ||
      !typeCheck(metric.cpu, "number") ||
      !typeCheck(metric.memory, "number")
    ) {
      logger.crit("Invalid metric object structure");
      throw new TypeError("Invalid metric object structure");
    }

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
    if (
      !typeCheck(level, "string") ||
      !typeCheck(message, "string") ||
      !typeCheck(file_name, "string") ||
      !typeCheck(line, "number")
    ) {
      logger.crit("Invalid parameter types for addLogEntry");
      throw new TypeError("Invalid parameter types for addLogEntry");
    }

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
    if (!typeCheck(level, "string")) {
      logger.crit("Level parameter must be a string");
      throw new TypeError("Level parameter must be a string");
    }

    const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          WHERE level = ?
          ORDER BY timestamp DESC
        `);
    return stmt.all(level);
  },

  updateDockerHost(name: string, url: string, pollInterval: number) {
    if (
      !typeCheck(name, "string") ||
      !typeCheck(url, "string") ||
      !typeCheck(pollInterval, "number")
    ) {
      logger.crit("Invalid parameter types for updateDockerHost");
      throw new TypeError("Invalid parameter types for updateDockerHost");
    }

    const stmt = db.prepare(`
        UPDATE docker_hosts
        SET url = ?, poll_interval = ?
        WHERE name = ?
      `);
    return stmt.run(url, pollInterval, name);
  },

  deleteDockerHost(name: string) {
    if (!typeCheck(name, "string")) {
      logger.crit("Invalid parameter type for deleteDockerHost");
      throw new TypeError("Name parameter must be a string");
    }

    const stmt = db.prepare(`
        DELETE FROM docker_hosts
        WHERE name = ?
      `);
    return stmt.run(name);
  },

  clearAllLogs() {
    const stmt = db.prepare(`
        DELETE FROM backend_log_entries
      `);
    return stmt.run();
  },

  clearLogsByLevel(level: string) {
    if (!typeCheck(level, "string")) {
      logger.crit("Invalid parameter type for clearLogsByLevel");
      throw new TypeError("Level parameter must be a string");
    }

    const stmt = db.prepare(`
        DELETE FROM backend_log_entries
        WHERE level = ?
      `);
    return stmt.run(level);
  },
};

dbFunctions.init();
