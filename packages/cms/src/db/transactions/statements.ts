import { type Database } from '..';
import { type KatexMacros } from '.';
import { hasNumberField, hasStringField } from '../../plugin/typechecks';

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

export function getStatementParent(db: Database, filename: string): string | undefined {
    let output = db
        .prepare(
            'SELECT statements.parent_id FROM pages INNER JOIN statements WHERE pages.id = statements.page_id AND pages.filename = ?;',
        )
        .get(filename);
    if (output && hasNumberField(output, 'parent_id')) {
        output = db
            .prepare('SELECT filename FROM pages WHERE pages.id = = ?;')
            .get(output.parent_id);
        if (output && hasStringField(output, 'filename')) {
            return output.filename;
        }
    }
}

export function getStatement(db: Database, slug: string): Statement | undefined {
    const output = db
        .prepare(
            'SELECT s.id, s.page_id, s.parent_id, s.kind, s.slug, s.item, s.item_prefix, p.pathname, p.filename, p.katex_macros FROM statements s INNER JOIN pages p WHERE p.id = s.page_id AND s.slug = ?;',
        )
        .get(slug);
    if (
        output &&
        hasNumberField(output, 'id') &&
        hasNumberField(output, 'page_id') &&
        hasNumberField(output, 'parent_id') &&
        hasStringField(output, 'kind') &&
        hasStringField(output, 'slug') &&
        hasNumberField(output, 'item') &&
        'item_prefix' in output &&
        hasStringField(output, 'pathname') &&
        hasStringField(output, 'filename') &&
        hasStringField(output, 'katex_macros')
    ) {
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

// TODO: getStatementData (like getPostData)
