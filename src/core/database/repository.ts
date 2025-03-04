import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import type { DockerHost } from "~/typings/docker";
import type { HostStats } from "~/typings/docker";

const db = new Database("dockstatapi.db");

export const dbFunctions = {
  init() {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Initializing Database ⏳")
    db.exec(`
      CREATE TABLE IF NOT EXISTS docker_hosts (
        name TEXT,
        url TEXT,
        secure BOOLEAN
      );

      CREATE TABLE IF NOT EXISTS host_stats (
          hostId TEXT PRIMARY KEY,
          dockerVersion TEXT,
          apiVersion TEXT,
          os TEXT,
          architecture TEXT,
          totalMemory INTEGER,
          totalCPU INTEGER,
          labels TEXT,
          containers INTEGER,
          containersRunning INTEGER,
          containersStopped INTEGER,
          containersPaused INTEGER,
          images INTEGER
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
      logger.debug("Initializing default config");
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
      logger.debug("Initializing default docker host (Localhost)");
      const stmt = db.prepare(
        `
        INSERT INTO docker_hosts (name, url, secure) VALUES (?, ?, ?)
        `,
      );
      stmt.run("Localhost", "localhost:2375", false);
    }
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Initializing Database ✔️  (${duration}ms)`);
  },

  addDockerHost(hostId: string, url: string, secure: boolean) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Adding Docker Host ⏳")
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
    const data = stmt.run(hostId, url, secure);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Adding Docker Host ✔️  (${duration}ms)`);
    return data
  },

  getDockerHosts(): DockerHost[] {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Getting Docker Host ⏳")
    const stmt = db.prepare(`
      SELECT name, url, secure
      FROM docker_hosts
      ORDER BY name DESC
    `);
    const data = stmt.all();
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Getting Docker Host ✔️  (${duration}ms)`);
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
    const startTime = Date.now();
    logger.debug("__task__ __db__ Getting all Logs ⏳")
    const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          ORDER BY timestamp DESC
        `);
    const data = stmt.all();
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Getting all Logs ✔️  (${duration}ms)`);
    return data
  },

  getLogsByLevel(level: string) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Getting level-logs ⏳")
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
    const data = stmt.all(level);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Getting level-logs ✔️  (${duration}ms)`);
    return data
  },

  updateDockerHost(name: string, url: string, secure: boolean) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Updating Docker Host ⏳")
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
    const data = stmt.run(url, secure, name);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Updating Docker Host ✔️  (${duration}ms)`);
    return data
  },

  deleteDockerHost(name: string) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Deleting Docker Host ⏳")
    if (typeof name !== "string") {
      logger.crit("Invalid parameter type for deleteDockerHost");
      throw new TypeError("Name parameter must be a string");
    }

    const stmt = db.prepare(`
        DELETE FROM docker_hosts
        WHERE name = ?
      `);
    const data = stmt.run(name);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Deleting Docker Host ✔️  (${duration}ms)`);
    return data
  },

  clearAllLogs() {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Clearing all Logs ⏳")
    const stmt = db.prepare(`
        DELETE FROM backend_log_entries
      `);
    const data = stmt.run();
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Clearing all Logs ✔️  (${duration}ms)`);
    return data
  },

  clearLogsByLevel(level: string) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Clearing all logs by level ⏳")
    if (typeof level !== "string") {
      logger.crit("Invalid parameter type for clearLogsByLevel");
      throw new TypeError("Level parameter must be a string");
    }

    const stmt = db.prepare(`
        DELETE FROM backend_log_entries
        WHERE level = ?
      `);
    const data = stmt.run(level);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Clearing all logs by level ✔️  (${duration}ms)`);
    return data
  },

  updateConfig(
    polling_rate: number,
    fetching_interval: number,
    keep_data_for: number,
  ) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Updating config ⏳")
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

    const data = stmt.run(polling_rate, fetching_interval, keep_data_for);
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Updating config ✔️  (${duration}ms)`);
    return data
  },

  getConfig() {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Getting config ⏳")
    const stmt = db.prepare(`
        SELECT polling_rate, keep_data_for, fetching_interval
        FROM config
      `);

    const data = stmt.all();
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Getting config ✔️  (${duration}ms)`);
    return data
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
    const startTime = Date.now();
    logger.debug("__task__ __db__ Adding container statistics ⏳")
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
    const data = stmt.run(
      id,
      hostId,
      name,
      image,
      status,
      state,
      cpu_usage,
      memory_usage,
    );
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Adding container statistics ✔️  (${duration}ms)`);
    return data
  },

  deleteOldData(days: number) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Deleting old data ⏳")
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
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Deleting old data ✔️  (${duration}ms)`);
  },

  updateHostStats(stats: HostStats) {
    const startTime = Date.now();
    logger.debug("__task__ __db__ Update Host Stats ⏳")
    const labelsJson = JSON.stringify(stats.labels);
    const stmt = db.prepare(`
      INSERT INTO host_stats (
        hostId,
        dockerVersion,
        apiVersion,
        os,
        architecture,
        totalMemory,
        totalCPU,
        labels,
        containers,
        containersRunning,
        containersStopped,
        containersPaused,
        images
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(hostId) DO UPDATE SET
        dockerVersion = excluded.dockerVersion,
        apiVersion = excluded.apiVersion,
        os = excluded.os,
        architecture = excluded.architecture,
        totalMemory = excluded.totalMemory,
        totalCPU = excluded.totalCPU,
        labels = excluded.labels,
        containers = excluded.containers,
        containersRunning = excluded.containersRunning,
        containersStopped = excluded.containersStopped,
        containersPaused = excluded.containersPaused,
        images = excluded.images;
    `);
    const data = stmt.run(
      stats.hostId,
      stats.dockerVersion,
      stats.apiVersion,
      stats.os,
      stats.architecture,
      stats.totalMemory,
      stats.totalCPU,
      labelsJson,
      stats.containers,
      stats.containersRunning,
      stats.containersStopped,
      stats.containersPaused,
      stats.images,
    );
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Update Host stats ✔️  (${duration}ms)`);
    return data
  },
};
