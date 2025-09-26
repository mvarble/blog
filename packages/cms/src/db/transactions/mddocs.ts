import { KatexMacros } from '.';
import { type Database } from '../types';

export interface Mddoc {
    id: number;
    filename: string;
    katexMacros: KatexMacros;
}

export function getMddoc(db: Database, filename: string): Mddoc | undefined {
    const out = db
        .prepare('SELECT id, katex_macros FROM mddocs WHERE filename = ?;')
        .get(filename) as { id: number; katex_macros: string } | undefined;
    if (out) {
        return {
            id: out.id,
            filename,
            katexMacros: JSON.parse(out.katex_macros),
        };
    }
}

export function getRelevantPathname(db: Database, mddocId: number): string | undefined {
    let out = db
        .prepare(`SELECT pages.pathname FROM pages WHERE pages.mddoc_id = ?;`)
        .get(mddocId) as { pathname: string } | undefined;
    if (out) {
        return out.pathname;
    }
    out = db
        .prepare(
            `SELECT pages.pathname
            FROM pages INNER JOIN page_mddocs ON page_mddocs.parent_page_id = pages.id
            WHERE page_mddocs.imported_mddoc_id = ?`,
        )
        .get(mddocId) as { pathname: string } | undefined;
    if (out) {
        return out.pathname;
    }
}
