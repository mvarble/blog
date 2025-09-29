import { isUniqueConstraintError, type Database } from '..';
import { type KatexMacros } from '.';

export interface TouchStatementInput {
    parentPageId: number;
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
    let mddocId: number;
    let id: number;
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(input.filename, JSON.stringify(input.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        db.prepare(
            'INSERT INTO page_mddocs (parent_page_id, imported_mddoc_id) VALUES (?, ?);',
        ).run(input.parentPageId, mddocId);

        const out = db
            .prepare(
                `INSERT INTO statements (mddoc_id, slug, label, kind)
                VALUES (?, ?, ?, ?) RETURNING id;`,
            )
            .get(mddocId, input.slug, input.label, input.kind);
        id = (out as { id: number }).id;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const mddoc = db
                .prepare('UPDATE mddocs SET katex_macros = ? WHERE filename = ? RETURNING id;')
                .get(JSON.stringify(input.katexMacros), input.filename);
            mddocId = (mddoc as { id: number }).id;

            db.prepare('UPDATE page_mddocs SET parent_page_id = ? WHERE imported_mddoc_id = ?').run(
                input.parentPageId,
                mddocId,
            );

            const out = db
                .prepare(
                    `UPDATE statements
                    SET slug = ?, label = ?, kind = ? WHERE mddoc_id = ?
                    RETURNING id;`,
                )
                .get(input.parentPageId, input.slug, input.label, input.kind, mddocId);
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    return {
        id,
        mddocId,
        ...input,
    };
}

function getStatementFromKey(db: Database, key: string, value: string): Statement | undefined {
    interface Select {
        parent_page_id: number;
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
            `SELECT pm.parent_page_id, s.id, s.mddoc_id, s.slug, s.label, s.kind, m.katex_macros, m.filename
            FROM mddocs m
            INNER JOIN statements s ON m.id = s.mddoc_id
            INNER JOIN page_mddocs pm ON m.id = pm.imported_mddoc_id
            WHERE ${key} = ?`,
        )
        .get(value) as Select | undefined;
    if (out) {
        return {
            id: out.id,
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

export function getStatementFromSlug(db: Database, slug: string): Statement | undefined {
    return getStatementFromKey(db, 's.slug', slug);
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

export function touchStatementReference(db: Database, mddocId: number, slug: string): boolean {
    try {
        const out = db
            .prepare(
                `INSERT INTO statement_refs(source_mddoc_id, target_statement_id)
                SELECT ?, id FROM statements WHERE slug = ?; `,
            )
            .run(mddocId, slug);
        return out.changes > 0;
    } catch (e) {
        if (!isUniqueConstraintError(e)) {
            throw e;
        }
        return true;
    }
}

export interface StatementReference {
    id: number;
    slug: string;
    pathname: string;
    kind: string;
    label: string;
    full: string;
}

export function getStatementReferences(db: Database, sourceMddocId: number): StatementReference[] {
    interface Select {
        id: number;
        pathname: string;
        slug: string;
        label: string;
        kind: string;
    }
    const output = db
        .prepare(
            `SELECT s.id, p.pathname, s.slug, s.label, s.kind
            FROM statements s
            INNER JOIN page_mddocs pm ON s.mddoc_id = pm.imported_mddoc_id
            INNER JOIN pages p ON pm.parent_page_id = p.id
            INNER JOIN statement_refs sr ON s.id = sr.target_statement_id
            WHERE sr.source_mddoc_id = ? `,
        )
        .all(sourceMddocId) as Select[];
    return output.map(({ id, pathname: parentPathname, slug, label, kind: k }) => {
        const kind = k
            .split(' ')
            .map((str) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)} `)
            .join(' ');
        const full = `${kind} ${label} `;
        const pathname = `/${parentPathname}#${slug}`;
        return {
            id,
            slug,
            pathname,
            kind,
            label,
            full,
        };
    });
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
