import { type Database } from '..';

export interface KatexMacros {
    [macro: string]: string;
}

export function foldKatexMacros(
    db: Database,
    mddocId: number,
    katexMacros: KatexMacros,
): KatexMacros {
    // try and see if this document is owned by a page
    const out = db
        .prepare(
            `SELECT m.katex_macros, m.id
            FROM mddocs m
            INNER JOIN pages p ON m.id = p.mddoc_id
            INNER JOIN page_mddocs pm ON p.id = pm.parent_page_id
            WHERE pm.imported_mddoc_id = ?;`,
        )
        .get(mddocId) as { katex_macros: string; id: number };

    // if this document is a owned by a page, test if page is within a sequence
    if (out) {
        return foldSequencePageMacros(db, out.id, {
            ...JSON.parse(out.katex_macros),
            ...katexMacros,
        });
    }

    // if this document is already a page, test if it is within a sequence
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
                INNER JOIN pages p ON m.id = p.mddoc_id
                INNER JOIN sequence_pages sp ON p.id = sp.parent_page_id
                INNER JOIN pages pp ON sp.page_id = pp.id
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

export * from './citations';
export * from './equations';
export * from './mddocs';
export * from './pages';
export * from './posts';
export * from './sequences';
export * from './statements';
