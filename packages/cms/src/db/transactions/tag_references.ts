import { type Database, isUniqueConstraintError, type Tag } from '..';

export function touchTagReference(db: Database, parentId: number, childSlug: string): boolean {
    try {
        const tag = db
            .prepare('SELECT parent_id as parentId, label, slug FROM tags WHERE slug = ?;')
            .get(childSlug) as Tag | undefined;
        if (!tag) return false;
        db.prepare('INSERT INTO tag_references (parent_id, child_slug) VALUES (?, ?);').run(
            parentId,
            childSlug,
        );
        return true;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            return true;
        } else {
            throw e;
        }
    }
}

export interface TagReference {
    label: string;
    pathname: string;
}

export function getTagReferences(db: Database, parentId: number): Record<string, TagReference> {
    const output = db
        .prepare(
            `SELECT pages.pathname, tags.slug, tags.label
            FROM tags INNER JOIN tag_references INNER JOIN pages
            ON tags.slug = tag_references.child_slug AND pages.id = tags.parent_id
            WHERE tag_references.parent_id = ?;`,
        )
        .all(parentId) as { pathname: string; slug: string; label: string }[];
    return Object.fromEntries(
        output.map(({ slug, label, pathname }) => [slug, { label, pathname }]),
    );
}
