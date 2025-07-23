import { type Database } from '..';
import { type KatexMacros } from '.';

export interface Page {
    id: number;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
}

export function getPage(db: Database, filename: string): Page | undefined {
    const out = db.prepare('SELECT * FROM pages WHERE filename = ?;').get(filename) as
        | { id: number; pathname: string; filename: string; katex_macros: string }
        | undefined;
    if (out) {
        return {
            id: out.id,
            pathname: out.pathname,
            filename: out.filename,
            katexMacros: JSON.parse(out.katex_macros),
        };
    }
}

export function getPageFilename(db: Database, pathname: string): string | undefined {
    const out = db.prepare('SELECT filename FROM pages WHERE pathname = ?;').get(pathname) as
        | { filename: string }
        | undefined;
    if (out) {
        return out.filename;
    }
}

export function foldKatexMacros(
    db: Database,
    pageId: number,
    katexMacros: KatexMacros,
): KatexMacros {
    return foldPageMacros(db, pageId, katexMacros);
}

function foldPageMacros(db: Database, pageId: number, katexMacros: KatexMacros): KatexMacros {
    const out = db
        .prepare(
            `SELECT p.katex_macros, p.id FROM pages p INNER JOIN statements s
            ON s.parent_id = p.id AND s.page_id = ?;`,
        )
        .get(pageId) as { katex_macros: string; id: number };
    if (out) {
        return foldSequencePageMacros(db, out.id, {
            ...JSON.parse(out.katex_macros),
            ...katexMacros,
        });
    }
    return foldSequencePageMacros(db, pageId, katexMacros);
}

function foldSequencePageMacros(
    db: Database,
    pageId: number,
    katexMacros: KatexMacros,
): KatexMacros {
    const out = db
        .prepare(
            `SELECT p.katex_macros, p.id FROM pages p INNER JOIN sequence_pages sp
            ON sp.parent_id = p.id AND sp.page_id = ?;`,
        )
        .get(pageId) as { katex_macros: string; id: number } | undefined;
    if (out) {
        return foldSequencePageMacros(db, out.id, {
            ...JSON.parse(out.katex_macros),
            ...katexMacros,
        });
    }
    return katexMacros;
}
