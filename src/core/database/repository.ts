import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import { typeCheck } from "~/core/utils/type-check";
import { config } from "~/typings/database";
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

      CREATE TABLE IF NOT EXISTS config (
        polling_rate NUMBER
      );

      CREATE TABLE IF NOT EXISTS backend_log_entries (
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        message TEXT,
        file TEXT,
        line NUMBER
      );
    `);

    const configRow = db
      .prepare(`SELECT COUNT(*) AS count FROM config`)
      .get() as { count: number };
    if (configRow.count === 0) {
      const stmt = db.prepare(
        `
        INSERT INTO config (polling_rate) VALUES (5)
        `,
      );

      stmt.run();
    }
  },

  addDockerHost(hostId: string, url: string, secure: boolean) {
    if (
      !typeCheck(hostId, "string") ||
      !typeCheck(url, "string") ||
      !typeCheck(secure, "boolean")
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

  updateDockerHost(name: string, url: string, secure: boolean) {
    if (
      !typeCheck(name, "string") ||
      !typeCheck(url, "string") ||
      !typeCheck(secure, "boolean")
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

  updateConfig(polling_rate: number) {
    if (!typeCheck(polling_rate, "number")) {
      logger.crit("Invalid parameter type for updateConfig");
      throw new TypeError("Polling rate must be a number!");
    }

    const stmt = db.prepare(`
        UPDATE config
        SET polling_rate = ?
      `);

    return stmt.run(polling_rate);
  },

  getConfig() {
    const stmt = db.prepare(`
        SELECT distinct(polling_rate)
        FROM config
      `);

    return stmt.all();
  },
};

dbFunctions.init();
