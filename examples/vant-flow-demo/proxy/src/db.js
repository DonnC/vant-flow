import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function initDb(dbPath, logger) {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS forms (
            id TEXT PRIMARY KEY,
            schema TEXT,
            lastModified TEXT
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            formId TEXT,
            formName TEXT,
            timestamp TEXT,
            data TEXT,
            metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            formId TEXT,
            role TEXT,
            content TEXT,
            timestamp TEXT
        );
    `);

    logger.info(`SQLite Database initialized at ${dbPath}`);
    return db;
}
