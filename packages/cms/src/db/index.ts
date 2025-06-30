import { type Database } from 'better-sqlite3';
import down from './sql/down.sql';
import up from './sql/up.sql';

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

export * from './transactions';
