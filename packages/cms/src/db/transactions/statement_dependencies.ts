import { type Database } from 'better-sqlite3';

export interface StatementDependency {
    parentId: number;
    childId: number;
}

export function touchStatementDependency(db: Database, parentId: number, childId: number) {
    try {
        db.prepare('INSERT INTO statement_dependencies (parent_id, child_id) VALUES (?, ?);').run(
            parentId,
            childId,
        );
    } catch (e) {
        if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
            return;
        } else {
            throw e;
        }
    }
}
