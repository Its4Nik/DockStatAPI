import sqlite3 from "sqlite3";
import logger from "../utils/logger";

const dbPath: string = "./src/data/database.db";

const db: sqlite3.Database = new sqlite3.Database(dbPath, (error: unknown) => {
  if (error as Error) {
    logger.error("Error opening database:", (error as Error).message);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            info TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      () => {
        logger.info("Database created / checked successfully, table is ready.");
      },
    );
  }
});

export default db;
