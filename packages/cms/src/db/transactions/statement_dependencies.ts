import { isUniqueConstraintError, type Database } from '..';

export function touchStatementDependency(db: Database, parentId: number, childId: number) {
    try {
        db.prepare('INSERT INTO statement_dependencies (parent_id, child_id) VALUES (?, ?);').run(
            parentId,
            childId,
        );
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            return;
        } else {
            throw e;
        }
    }
}
