import { executeDbOperation } from "./helper";
import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import type { DockerHost, HostStats } from "~/typings/docker";
import type { stacks_config } from "~/typings/database";

const db = new Database("dockstatapi.db");
db.exec("PRAGMA journal_mode = WAL;");

export const dbFunctions = {
  init() {
    const startTime = Date.now();
    db.exec(`
      CREATE TABLE IF NOT EXISTS backend_log_entries (
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        message TEXT,
        file TEXT,
        line NUMBER
      );

      CREATE TABLE IF NOT EXISTS stacks_config (
        name TEXT PRIMARY KEY,
        version INTEGER,
        custom BOOLEAN,
        source TEXT,
        container_count INTEGER,
        stack_prefix TEXT,
        automatic_reboot_on_error BOOLEAN,
        image_updates BOOLEAN
      );

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
        keep_data_for NUMBER,
        fetching_interval NUMBER
      );
    `);

    logger.info("Starting server...");

    /*
     * Default values:
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
        INSERT INTO config (keep_data_for, fetching_interval) VALUES (7, 5)
        `
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
        `
      );
      stmt.run("Localhost", "localhost:2375", false);
    }
    logger.debug("__task__ __db__ Initializing Database ⏳");
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Initializing Database ✔️  (${duration}ms)`);
  },

  addDockerHost(hostId: string, url: string, secure: boolean) {
    return executeDbOperation(
      "Add Docker Host",
      () => {
        const stmt = db.prepare(`
          INSERT INTO docker_hosts (name, url, secure)
          VALUES (?, ?, ?)
        `);
        return stmt.run(hostId, url, secure);
      },
      () => {
        if (
          typeof hostId !== "string" ||
          typeof url !== "string" ||
          typeof secure !== "boolean"
        ) {
          logger.error("Invalid parameter types for addDockerHost");
          throw new TypeError("Invalid parameter types for addDockerHost");
        }
      }
    );
  },

  getDockerHosts(): DockerHost[] {
    return executeDbOperation(
      "Get Docker Hosts",
      () => {
        const stmt = db.prepare(`
          SELECT name, url, secure
          FROM docker_hosts
          ORDER BY name DESC
        `);
        const data = stmt.all();
        return data as DockerHost[];
      },
      () => {}
    );
  },

  addLogEntry: (
    level: string,
    message: string,
    file_name: string,
    line: number
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
    return executeDbOperation(
      "Get All Logs",
      () => {
        const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          ORDER BY timestamp DESC
        `);
        const data = stmt.all();
        return data;
      },
      () => {}
    );
  },

  getLogsByLevel(level: string) {
    return executeDbOperation(
      "Get Logs By Level",
      () => {
        const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          WHERE level = ?
          ORDER BY timestamp DESC
        `);
        const data = stmt.all(level);
        return data;
      },
      () => {
        if (typeof level !== "string") {
          logger.error("Level parameter must be a string");
          throw new TypeError("Level parameter must be a string");
        }
      }
    );
  },

  updateDockerHost(name: string, url: string, secure: boolean) {
    return executeDbOperation(
      "Update Docker Host",
      () => {
        const stmt = db.prepare(`
          UPDATE docker_hosts
          SET url = ?, secure = ?
          WHERE name = ?
        `);
        const data = stmt.run(url, secure, name);
        return data;
      },
      () => {
        if (
          typeof name !== "string" ||
          typeof url !== "string" ||
          typeof secure !== "boolean"
        ) {
          logger.error("Invalid parameter types for updateDockerHost");
          throw new TypeError("Invalid parameter types for updateDockerHost");
        }
      }
    );
  },

  deleteDockerHost(name: string) {
    return executeDbOperation(
      "Delete Docker Host",
      () => {
        const stmt = db.prepare(`
          DELETE FROM docker_hosts
          WHERE name = ?
        `);
        const data = stmt.run(name);
        return data;
      },
      () => {
        if (typeof name !== "string") {
          logger.error("Invalid parameter type for deleteDockerHost");
          throw new TypeError("Name parameter must be a string");
        }
      }
    );
  },

  clearAllLogs() {
    return executeDbOperation(
      "Clear All Logs",
      () => {
        const stmt = db.prepare(`
          DELETE FROM backend_log_entries
        `);
        const data = stmt.run();
        return data;
      },
      () => {}
    );
  },

  clearLogsByLevel(level: string) {
    return executeDbOperation(
      "Clear Logs By Level",
      () => {
        const stmt = db.prepare(`
          DELETE FROM backend_log_entries
          WHERE level = ?
        `);
        const data = stmt.run(level);
        return data;
      },
      () => {
        if (typeof level !== "string") {
          logger.error("Invalid parameter type for clearLogsByLevel");
          throw new TypeError("Level parameter must be a string");
        }
      }
    );
  },

  updateConfig(fetching_interval: number, keep_data_for: number) {
    return executeDbOperation(
      "Update Config",
      () => {
        const stmt = db.prepare(`
          UPDATE config
          SET fetching_interval = ?,
              keep_data_for = ?
        `);
        const data = stmt.run(fetching_interval, keep_data_for);
        return data;
      },
      () => {
        if (
          typeof fetching_interval !== "number" ||
          typeof keep_data_for !== "number"
        ) {
          logger.error("Invalid parameter types for updateConfig");
          throw new TypeError("Invalid parameter types for updateConfig");
        }
      }
    );
  },

  getConfig() {
    return executeDbOperation(
      "Get Config",
      () => {
        const stmt = db.prepare(`
          SELECT keep_data_for, fetching_interval
          FROM config
        `);
        const data = stmt.all();
        return data;
      },
      () => {}
    );
  },

  deleteOldData(days: number) {
    return executeDbOperation(
      "Delete Old Data",
      () => {
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
      () => {
        if (typeof days !== "number") {
          logger.error("Invalid parameter type for deleteOldData");
          throw new TypeError("Days parameter must be a number");
        }
      }
    );
  },

  addContainerStats(
    id: string,
    hostId: string,
    name: string,
    image: string,
    status: string,
    state: string,
    cpu_usage: number,
    memory_usage: number
  ) {
    return executeDbOperation(
      "Add Container Stats",
      () => {
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
          memory_usage
        );
        return data;
      },
      () => {
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
          logger.error("Invalid parameter types for addContainerStats");
          throw new TypeError("Invalid parameter types for addContainerStats");
        }
      }
    );
  },

  updateHostStats(stats: HostStats) {
    return executeDbOperation(
      "Update Host Stats",
      () => {
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
          stats.images
        );
        return data;
      },
      () => {}
    );
  },

  addStack(stack_config: stacks_config) {
    return executeDbOperation(
      "Add Stack Config",
      () => {
        const stmt = db.prepare(`
          INSERT INTO stacks_config (
            name,
            version,
            custom,
            source,
            container_count,
            stack_prefix,
            automatic_reboot_on_error,
            image_updates
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const data = stmt.run(
          stack_config.name,
          stack_config.version,
          stack_config.custom,
          stack_config.source,
          stack_config.container_count,
          stack_config.stack_prefix,
          stack_config.automatic_reboot_on_error,
          stack_config.image_updates
        );
        return data;
      },
      () => {}
    );
  },

  getStacks() {
    return executeDbOperation(
      "Get Stacks",
      () => {
        const stmt = db.prepare(`
          SELECT name, version, custom, source, container_count, stack_prefix, automatic_reboot_on_error, image_updates
          FROM stacks_config
          ORDER BY name DESC
        `);
        const data = stmt.all();
        return data;
      },
      () => {}
    );
  },

  deleteStack(name: string) {
    return executeDbOperation(
      "Delete Stack",
      () => {
        const stmt = db.prepare(`
          DELETE FROM stacks_config
          WHERE name = ?;
        `);
        const data = stmt.run(name);
        return data;
      },
      () => {}
    );
  },

  updateStack(stack_config: stacks_config) {
    return executeDbOperation(
      "Update Stack",
      () => {
        const stmt = db.prepare(`
          UPDATE stacks_config
          SET
            version = ?,
            custom = ?,
            source = ?,
            container_count = ?,
            stack_prefix = ?,
            automatic_reboot_on_error = ?,
            image_updates = ?
          WHERE name = ?;
        `);
        const data = stmt.run(
          stack_config.version,
          stack_config.custom,
          stack_config.source,
          stack_config.container_count,
          stack_config.stack_prefix,
          stack_config.automatic_reboot_on_error,
          stack_config.image_updates,
          stack_config.name
        );
        return data;
      },
      () => {}
    );
  },
};
