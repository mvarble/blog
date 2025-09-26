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
            FROM pages INNER JOIN mddocs ON pages.mddoc_id = mddocs.id WHERE mddocs.filename = ?;`,
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
            FROM pages INNER JOIN mddocs ON pages.mddoc_id = mddocs.id WHERE pathname = ?;`,
        )
        .get(pathname) as { filename: string } | undefined;
    if (out) {
        return out.filename;
    }
}

export function foldKatexMacros(
    db: Database,
    mddocId: number,
    katexMacros: KatexMacros,
): KatexMacros {
    // try and see if this document is a statement
    const out = db
        .prepare(
            `SELECT m.katex_macros, m.id
            FROM mddocs m INNER JOIN pages p INNER JOIN statements s
            ON m.id = p.mddoc_id AND p.id = s.parent_page_id
            WHERE s.mddoc_id = ?;`,
        )
        .get(mddocId) as { katex_macros: string; id: number };

    // if this document is a statement, test if its parent is within a sequence
    if (out) {
        return foldSequencePageMacros(db, out.id, {
            ...JSON.parse(out.katex_macros),
            ...katexMacros,
        });
    }

    // if this document is not a statement, test if it is within a sequence
    return foldSequencePageMacros(db, mddocId, katexMacros);
}

function foldSequencePageMacros(
    db: Database,
    mddocId: number,
    katexMacros: KatexMacros,
): KatexMacros {
    // try and see if this document is a sequence child
    const out = db
        .prepare(
            `SELECT m.katex_macros, m.id
            FROM
                mddocs m
                INNER JOIN pages p
                INNER JOIN sequence_pages sp
                INNER JOIN pages pp
            ON
                m.id = p.mddoc_id
                AND p.id = sp.parent_page_id
                AND sp.page_id = pp.id
            WHERE pp.mdoc_id = ?;`,
        )
        .get(mddocId) as { katex_macros: string; id: number } | undefined;

    // if so, recurse and see if its parent is also a sequence child
    if (out) {
        return foldSequencePageMacros(db, out.id, {
            ...JSON.parse(out.katex_macros),
            ...katexMacros,
        });
    }

    // if it is not a sequence child, we are done folding
    return katexMacros;
}

export function touchPageReference(db: Database, sourceMddocId: number, targetPageId: number) {
    try {
        db.prepare('INSERT INTO page_refs (source_mddoc_id, target_page_id) VALUES (?, ?);').run(
            sourceMddocId,
            targetPageId,
        );
    } catch (e) {
        if (!isUniqueConstraintError(e)) {
            throw e;
        }
    }
}

export type PageReference = PostReference | SequenceChildReference;

export function getPageReferences(db: Database, sourceMddocId: number): PageReference[] {
    const references: PageReference[] = [];
    references.push(...getPostReferences(db, sourceMddocId));
    references.push(...getSequenceChildReferences(db, sourceMddocId));
    return references;
}
