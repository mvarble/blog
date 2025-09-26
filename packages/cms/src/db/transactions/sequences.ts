import { isUniqueConstraintError, type Database } from '..';
import { PostInfo, type KatexMacros } from '.';

interface TouchSequenceChildInputBase {
    title: string;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
    children?: TouchSequenceChildInput[];
}

export interface TouchSequenceChildInput extends TouchSequenceChildInputBase {
    appendix: boolean;
}

export interface TouchSequenceInput extends TouchSequenceChildInputBase {
    descriptionId?: number;
    created: Date;
    edited: Date;
    enumerate: boolean;
}

interface SequenceChildBase {
    pageId: number;
    title: string;
    slug: string;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
    children?: SequenceChild[];
    label?: string;
}

export interface SequenceChild extends SequenceChildBase {
    appendix: boolean;
}

export interface Sequence extends SequenceChildBase {
    id: number;
    created: Date;
    edited: Date;
    enumerate: boolean;
}

export function touchSequence(
    db: Database,
    { descriptionId, ...sequence }: TouchSequenceInput,
): Sequence {
    let mddocId: number;
    let pageId: number;
    let id: number;
    const pathname = `sequences/${sequence.slug}`;
    const children: SequenceChild[] = [];
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(sequence.filename, JSON.stringify(sequence.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        const page = db
            .prepare('INSERT INTO pages (mddoc_id, pathname) VALUES (?, ?) RETURNING id;')
            .get(mddocId, pathname);
        pageId = (page as { id: number }).id;

        const out = db
            .prepare(
                `INSERT INTO sequences (
                    page_id, description_id, title,
                    created, edited, slug, enumerate)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id;`,
            )
            .get(
                pageId,
                typeof descriptionId == 'number' ? descriptionId : null,
                sequence.title,
                sequence.created.toISOString(),
                sequence.edited.toISOString(),
                sequence.slug,
                sequence.enumerate ? 1 : 0,
            );
        id = (out as { id: number }).id;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const mddoc = db
                .prepare('UPDATE mddocs SET katex_macros = ? WHERE filename = ? RETURNING id;')
                .get(JSON.stringify(sequence.katexMacros), sequence.filename);
            mddocId = (mddoc as { id: number }).id;

            const page = db
                .prepare('UPDATE pages SET pathname = ? WHERE mddoc_id = ? RETURNING id;')
                .get(pathname, mddocId);
            pageId = (page as { id: number }).id;

            const out = db
                .prepare(
                    `UPDATE sequences
                        SET title = ?, created = ?, edited = ?, slug = ?, enumerate = ?
                    WHERE page_id = ?
                    RETURNING id;`,
                )
                .get(
                    sequence.title,
                    sequence.created.toISOString(),
                    sequence.edited.toISOString(),
                    sequence.slug,
                    sequence.enumerate ? 1 : 0,
                    pageId,
                );
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    if (sequence.children) {
        let appendixStart: number | undefined = undefined;
        let i = 0;
        for (const child of sequence.children) {
            if (child.appendix && typeof appendixStart == 'undefined') {
                appendixStart = i;
            }
            children.push(
                touchSequenceChild(
                    db,
                    id,
                    sequence.enumerate,
                    pageId,
                    pathname,
                    i,
                    typeof appendixStart == 'undefined'
                        ? String(i)
                        : String.fromCharCode(65 + i - appendixStart),
                    child,
                ),
            );
            ++i;
        }
    }
    return {
        ...sequence,
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
    parentPageId: number,
    parentPathname: string,
    item: number,
    label: string,
    input: TouchSequenceChildInput,
): SequenceChild {
    let pageId: number;
    let mddocId: number;
    const pathname = `${parentPathname}/${input.slug}`;
    const children: SequenceChild[] = [];
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(input.filename, JSON.stringify(input.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        const page = db
            .prepare('INSERT INTO pages (mddoc_id, pathname) VALUES (?, ?) RETURNING id;')
            .get(mddocId, pathname);
        pageId = (page as { id: number }).id;

        db.prepare(
            `INSERT INTO sequence_pages (
                sequence_id, page_id, parent_page_id, title, slug, item, appendix, label)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        ).run(
            sequenceId,
            pageId,
            parentPageId,
            input.title,
            input.slug,
            item,
            input.appendix ? 1 : 0,
            enumerate ? label : null,
        );
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const mddoc = db
                .prepare('UPDATE mddocs SET katex_macros = ? WHERE filename = ? RETURNING id;')
                .get(JSON.stringify(input.katexMacros), input.filename);
            mddocId = (mddoc as { id: number }).id;

            const page = db
                .prepare('UPDATE pages SET pathname = ? WHERE mddoc_id = ? RETURNING id;')
                .get(pathname, mddocId);
            pageId = (page as { id: number }).id;

            db.prepare(
                `UPDATE sequence_pages
                SET sequence_id = ?, parent_page_id = ?, title = ?, slug = ?,
                    item = ?, appendix = ?, label = ?, enumerate = ?
                WHERE page_id = ?;`,
            ).run(
                sequenceId,
                parentPageId,
                input.title,
                input.slug,
                item,
                input.appendix ? 1 : 0,
                enumerate ? label : null,
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
                    `${label}.${i}`,
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

export function getParentSequenceFilename(db: Database, filename: string): string | undefined {
    const output = db
        .prepare(
            `SELECT parent_mddocs.filename
            FROM
                mddocs parent_mddocs
                INNER JOIN pages parent_pages
                INNER JOIN sequences
                INNER JOIN sequence_pages
                INNER JOIN pages
                INNER JOIN mddocs
            ON
                mddocs.id = pages.mddoc_id
                AND pages.id = sequence_pages.page_id
                AND sequence_pages.sequence_id = sequences.id
                AND sequences.page_id = parent_pages.id
                AND parent_pages.mddoc_id = parent_mddocs.id
            WHERE mddocs.filename = ?`,
        )
        .get(filename) as { filename: string } | undefined;
    if (output) {
        return output.filename;
    }
}

export function getSequence(db: Database, filename: string): Sequence | undefined {
    const sequenceRes = db
        .prepare(
            `SELECT
                s.id, s.page_id, s.title, s.slug, s.created, s.edited, s.enumerate,
                pp.pathname, mm.filename, mm.katex_macros
            FROM
                sequences s
                INNER JOIN sequence_pages sp
                INNER JOIN pages p
                INNER JOIN mddocs m
                INNER JOIN pages pp
                INNER JOIN mddocs mm
            ON s.page_id = pp.id AND pp.mddoc_id = mm.id
            WHERE
                m.filename = ?
                AND (
                    (m.id = p.mddoc_id AND p.id = sp.page_id AND sp.sequence_id = s.id)
                    OR (m.id = p.mddoc_id AND p.id = s.page_id)
                );`,
        )
        .get(filename) as
        | {
            id: number;
            page_id: number;
            title: string;
            slug: string;
            created: string;
            edited: string;
            enumerate: number;
            pathname: string;
            filename: string;
            katex_macros: string;
        }
        | undefined;
    if (sequenceRes) {
        const sequencePages = db
            .prepare(
                `SELECT
                    sp.page_id, sp.parent_page_id, sp.title, sp.slug, sp.item,
                    sp.label, sp.appendix, p.pathname, m.filename, m.katex_macros
                FROM sequence_pages sp INNER JOIN pages p INNER JOIN mddocs m
                ON sp.page_id = p.id AND p.mddoc_id = m.id WHERE sp.sequence_id = ?; `,
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
            created: new Date(sequenceRes.created),
            edited: new Date(sequenceRes.edited),
            katexMacros: JSON.parse(sequenceRes.katex_macros),
            children: buildTree(sequencePages, sequenceRes.page_id),
        };
    }
}

interface IntermediateSequenceChild {
    page_id: number;
    parent_page_id: number;
    title: string;
    slug: string;
    item: number;
    label?: string;
    appendix: number;
    pathname: string;
    filename: string;
    katex_macros: string;
}

function buildTree(items: IntermediateSequenceChild[], rootId: number): SequenceChild[] {
    // Step 1: Group nodes by parentId
    const childrenMap: Map<number, IntermediateSequenceChild[]> = new Map();
    for (const item of items) {
        const list: IntermediateSequenceChild[] = childrenMap.get(item.parent_page_id) || [];
        list.push(item);
        childrenMap.set(item.parent_page_id, list);
    }

    // Step 2: Recursive tree builder
    function buildChildren(parentPageId: number): SequenceChild[] {
        const children: SequenceChild[] = [];
        const childrenRes = childrenMap.get(parentPageId) || [];
        for (const child of childrenRes) {
            children.push({
                pageId: child.page_id,
                title: child.title,
                slug: child.slug,
                pathname: child.pathname,
                filename: child.filename,
                label: child.label,
                appendix: child.appendix == 0 ? false : true,
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
    label: string;
    sequence: string;
    full: string;
}

export function getSequenceChildReferences(
    db: Database,
    sourceMddocId: number,
): SequenceChildReference[] {
    interface SCRNoFull {
        pageId: number;
        pathname: string;
        title: string;
        label: string;
        sequence: string;
    }
    const out = db
        .prepare(
            `SELECT p.id as pageId, p.pathname, sp.title, sp.label, s.title as sequence
            FROM sequences s INNER JOIN sequence_pages sp INNER JOIN pages p INNER JOIN page_refs pr
            ON s.id = sp.sequence_id AND sp.page_id = p.id AND p.id = pr.target_page_id
            WHERE pr.source_mddoc_id = ?`,
        )
        .all(sourceMddocId) as SCRNoFull[];

    out.push(
        ...(db
            .prepare(
                `SELECT p.id as pageId, p.pathname, s.title, '' as label, s.title as sequence
                FROM sequences s INNER JOIN pages p INNER JOIN page_refs pr
                ON s.page_id = p.id AND p.id = pr.target_page_id
                WHERE pr.source_mddoc_id = ?`,
            )
            .all(sourceMddocId) as SCRNoFull[]),
    );

    return out.map((obj) => ({
        ...obj,
        full: obj.label ? `${obj.label}. ${obj.title} ` : obj.title,
    }));
}

export function getSequenceInfos(db: Database): PostInfo[] {
    const outputs = db
        .prepare(
            `SELECT sequences.title, sequences.created, sequences.edited, pages.pathname
            FROM sequences INNER JOIN pages ON sequences.page_id = pages.id
            ORDER BY sequences.edited DESC;`,
        )
        .all() as {
            title: string;
            created: string;
            edited: string;
            pathname: string;
        }[];
    return outputs.map(({ created, edited, ...post }) => ({
        ...post,
        created: new Date(created),
        edited: new Date(edited),
    }));
}
