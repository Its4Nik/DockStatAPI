import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import type { DockerHost } from "~/typings/docker";

const db = new Database("dockstatapi.db");

export const dbFunctions = {
  init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS docker_hosts (
        name TEXT,
        url TEXT,
        secure BOOLEAN
      );

      CREATE TABLE IF NOT EXISTS container_stats (
        id TEXT,
        hostId TEXT,
        name TEXT,
        image TEXT,
        status TEXT,
        state TEXT,
        cpu_usage FLOAT,
        memory_usage FLOAT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS config (
        polling_rate NUMBER,
        keep_data_for NUMBER,
        fetching_interval NUMBER
      );

      CREATE TABLE IF NOT EXISTS backend_log_entries (
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        message TEXT,
        file TEXT,
        line NUMBER
      );
    `);

    /*
     * Default values:
     * - Websocket polling interval 5 seconds
     * - Data retention value for the database (logs and container stats) 7 days
     * - Data fetcher for the Database: 5 minutes
     */
    const configRow = db
      .prepare(`SELECT COUNT(*) AS count FROM config`)
      .get() as { count: number };
    if (configRow.count === 0) {
      const stmt = db.prepare(
        `
        INSERT INTO config (polling_rate, keep_data_for, fetching_interval) VALUES (5, 7, 5)
        `,
      );
      stmt.run();
    }

    const hostRow = db
      .prepare(`SELECT COUNT(*) AS count FROM docker_hosts WHERE name = ?`)
      .get("Localhost") as { count: number };
    if (hostRow.count === 0) {
      const stmt = db.prepare(
        `
        INSERT INTO docker_hosts (name, url, secure) VALUES (?, ?, ?)
        `,
      );
      stmt.run("Localhost", "localhost:2375", false);
    }
  },

  addDockerHost(hostId: string, url: string, secure: boolean) {
    if (
      typeof hostId !== "string" ||
      typeof url !== "string" ||
      typeof secure !== "boolean"
    ) {
      logger.crit("Invalid parameter types for addDockerHost");
      throw new TypeError("Invalid parameter types for addDockerHost");
    }

    const stmt = db.prepare(`
          INSERT INTO docker_hosts (name, url, secure)
          VALUES (?, ?, ?)
        `);
    return stmt.run(hostId, url, secure);
  },

  getDockerHosts(): DockerHost[] {
    const stmt = db.prepare(`
      SELECT name, url, secure
      FROM docker_hosts
      ORDER BY name DESC
    `);
    const data = stmt.all();
    return data as DockerHost[];
  },

  addLogEntry: (
    level: string,
    message: string,
    file_name: string,
    line: number,
  ) => {
    if (
      typeof level !== "string" ||
      typeof message !== "string" ||
      typeof file_name !== "string" ||
      typeof line !== "number"
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
    if (typeof level !== "string") {
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

  updateDockerHost(name: string, url: string, secure: boolean) {
    if (
      typeof name !== "string" ||
      typeof url !== "string" ||
      typeof secure !== "boolean"
    ) {
      logger.crit("Invalid parameter types for updateDockerHost");
      throw new TypeError("Invalid parameter types for updateDockerHost");
    }

    const stmt = db.prepare(`
        UPDATE docker_hosts
        SET url = ?, secure = ?
        WHERE name = ?
      `);
    return stmt.run(url, secure, name);
  },

  deleteDockerHost(name: string) {
    if (typeof name !== "string") {
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
    if (typeof level !== "string") {
      logger.crit("Invalid parameter type for clearLogsByLevel");
      throw new TypeError("Level parameter must be a string");
    }

    const stmt = db.prepare(`
        DELETE FROM backend_log_entries
        WHERE level = ?
      `);
    return stmt.run(level);
  },

  updateConfig(
    polling_rate: number,
    fetching_interval: number,
    keep_data_for: number,
  ) {
    if (
      typeof polling_rate !== "number" ||
      typeof fetching_interval !== "number" ||
      typeof keep_data_for !== "number"
    ) {
      logger.crit("Invalid parameter types for updateConfig");
      throw new TypeError("Invalid parameter types for updateConfig");
    }

    const stmt = db.prepare(`
      UPDATE config
      SET polling_rate = ?,
          fetching_interval = ?,
          keep_data_for = ?
    `);

    return stmt.run(polling_rate, fetching_interval, keep_data_for);
  },

  getConfig() {
    const stmt = db.prepare(`
        SELECT polling_rate, keep_data_for, fetching_interval
        FROM config
      `);

    return stmt.all();
  },

  // Stats:
  addContainerStats(
    id: string,
    hostId: string,
    name: string,
    image: string,
    status: string,
    state: string,
    cpu_usage: number,
    memory_usage: number,
  ) {
    if (
      typeof id !== "string" ||
      typeof hostId !== "string" ||
      typeof name !== "string" ||
      typeof image !== "string" ||
      typeof status !== "string" ||
      typeof state !== "string" ||
      typeof cpu_usage !== "number" ||
      typeof memory_usage !== "number"
    ) {
      logger.crit("Invalid parameter types for addContainerStats");
      throw new TypeError("Invalid parameter types for addContainerStats");
    }

    const stmt = db.prepare(`
      INSERT INTO container_stats (id, hostId, name, image, status, state, cpu_usage, memory_usage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      id,
      hostId,
      name,
      image,
      status,
      state,
      cpu_usage,
      memory_usage,
    );
  },

  deleteOldData(days: number) {
    if (typeof days !== "number") {
      logger.crit("Invalid parameter type for deleteOldData");
      throw new TypeError("Days parameter must be a number");
    }

    const deleteContainerStmt = db.prepare(`
      DELETE FROM container_stats
      WHERE timestamp < datetime('now', '-' || ? || ' days')
    `);
    deleteContainerStmt.run(days);

    const deleteLogsStmt = db.prepare(`
      DELETE FROM backend_log_entries
      WHERE timestamp < datetime('now', '-' || ? || ' days')
    `);
    deleteLogsStmt.run(days);
  },
};

dbFunctions.init();
