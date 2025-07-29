import { isUniqueConstraintError, type Database } from '..';

export interface Tag {
    parentId: number;
    slug: string;
    label: string;
}

export function touchTag(db: Database, tag: Tag) {
    try {
        db.prepare('INSERT INTO tags (parent_id, slug, label) VALUES (?, ?, ?);').run(
            tag.parentId,
            tag.slug,
            tag.label,
        );
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            db.prepare('UPDATE tags SET parent_id = ?, label = ? WHERE slug = ?;').run(
                tag.parentId,
                tag.label,
                tag.slug,
            );
        } else {
            throw e;
        }
    }
}

export function getTags(db: Database, parentId: number): { slug: string; label: string }[] {
    return db.prepare('SELECT slug, label FROM tags WHERE parent_id = ?;').all(parentId) as {
        slug: string;
        label: string;
    }[];
}
