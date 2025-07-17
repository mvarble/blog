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
    clearDb(db);
    initializeDb(db);
}

export function connect(): Database {
    return new sqlite3(`${cacheDir}/cache.db`);
}

export * from './transactions';
