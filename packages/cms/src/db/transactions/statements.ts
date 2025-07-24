import { type Database } from '..';
import { type KatexMacros } from '.';

export interface TouchStatementInput {
    parentId: number;
    kind: string;
    slug: string;
    item: number;
    itemPrefix?: number;
    filename: string;
    katexMacros: KatexMacros;
}

export interface Statement extends TouchStatementInput {
    id: number;
    pageId: number;
    pathname: string;
}

export function touchStatement(db: Database, input: TouchStatementInput): Statement {
    let pageId: number;
    let id: number;
    const pathname = `statements/${input.slug}`;
    try {
        let out = db
            .prepare(
                'INSERT INTO pages (pathname, filename, katex_macros) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(pathname, input.filename, JSON.stringify(input.katexMacros));
        pageId = (out as { id: number }).id;
        out = db
            .prepare(
                'INSERT INTO statements (page_id, parent_id, kind, slug, item, item_prefix) VALUES (?, ?, ?, ?, ?, ?) RETURNING id;',
            )
            .get(pageId, input.parentId, input.kind, input.slug, input.item, input.itemPrefix);
        id = (out as { id: number }).id;
    } catch (e) {
        if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
            let out = db
                .prepare(
                    'UPDATE pages SET pathname = ?, katex_macros = ? WHERE filename = ? RETURNING id;',
                )
                .get(pathname, JSON.stringify(input.katexMacros), input.filename);
            pageId = (out as { id: number }).id;
            out = db
                .prepare(
                    'UPDATE statements SET parent_id = ?, kind = ?, slug = ?, item = ?, item_prefix = ? WHERE page_id = ? RETURNING id;',
                )
                .run(input.parentId, input.kind, input.slug, input.item, input.itemPrefix, pageId);
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    return {
        id,
        pageId,
        pathname,
        ...input,
    };
}

function getStatementParentField<K extends string>(
    db: Database,
    filename: string,
    key: K,
): string | undefined {
    const out = db
        .prepare(
            `SELECT pp.${key} FROM pages p INNER JOIN statements s INNER JOIN pages pp
            WHERE p.filename = ? AND p.id = s.page_id AND s.parent_id = pp.id`,
        )
        .get(filename) as Record<K, string> | undefined;
    if (out) {
        return out[key];
    }
}

export function getStatementParentFilename(db: Database, filename: string): string | undefined {
    return getStatementParentField(db, filename, 'filename');
}

export function getStatementParentPathname(db: Database, filename: string): string | undefined {
    return getStatementParentField(db, filename, 'pathname');
}

function getStatementFrom(db: Database, key: string, value: string): Statement | undefined {
    const output = db
        .prepare(
            `SELECT
                s.id, s.page_id, s.parent_id, s.kind, s.slug, s.item, s.item_prefix, p.pathname,
                p.filename, p.katex_macros
            FROM statements s INNER JOIN pages p WHERE p.id = s.page_id AND ${key} = ?;`,
        )
        .get(value) as
        | {
            id: number;
            page_id: number;
            parent_id: number;
            kind: string;
            slug: string;
            item: number;
            item_prefix?: number;
            pathname: string;
            filename: string;
            katex_macros: string;
        }
        | undefined;
    if (output) {
        return {
            id: output.id,
            pageId: output.page_id,
            parentId: output.parent_id,
            kind: output.kind,
            slug: output.slug,
            item: output.item,
            itemPrefix: typeof output.item_prefix == 'number' ? output.item_prefix : undefined,
            pathname: output.pathname,
            filename: output.filename,
            katexMacros: JSON.parse(output.katex_macros),
        };
    }
}

export function getStatementFromFilename(db: Database, filename: string): Statement | undefined {
    return getStatementFrom(db, 'p.filename', filename);
}

export function getStatementFromSlug(db: Database, slug: string): Statement | undefined {
    return getStatementFrom(db, 's.slug', slug);
}

export interface StatementReference {
    pageId: number;
    pathname: string;
    item: string;
    kind: string;
    label: string;
}

export function getStatementReferences(
    db: Database,
    parentId: number,
    childIds: number[],
): StatementReference[] {
    interface S {
        pageId: number;
        pathname: string;
        item_prefix?: number;
        item: number;
        kind: string;
    }
    const output = db
        .prepare(
            `SELECT s.page_id as pageId, p.pathname, s.item_prefix, s.item, s.kind
            FROM statements s INNER JOIN pages p INNER JOIN page_references pr
            ON s.page_id = p.id AND pr.parent_id = ? AND pr.child_id = p.id AND pr.child_id IN (${childIds.map(() => '?').join(', ')});`,
        )
        .all(parentId, ...childIds) as S[];
    return output.map(({ pageId, pathname, ...rest }) => {
        const item = rest.item_prefix ? `${rest.item_prefix}.${rest.item}` : String(rest.item);
        const kind = rest.kind
            .split(' ')
            .map((str) => `${str.slice(0, 1).toUpperCase()}${str.slice(1)}`)
            .join(' ');
        const label = `${kind} ${item}`;
        return {
            pageId,
            pathname,
            item,
            kind,
            label,
        };
    });
}
