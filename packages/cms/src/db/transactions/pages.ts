import {
    type Database,
    isUniqueConstraintError,
    type PostReference,
    type SequenceChildReference,
} from '..';

import { getPostReferences, getSequenceChildReferences, type KatexMacros } from '.';

export interface Page {
    id: number;
    mddocId: number;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
}

export function getPage(db: Database, filename: string): Page | undefined {
    const out = db
        .prepare(
            `SELECT pages.id, pages.pathname, pages.mddoc_id, mddocs.filename, mddocs.katex_macros
            FROM pages INNER JOIN mddocs ON pages.mddoc_id = mddocs.id
            WHERE mddocs.filename = ?;`,
        )
        .get(filename) as
        | { id: number; mddoc_id: number; pathname: string; filename: string; katex_macros: string }
        | undefined;
    if (out) {
        return {
            id: out.id,
            mddocId: out.mddoc_id,
            pathname: out.pathname,
            filename: out.filename,
            katexMacros: JSON.parse(out.katex_macros),
        };
    }
}

export function getPageFilename(db: Database, pathname: string): string | undefined {
    const out = db
        .prepare(
            `SELECT mddocs.filename
            FROM mddocs INNER JOIN pages ON mddocs.id = pages.mddoc_id
            WHERE pages.pathname = ?;`,
        )
        .get(pathname) as { filename: string } | undefined;
    if (out) {
        return out.filename;
    }
}

export function getPagePathname(db: Database, id: number): string | undefined {
    const out = db.prepare('SELECT pathname FROM pages WHERE id = ?').get(id) as
        | { pathname: string }
        | undefined;
    if (out) {
        return out.pathname;
    }
}

export function touchPageReference(
    db: Database,
    sourceMddocId: number,
    targetPagePathname: string,
): boolean {
    try {
        const out = db
            .prepare(
                `INSERT INTO page_refs (source_mddoc_id, target_page_id)
                SELECT ?, id
                FROM pages WHERE pages.pathname = ?`,
            )
            .run(sourceMddocId, targetPagePathname);
        return out.changes > 0;
    } catch (e) {
        if (!isUniqueConstraintError(e)) {
            throw e;
        }
        return true;
    }
}

export type PageReference = PostReference | SequenceChildReference;

export function getPageReferences(db: Database, sourceMddocId: number): PageReference[] {
    const references: PageReference[] = [];
    references.push(...getPostReferences(db, sourceMddocId));
    references.push(...getSequenceChildReferences(db, sourceMddocId));
    return references;
}
