import {
    getPostReferences,
    getSequenceChildReferences,
    getStatementReferences,
    isUniqueConstraintError,
    PostReference,
    SequenceChildReference,
    StatementReference,
    type Database,
} from '..';

export interface PageReference {
    parentId: number;
    childId: number;
}

export function touchPageReference(
    db: Database,
    parentId: number,
    childPathname: string,
): PageReference | undefined {
    let childId: number;
    try {
        const child = db.prepare('SELECT id FROM pages WHERE pathname = ?;').get(childPathname) as
            | { id: number }
            | undefined;
        if (!child) return;
        childId = child.id;
        db.prepare('INSERT INTO page_references (parent_id, child_id) VALUES (?, ?);').run(
            parentId,
            childId,
        );
        return { parentId, childId };
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            return { parentId, childId: childId! };
        } else {
            throw e;
        }
    }
}

export type AnyReference = PostReference | SequenceChildReference | StatementReference;

export function getPageReferences(db: Database, parentId: number): Record<string, AnyReference> {
    const output = db
        .prepare('SELECT child_id FROM page_references WHERE parent_id = ?;')
        .all(parentId) as { child_id: number }[];
    const childIds = output.map(({ child_id }) => child_id);
    const references: AnyReference[] = [];
    references.push(...getPostReferences(db, parentId, childIds));
    references.push(...getSequenceChildReferences(db, parentId, childIds));
    references.push(...getStatementReferences(db, parentId, childIds));
    return Object.fromEntries(references.map((ref) => [ref.pathname, ref]));
}
