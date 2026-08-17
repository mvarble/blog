import { type Database } from '..';
import { type KatexMacros } from '.';

// Building blocks shared by posts and sequences, which register themselves in
// the same way: a markdown document, an optional description document, a page,
// and a set of tags.
//
// The database is emptied at the start of every build, so these conflict only
// when one build genuinely registers the same file or pathname twice. They are
// written as upserts rather than plain inserts so that stays a last-write-wins
// no-op instead of a crash.

export function upsertMddoc(
    db: Database,
    input: {
        filename: string;
        root?: number;
        katexMacros?: KatexMacros;
    },
): number {
    // Only the fields the caller supplied are overwritten on conflict, so a
    // description document keeps its macros and a page keeps its root.
    const updates: string[] = [];
    if (typeof input.root == 'number') updates.push('root = excluded.root');
    if (input.katexMacros) updates.push('katex_macros = excluded.katex_macros');

    const out = db
        .prepare(
            `INSERT INTO mddocs (filename, root, katex_macros) VALUES (?, ?, ?)
            ON CONFLICT (filename) DO UPDATE SET ${updates.join(', ') || 'filename = excluded.filename'}
            RETURNING id;`,
        )
        .get(input.filename, input.root ?? null, JSON.stringify(input.katexMacros ?? {}));
    return (out as { id: number }).id;
}

export function upsertPage(db: Database, mddocId: number, pathname: string): number {
    const out = db
        .prepare(
            `INSERT INTO pages (mddoc_id, pathname) VALUES (?, ?)
            ON CONFLICT (pathname) DO UPDATE SET mddoc_id = excluded.mddoc_id
            RETURNING id;`,
        )
        .get(mddocId, pathname);
    return (out as { id: number }).id;
}

export function replaceTags(db: Database, pageId: number, tags?: string[]) {
    db.prepare('DELETE FROM tags WHERE page_id = ?;').run(pageId);
    if (!tags || !tags.length) return;
    db.prepare(
        `INSERT OR IGNORE INTO tags (page_id, tag)
        VALUES ${tags.map(() => '(?, ?)').join(', ')};`,
    ).run(...tags.flatMap((tag) => [pageId, tag]));
}
