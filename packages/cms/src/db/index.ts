import sqlite3 from 'better-sqlite3';
import down from './sql/down.sql';
import up from './sql/up.sql';

import { type Database } from './types';

export { Database };

export const cacheDir = '.cms';

export function clearDb(db: Database) {
    db.exec(down);
}

export function initializeDb(db: Database) {
    db.exec(up);
}

export function prepareDb(db: Database) {
    // `up` first: `down` empties tables rather than dropping them, so they have
    // to exist before it can run against a fresh cache directory.
    initializeDb(db);
    clearDb(db);
}

export function connect(): Database {
    const db: Database = new sqlite3(`${cacheDir}/cache.db`);
    // Without this the build spends nearly all of its time in `fsync`: every
    // statement runs in its own implicit transaction, and the default rollback
    // journal makes each one create, sync and delete a journal file. On ext4
    // that is ~19ms per write, which is two orders of magnitude more than the
    // write itself. `journal_mode` is persisted in the database file;
    // `synchronous` is per-connection, so both are set on every connect.
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    return db;
}

export * from './transactions';
