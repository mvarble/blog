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
    created: Date;
    edited: Date;
    enumerate: boolean;
    descriptionFilename?: string;
    imageFilename?: string;
    tags?: string[];
}

export interface SequenceChildBase {
    pageId: number;
    mddocId: number;
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
    descriptionId?: number;
    imageFilename?: string;
    tags: string[];
}

export function touchSequence(
    db: Database,
    { descriptionFilename, tags, ...sequence }: TouchSequenceInput,
): Sequence {
    let mddocId: number;
    let pageId: number;
    let id: number;
    let descriptionId: number | undefined = undefined;
    const pathname = `sequences/${sequence.slug}`;
    const children: SequenceChild[] = [];
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(sequence.filename, JSON.stringify(sequence.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        if (descriptionFilename) {
            const descriptionMddoc = db
                .prepare(
                    "INSERT INTO mddocs (filename, root, katex_macros) VALUES (?, ?, '{}') RETURNING id;",
                )
                .get(descriptionFilename, mddocId);
            descriptionId = (descriptionMddoc as { id: number }).id;
        }

        const page = db
            .prepare('INSERT INTO pages (mddoc_id, pathname) VALUES (?, ?) RETURNING id;')
            .get(mddocId, pathname);
        pageId = (page as { id: number }).id;

        if (tags) {
            const qmarks = tags.map(() => '(?, ?)').join(', ');
            const values = tags.flatMap((tag) => [pageId, tag]);
            db.prepare(`INSERT OR IGNORE INTO tags (page_id, tag) VALUES ${qmarks}`).run(...values);
        }

        const out = db
            .prepare(
                `INSERT INTO sequences (
                    page_id, description_id, image_filename, title, created, edited, slug, enumerate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id;`,
            )
            .get(
                pageId,
                descriptionId || null,
                sequence.imageFilename || null,
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

            if (descriptionFilename) {
                const descriptionMddoc = db
                    .prepare('UPDATE mddocs SET root = ? WHERE filename = ? RETURNING id;')
                    .get(mddocId, descriptionFilename);
                descriptionId = (descriptionMddoc as { id: number }).id;
            }

            const page = db
                .prepare('UPDATE pages SET pathname = ? WHERE mddoc_id = ? RETURNING id;')
                .get(pathname, mddocId);
            pageId = (page as { id: number }).id;

            db.prepare('DELETE FROM tags WHERE page_id = ?;').run(pageId);
            if (tags) {
                const qmarks = tags.map(() => '(?, ?)').join(', ');
                const values = tags.flatMap((tag) => [pageId, tag]);
                db.prepare(`INSERT tags (page_id, tag) VALUES ${qmarks}`).run(...values);
            }

            const out = db
                .prepare(
                    `UPDATE sequences
                    SET title = ?, description_id = ?, image_filename = ?, created = ?, edited = ?, slug = ?, enumerate = ?
                    WHERE page_id = ?
                    RETURNING id;`,
                )
                .get(
                    sequence.title,
                    descriptionId || null,
                    sequence.imageFilename || null,
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
                    mddocId,
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
        mddocId,
        pathname,
        descriptionId,
        children: children.length != 0 ? children : undefined,
        tags: tags || [],
    };
}

export function touchSequenceChild(
    db: Database,
    sequenceId: number,
    sequenceMddocId: number,
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
            .prepare(
                'INSERT INTO mddocs (filename, root, katex_macros) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(input.filename, sequenceMddocId, JSON.stringify(input.katexMacros));
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
                .prepare(
                    'UPDATE mddocs SET katex_macros = ?, root = ? WHERE filename = ? RETURNING id;',
                )
                .get(JSON.stringify(input.katexMacros), sequenceMddocId, input.filename);
            mddocId = (mddoc as { id: number }).id;

            const page = db
                .prepare('UPDATE pages SET pathname = ? WHERE mddoc_id = ? RETURNING id;')
                .get(pathname, mddocId);
            pageId = (page as { id: number }).id;

            db.prepare(
                `UPDATE sequence_pages
                SET sequence_id = ?, parent_page_id = ?, title = ?, slug = ?,
                    item = ?, appendix = ?, label = ?
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
                    sequenceMddocId,
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
        mddocId,
        pageId,
        pathname,
        children,
        label: enumerate ? label : undefined,
    };
}

export function getParentSequenceFilename(db: Database, filename: string): string | undefined {
    const output = db
        .prepare(
            `SELECT parent_mddocs.filename
            FROM mddocs parent_mddocs
            INNER JOIN pages parent_pages ON parent_mddocs.id = parent_pages.mddoc_id
            INNER JOIN sequences ON parent_pages.id = sequences.page_id
            INNER JOIN sequence_pages ON sequences.id = sequence_pages.sequence_id
            INNER JOIN pages ON sequence_pages.page_id = pages.id
            INNER JOIN mddocs ON pages.mddoc_id = mddocs.id
            WHERE mddocs.filename = ?`,
        )
        .get(filename) as { filename: string } | undefined;
    if (output) {
        return output.filename;
    }
}

interface SequenceSelect {
    id: number;
    description_id: number | null;
    image_filename: string;
    page_id: number;
    mddoc_id: number;
    title: string;
    slug: string;
    created: string;
    edited: string;
    enumerate: number;
    pathname: string;
    filename: string;
    katex_macros: string;
}

interface IntermediateSequenceChild {
    page_id: number;
    mddoc_id: number;
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

export function getSequence(db: Database, slug: string): Sequence | undefined {
    const sequence = db
        .prepare(
            `SELECT
                seq.id, seq.page_id, seq.description_id, seq.image_filename, spage.mddoc_id,
                seq.title, seq.slug, seq.created, seq.edited, seq.enumerate, spage.pathname,
                smddoc.filename, smddoc.katex_macros
            FROM sequences seq
            INNER JOIN pages spage ON seq.page_id = spage.id
            INNER JOIN mddocs smddoc ON spage.mddoc_id = smddoc.id
            WHERE seq.slug = ?`,
        )
        .get(slug) as SequenceSelect | undefined;
    if (sequence) {
        const sequencePages = db
            .prepare(
                `SELECT
                    sp.page_id, p.mddoc_id, sp.parent_page_id, sp.title, sp.slug, sp.item,
                    sp.label, sp.appendix, p.pathname, m.filename, m.katex_macros
                FROM sequence_pages sp
                INNER JOIN pages p ON sp.page_id = p.id
                INNER JOIN mddocs m ON p.mddoc_id = m.id
                WHERE sp.sequence_id = ?; `,
            )
            .all(sequence.id) as IntermediateSequenceChild[];
        return {
            id: sequence.id,
            mddocId: sequence.mddoc_id,
            pageId: sequence.page_id,
            descriptionId: sequence.description_id || undefined,
            imageFilename: sequence.image_filename,
            slug: sequence.slug,
            title: sequence.title,
            enumerate: sequence.enumerate == 0 ? false : true,
            pathname: sequence.pathname,
            filename: sequence.filename,
            created: new Date(sequence.created),
            edited: new Date(sequence.edited),
            katexMacros: JSON.parse(sequence.katex_macros),
            children: buildTree(sequencePages, sequence.page_id),
            tags: (
                db.prepare('SELECT tag FROM tags WHERE page_id = ?;').all(sequence.page_id) as {
                    tag: string;
                }[]
            ).map(({ tag }) => tag),
        };
    }
}

export function getParentSequence(db: Database, filename: string): Sequence | undefined {
    // check first that it is a child
    let sequenceRes = db
        .prepare(
            `SELECT
            seq.id, seq.page_id, seq.description_id, seq.image_filename, spage.mddoc_id, seq.title,
            seq.slug, seq.created, seq.edited, seq.enumerate, spage.pathname, smddoc.filename,
            smddoc.katex_macros
        FROM sequences seq
        INNER JOIN pages spage ON seq.page_id = spage.id
        INNER JOIN mddocs smddoc ON spage.mddoc_id = smddoc.id
        INNER JOIN mddocs cmddoc ON smddoc.id = cmddoc.root
        WHERE cmddoc.filename = ?`,
        )
        .get(filename) as SequenceSelect | undefined;

    // if it is not a direct sequence child, try to see if it is the root
    if (!sequenceRes) {
        sequenceRes = db
            .prepare(
                `SELECT
                    seq.id, seq.page_id, seq.description_id, seq.image_filename, spage.mddoc_id,
                    seq.title, seq.slug, seq.created, seq.edited, seq.enumerate, spage.pathname,
                    smddoc.filename, smddoc.katex_macros
                FROM sequences seq
                INNER JOIN pages spage ON seq.page_id = spage.id
                INNER JOIN mddocs smddoc ON spage.mddoc_id = smddoc.id
                WHERE smddoc.filename = ?`,
            )
            .get(filename) as SequenceSelect | undefined;
    }

    if (sequenceRes) {
        const sequencePages = db
            .prepare(
                `SELECT
                    sp.page_id, p.mddoc_id, sp.parent_page_id, sp.title, sp.slug, sp.item,
                    sp.label, sp.appendix, p.pathname, m.filename, m.katex_macros
                FROM sequence_pages sp
                INNER JOIN pages p ON sp.page_id = p.id
                INNER JOIN mddocs m ON p.mddoc_id = m.id
                WHERE sp.sequence_id = ?; `,
            )
            .all(sequenceRes.id) as IntermediateSequenceChild[];
        return {
            id: sequenceRes.id,
            mddocId: sequenceRes.mddoc_id,
            pageId: sequenceRes.page_id,
            descriptionId: sequenceRes.description_id || undefined,
            imageFilename: sequenceRes.image_filename,
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
                mddocId: child.mddoc_id,
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
            FROM sequences s
            INNER JOIN sequence_pages sp ON s.id = sp.sequence_id
            INNER JOIN pages p ON sp.page_id = p.id
            INNER JOIN page_refs pr ON p.id = pr.target_page_id
            WHERE pr.source_mddoc_id = ?`,
        )
        .all(sourceMddocId) as SCRNoFull[];

    out.push(
        ...(db
            .prepare(
                `SELECT p.id as pageId, p.pathname, s.title, '' as label, s.title as sequence
                FROM sequences s
                INNER JOIN pages p ON s.page_id = p.id
                INNER JOIN page_refs pr ON p.id = pr.target_page_id
                WHERE pr.source_mddoc_id = ?`,
            )
            .all(sourceMddocId) as SCRNoFull[]),
    );

    return out.map((obj) => ({
        ...obj,
        full: obj.label ? `${obj.label}. ${obj.title} ` : obj.title,
    }));
}

export function getSequenceInfos(db: Database, max?: number): PostInfo[] {
    const outputs = db
        .prepare(
            `SELECT sequences.title, sequences.created, sequences.edited, sequences.image_filename, pages.pathname, mddocs.filename
            FROM sequences
            INNER JOIN pages ON sequences.page_id = pages.id
            LEFT OUTER JOIN mddocs ON sequences.description_id = mddocs.id
            ORDER BY sequences.edited DESC
            ${typeof max == 'number' ? 'LIMIT ' + max : ''};`,
        )
        .all() as {
            title: string;
            created: string;
            edited: string;
            image_filename: string;
            pathname: string;
            filename: string;
        }[];
    return outputs.map(({ created, edited, filename, image_filename, ...post }) => ({
        ...post,
        descriptionFilename: filename,
        imageFilename: image_filename,
        created: new Date(created),
        edited: new Date(edited),
    }));
}
