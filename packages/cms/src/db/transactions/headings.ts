import { type Database } from '..';
import { type Heading, type OutlineEntry, buildOutline } from '../../model/outline';

export { type Heading, type OutlineEntry };

export function touchHeading(db: Database, mddocId: number, item: number, heading: Heading) {
    db.prepare(
        `INSERT INTO headings (mddoc_id, item, depth, title, slug) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (mddoc_id, item) DO UPDATE SET
            depth = excluded.depth, title = excluded.title, slug = excluded.slug;`,
    ).run(mddocId, item, heading.depth, heading.title, heading.slug);
}

// A document's headings in the order they appear, which is also the order the
// rendered headings appear in, so `rehypeCms` can match them up by position.
export function getHeadings(db: Database, mddocId: number): Heading[] {
    return db
        .prepare('SELECT depth, title, slug FROM headings WHERE mddoc_id = ? ORDER BY item;')
        .all(mddocId) as Heading[];
}

// A page's headings as the tree the table of contents renders, addressed the
// way a page is: the blog knows filenames, not ids.
export function getPageOutline(db: Database, filename: string): OutlineEntry[] {
    return buildOutline(getPageHeadings(db, filename));
}

export function getPageHeadings(db: Database, filename: string): Heading[] {
    return db
        .prepare(
            `SELECT h.depth, h.title, h.slug
            FROM headings h
            INNER JOIN mddocs m ON h.mddoc_id = m.id
            WHERE m.filename = ?
            ORDER BY h.item;`,
        )
        .all(filename) as Heading[];
}
