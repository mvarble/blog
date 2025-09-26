import { isUniqueConstraintError, type Database } from '..';
import { type KatexMacros } from '.';

export interface TouchStatementInput {
    parentPageId: number;
    slug: string;
    label: string;
    filename: string;
    katexMacros: KatexMacros;
    kind: string;
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
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?) RETURNING id;')
            .get(input.filename, JSON.stringify(input.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        const out = db
            .prepare(
                `INSERT INTO statements (
                    mddoc_id, parent_page_id, slug, label, kind)
                VALUES (?, ?, ?, ?, ?) RETURNING id;`,
            )
            .get(mddocId, input.parentPageId, input.slug, input.label, input.kind);
        id = (out as { id: number }).id;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const mddoc = db
                .prepare('UPDATE mddocs SET katex_macros = ? WHERE filename = ? RETURNING id;')
                .get(JSON.stringify(input.katexMacros), input.filename);
            mddocId = (mddoc as { id: number }).id;

            const out = db
                .prepare(
                    'UPDATE statements SET parent_page_id = ?, slug = ?, label = ?, kind = ? WHERE mddoc_id = ? RETURNING id;',
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

export function getStatementParentFilename(db: Database, filename: string): string | undefined {
    const out = db
        .prepare(
            `SELECT m.filename
            FROM
                mddocs m
                INNER JOIN pages p
                INNER JOIN statements s
                INNER JOIN mddocs mm
            ON
                m.id = p.mddoc_id
                AND p.id = s.parent_page_id
                AND s.mddoc_id = mm.id
            WHERE mm.filename = ?;`,
        )
        .get(filename) as { filename: string } | undefined;
    if (out) {
        return out.filename;
    }
}

export function getStatementParentPathname(db: Database, filename: string): string | undefined {
    const out = db
        .prepare(
            `SELECT p.pathname
            FROM pages p INNER JOIN statements s INNER JOIN mddocs mm
            ON p.id = s.parent_page_id AND s.mddoc_id = mm.id
            WHERE mm.filename = ?;`,
        )
        .get(filename) as { pathname: string } | undefined;
    if (out) {
        return out.pathname;
    }
}

function getStatementFrom(db: Database, key: string, value: string): Statement | undefined {
    const output = db
        .prepare(
            `SELECT
                s.id, s.mddoc_id, s.parent_page_id, s.slug, s.label, s.kind,
                m.filename, m.katex_macros
            FROM statements s INNER JOIN mddocs m
            ON s.mddoc_id = m.id WHERE ${key} = ?;`,
        )
        .get(value) as
        | {
            id: number;
            mddoc_id: number;
            parent_page_id: number;
            slug: string;
            label: string;
            kind: string;
            filename: string;
            katex_macros: string;
        }
        | undefined;
    if (output) {
        return {
            id: output.id,
            mddocId: output.mddoc_id,
            parentPageId: output.parent_page_id,
            slug: output.slug,
            label: output.label,
            kind: output.kind,
            filename: output.filename,
            katexMacros: JSON.parse(output.katex_macros),
        };
    }
}

export function getStatementFromFilename(db: Database, filename: string): Statement | undefined {
    return getStatementFrom(db, 'm.filename', filename);
}

export function getStatementFromSlug(db: Database, slug: string): Statement | undefined {
    return getStatementFrom(db, 's.slug', slug);
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
    interface S {
        id: number;
        pathname: string;
        slug: string;
        label: string;
        kind: string;
    }
    const output = db
        .prepare(
            `SELECT s.id, p.pathname, s.slug, s.label, s.kind
            FROM statements s INNER JOIN pages p INNER JOIN statement_refs sr
            ON s.parent_page_id = p.id AND s.id = sr.target_statement_id
            WHERE sr.source_mddoc_id = ?`,
        )
        .all(sourceMddocId) as S[];
    return output.map(({ id, pathname: parentPathname, slug, label, kind: k }) => {
        const kind = k
            .split(' ')
            .map((str) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`)
            .join(' ');
        const full = `${kind} ${label}`;
        const pathname = `${parentPathname}#${slug}`;
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
            FROM statements s INNER JOIN mddocs m
            ON s.mddoc_id = m.id WHERE s.parent_page_id = ?`,
        )
        .all(parentPageId) as { id: number; mddocId: number; filename: string }[];
}
