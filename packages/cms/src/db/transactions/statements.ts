import { type Database } from '..';
import { type KatexMacros, parseReference, resolveReferenceScope } from '.';

export interface TouchStatementInput {
    parentPageId: number;
    root: number;
    slug: string;
    label: string;
    kind: string;
    filename: string;
    katexMacros: KatexMacros;
}

export interface Statement extends TouchStatementInput {
    id: number;
    mddocId: number;
}

export function touchStatement(db: Database, input: TouchStatementInput): Statement {
    const mddoc = db
        .prepare(
            `INSERT INTO mddocs (filename, root, katex_macros) VALUES (?, ?, ?)
            ON CONFLICT (filename) DO UPDATE
                SET root = excluded.root, katex_macros = excluded.katex_macros
            RETURNING id;`,
        )
        .get(input.filename, input.root, JSON.stringify(input.katexMacros));
    const mddocId = (mddoc as { id: number }).id;

    db.prepare(
        'INSERT OR IGNORE INTO page_mddocs (parent_page_id, imported_mddoc_id) VALUES (?, ?);',
    ).run(input.parentPageId, mddocId);
    // `input.root` is the scope: the post, or the sequence root, that this
    // statement's slug is unique within.
    const out = db
        .prepare(
            `INSERT INTO statements (mddoc_id, scope_id, slug, label, kind)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (scope_id, slug) DO UPDATE
                SET mddoc_id = excluded.mddoc_id,
                    label = excluded.label,
                    kind = excluded.kind
            RETURNING id;`,
        )
        .get(mddocId, input.root, input.slug, input.label, input.kind);
    const id = (out as { id: number }).id;
    return {
        id,
        mddocId,
        ...input,
    };
}

function getStatementFromKey(db: Database, key: string, value: string): Statement | undefined {
    interface Select {
        parent_page_id: number;
        root: number;
        id: number;
        mddoc_id: number;
        slug: string;
        label: string;
        kind: string;
        filename: string;
        katex_macros: string;
    }
    const out = db
        .prepare(
            `SELECT
                pm.parent_page_id, s.id, s.mddoc_id, s.slug, s.label, s.kind,
                m.katex_macros, m.filename, m.root
            FROM mddocs m
            INNER JOIN statements s ON m.id = s.mddoc_id
            INNER JOIN page_mddocs pm ON m.id = pm.imported_mddoc_id
            WHERE ${key} = ?`,
        )
        .get(value) as Select | undefined;
    if (out) {
        return {
            id: out.id,
            root: out.root,
            parentPageId: out.parent_page_id,
            mddocId: out.mddoc_id,
            slug: out.slug,
            label: out.label,
            kind: out.kind,
            filename: out.filename,
            katexMacros: JSON.parse(out.katex_macros),
        };
    }
}

export function getStatementFromFilename(db: Database, filename: string): Statement | undefined {
    return getStatementFromKey(db, 'm.filename', filename);
}

export function getStatementParentFilename(db: Database, filename: string): string | undefined {
    const out = db
        .prepare(
            `SELECT m.filename
            FROM mddocs m
            INNER JOIN pages p ON m.id = p.mddoc_id
            INNER JOIN page_mddocs pm ON p.id = pm.parent_page_id
            INNER JOIN mddocs sm ON sm.id = pm.imported_mddoc_id
            WHERE sm.filename = ?`,
        )
        .get(filename) as { filename: string } | undefined;
    if (out) {
        return out.filename;
    }
}

// Records that `sourceMddocId` refers to a statement, resolving `ref` within the
// referencing document's own scope unless it explicitly names another. Returns
// false when nothing matches, which the caller reports.
export function touchStatementReference(
    db: Database,
    sourceMddocId: number,
    sourceScopeId: number,
    ref: string,
): boolean {
    const parsed = parseReference(ref);
    const scopeId = resolveReferenceScope(db, sourceScopeId, parsed);
    if (typeof scopeId != 'number') return false;
    const out = db
        .prepare(
            `INSERT OR IGNORE INTO statement_refs (source_mddoc_id, target_statement_id, ref)
            SELECT ?, id, ? FROM statements WHERE scope_id = ? AND slug = ?;`,
        )
        .run(sourceMddocId, ref, scopeId, parsed.slug);
    // A repeat reference in the same document is ignored but still resolved.
    if (out.changes > 0) return true;
    return (
        db
            .prepare('SELECT 1 AS ok FROM statement_refs WHERE source_mddoc_id = ? AND ref = ?;')
            .get(sourceMddocId, ref) != undefined
    );
}

export interface StatementReference {
    id: number;
    // The reference exactly as written in the document; this is the key the
    // markdown plugin looks a resolved target up by.
    ref: string;
    slug: string;
    pathname: string;
    kind: string;
    label: string;
    full: string;
}

export function getStatementReferences(db: Database, sourceMddocId: number): StatementReference[] {
    interface Select {
        id: number;
        ref: string;
        pathname: string;
        slug: string;
        label: string;
        kind: string;
    }
    const output = db
        .prepare(
            `SELECT s.id, sr.ref, p.pathname, s.slug, s.label, s.kind
            FROM statements s
            INNER JOIN page_mddocs pm ON s.mddoc_id = pm.imported_mddoc_id
            INNER JOIN pages p ON pm.parent_page_id = p.id
            INNER JOIN statement_refs sr ON s.id = sr.target_statement_id
            WHERE sr.source_mddoc_id = ?;`,
        )
        .all(sourceMddocId) as Select[];
    return output.map(({ id, ref, pathname: parentPathname, slug, label, kind: k }) => {
        const kind = capitalizeWords(k);
        return {
            id,
            ref,
            slug,
            pathname: `/${parentPathname}#${slug}`,
            kind,
            label,
            full: `${kind} ${label}`,
        };
    });
}

function capitalizeWords(text: string): string {
    return text
        .split(' ')
        .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
        .join(' ');
}

export function getImportedStatements(
    db: Database,
    parentPageId: number,
): { id: number; mddocId: number; filename: string }[] {
    return db
        .prepare(
            `SELECT s.id, s.mddoc_id as mddocId, m.filename
            FROM statements s
            INNER JOIN mddocs m ON s.mddoc_id = m.id
            INNER JOIN page_mddocs pm ON m.id = pm.imported_mddoc_id
            WHERE pm.parent_page_id = ? `,
        )
        .all(parentPageId) as { id: number; mddocId: number; filename: string }[];
}
