import { type Database } from '..';
import { type KatexMacros } from '.';
import { hasNumberField, hasStringField } from '../../plugin/typechecks';

export interface TouchSequenceChildInput {
    title: string;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
    children?: TouchSequenceChildInput[];
}

export interface TouchSequenceInput extends TouchSequenceChildInput {
    enumerate: boolean;
}

export interface SequenceChild {
    pageId: number;
    title: string;
    slug: string;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
    children?: SequenceChild[];
    location?: string;
}

export interface Sequence extends SequenceChild {
    id: number;
    enumerate: boolean;
}

export function touchSequence(db: Database, input: TouchSequenceInput): Sequence {
    let pageId: number;
    let id: number;
    const pathname = `sequences/${input.slug}`;
    const children: SequenceChild[] = [];
    try {
        let out = db
            .prepare(
                'INSERT INTO pages (pathname, filename, katex_macros) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(pathname, input.filename, JSON.stringify(input.katexMacros));
        pageId = (out as { id: number }).id;
        out = db
            .prepare(
                'INSERT INTO sequences (page_id, title, slug, enumerate) VALUES (?, ?, ?, ?) RETURNING id;',
            )
            .get(pageId, input.title, input.slug, input.enumerate ? 1 : 0);
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
                    'UPDATE sequences SET title = ?, slug = ?, enumerate = ? WHERE page_id = ? RETURNING id;',
                )
                .get(input.title, input.slug, input.enumerate ? 1 : 0, pageId);
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    if (input.children) {
        input.children.forEach((child, i) => {
            children.push(
                touchSequenceChild(db, id, input.enumerate, pageId, pathname, i, String(i), child),
            );
        });
    }
    return {
        ...input,
        id,
        pageId,
        pathname,
        children: children.length != 0 ? children : undefined,
    };
}

export function touchSequenceChild(
    db: Database,
    sequenceId: number,
    enumerate: boolean,
    parentId: number,
    parentPathname: string,
    item: number,
    location: string,
    input: TouchSequenceChildInput,
): SequenceChild {
    let pageId: number;
    const pathname = `${parentPathname}/${input.slug}`;
    const children: SequenceChild[] = [];
    try {
        const out = db
            .prepare(
                'INSERT INTO pages (pathname, filename, katex_macros) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(pathname, input.filename, JSON.stringify(input.katexMacros));
        pageId = (out as { id: number }).id;
        db.prepare(
            'INSERT INTO sequence_pages (page_id, sequence_id, parent_id, title, slug, item, location) VALUES (?, ?, ?, ?, ?, ?, ?);',
        ).run(
            pageId,
            sequenceId,
            parentId,
            input.title,
            input.slug,
            item,
            enumerate ? location : null,
        );
    } catch (e) {
        if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
            const out = db
                .prepare(
                    'UPDATE pages SET pathname = ?, katex_macros = ? WHERE filename = ? RETURNING id;',
                )
                .get(pathname, JSON.stringify(input.katexMacros), input.filename);
            pageId = (out as { id: number }).id;
            db.prepare(
                'UPDATE sequence_pages SET sequence_id = ?, parent_id = ?, title = ?, slug = ?, item = ?, location = ? WHERE page_id = ?;',
            ).run(
                sequenceId,
                parentId,
                enumerate,
                input.title,
                input.slug,
                item,
                enumerate ? location : null,
                pageId,
            );
        } else {
            throw e;
        }
    }
    if (input.children) {
        input.children.forEach((child, i) => {
            children.push(
                touchSequenceChild(
                    db,
                    sequenceId,
                    enumerate,
                    pageId,
                    pathname,
                    i,
                    `${location}.${i}`,
                    child,
                ),
            );
        });
    }
    return {
        ...input,
        pageId,
        pathname,
        children,
    };
}

export function getParentSequence(db: Database, filename: string): string | undefined {
    const output = db
        .prepare(
            'SELECT parent_pages.filename ' +
                'FROM pages parent_pages INNER JOIN sequences INNER JOIN sequence_pages INNER JOIN pages ' +
                'WHERE pages.filename = ? AND pages.id = sequence_pages.page_id ' +
                'AND sequence_pages.sequence_id = sequences.id ' +
                'AND parent_pages.id = sequences.page_id;',
        )
        .get(filename);
    if (output && hasStringField(output, 'filename')) {
        return output.filename;
    }
}

export function getSequence(db: Database, filename: string): Sequence | undefined {
    const sequenceRes = db
        .prepare(
            'SELECT s.id, s.page_id, s.title, s.slug, s.enumerate, p.pathname, p.filename, p.katex_macros  FROM sequences s INNER JOIN sequence_pages sp INNER JOIN pages p WHERE p.filename = ? AND (p.id = sp.page_id AND sp.sequence_id = s.id) OR p.id = s.page_id;',
        )
        .get(filename);
    if (
        sequenceRes &&
        hasNumberField(sequenceRes, 'id') &&
        hasNumberField(sequenceRes, 'page_id') &&
        hasStringField(sequenceRes, 'slug') &&
        hasStringField(sequenceRes, 'title') &&
        hasNumberField(sequenceRes, 'enumerate') &&
        hasStringField(sequenceRes, 'pathname') &&
        hasStringField(sequenceRes, 'filename') &&
        hasStringField(sequenceRes, 'katex_macros')
    ) {
        const sequencePages = db
            .prepare(
                'SELECT sp.page_id, sp.parent_id, sp.title, sp.slug, sp.item, sp.location, p.pathname, p.filename, p.katex_macros FROM sequence_pages sp INNER JOIN pages p ON sp.page_id = p.id WHERE sp.sequence_id = ?;',
            )
            .all(sequenceRes.id) as IntermediateSequenceChild[];

        return {
            id: sequenceRes.id,
            pageId: sequenceRes.page_id,
            slug: sequenceRes.slug,
            title: sequenceRes.title,
            enumerate: sequenceRes.enumerate == 0 ? false : true,
            pathname: sequenceRes.pathname,
            filename: sequenceRes.filename,
            katexMacros: JSON.parse(sequenceRes.katex_macros),
            children: buildTree(sequencePages, sequenceRes.page_id),
        };
    }
}

interface IntermediateSequenceChild {
    page_id: number;
    parent_id: number;
    title: string;
    slug: string;
    item: number;
    location?: string;
    pathname: string;
    filename: string;
    katex_macros: string;
}

function buildTree(items: IntermediateSequenceChild[], rootId: number): SequenceChild[] {
    // Step 1: Group nodes by parentId
    const childrenMap: Map<number, IntermediateSequenceChild[]> = new Map();
    for (const item of items) {
        const list: IntermediateSequenceChild[] = childrenMap.get(item.parent_id) || [];
        list.push(item);
        childrenMap.set(item.parent_id, list);
    }

    // Step 2: Recursive tree builder
    function buildChildren(parentId: number): SequenceChild[] {
        const children: SequenceChild[] = [];
        const childrenRes = childrenMap.get(parentId) || [];
        for (const child of childrenRes) {
            children.push({
                pageId: child.page_id,
                title: child.title,
                slug: child.slug,
                pathname: child.pathname,
                filename: child.filename,
                location: child.location,
                katexMacros: JSON.parse(child.katex_macros),
                children: buildChildren(child.page_id),
            });
        }
        return children;
    }

    // Step 3: Build tree from the given rootId
    return buildChildren(rootId);
}

export interface SequenceChildReference {
    pageId: number;
    pathname: string;
    title: string;
    item: string;
    sequence: string;
    label: string;
}

export function getSequenceChildReferences(
    db: Database,
    parentId: number,
    childIds: number[],
): SequenceChildReference[] {
    interface SCRNoLabel {
        pageId: number;
        pathname: string;
        title: string;
        item: string;
        sequence: string;
    }
    const out = db
        .prepare(
            `SELECT pr.child_id as pageId, p.pathname, sp.title, sp.location as item, s.title as sequence
            FROM sequences s INNER JOIN sequence_pages sp INNER JOIN pages p INNER JOIN page_references pr
            WHERE s.id = sp.sequence_id AND sp.page_id = pr.child_id AND sp.page_id = p.id AND pr.parent_id = ?
            AND pr.child_id IN (${childIds.map(() => '?').join(', ')});`,
        )
        .all(parentId, ...childIds) as SCRNoLabel[];

    out.push(
        ...(db
            .prepare(
                `SELECT pr.child_id as pageId, p.pathname, s.title, '' as item, s.title as sequence
                FROM sequences s INNER JOIN pages p INNER JOIN page_references pr
                WHERE s.page_id = pr.child_id AND s.page_id = p.id AND pr.parent_id = ?
                AND pr.child_id IN (${childIds.map(() => '?').join(', ')});`,
            )
            .all(parentId, ...childIds) as SCRNoLabel[]),
    );

    return out.map((obj) => ({
        ...obj,
        label: obj.item ? `${obj.item}. ${obj.title}` : obj.title,
    }));
}
