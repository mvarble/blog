import { isUniqueConstraintError, type Database } from '..';
import { type KatexMacros } from '.';

export interface TouchPostInput {
    title: string;
    created: Date;
    edited: Date;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
}

export interface Post extends TouchPostInput {
    pageId: number;
    pathname: string;
}

export function isPost(db: Database, pageId: number): boolean {
    return (
        typeof db.prepare('SELECT posts.page_id FROM posts WHERE posts.page_id = ?').get(pageId) !=
        'undefined'
    );
}

export function touchPost(db: Database, input: TouchPostInput): Post {
    let pageId: number;
    const pathname = `posts/${input.slug}`;
    try {
        const out = db
            .prepare(
                'INSERT INTO pages (pathname, filename, katex_macros) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(pathname, input.filename, JSON.stringify(input.katexMacros));
        pageId = (out as { id: number }).id;
        db.prepare(
            'INSERT INTO posts (page_id, title, slug, created, edited) VALUES (?, ?, ?, ?, ?);',
        ).run(
            pageId,
            input.title,
            input.slug,
            input.created.toISOString(),
            input.edited.toISOString(),
        );
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const out = db
                .prepare(
                    'UPDATE pages SET pathname = ?, katex_macros = ? WHERE filename = ? RETURNING id;',
                )
                .get(pathname, JSON.stringify(input.katexMacros), input.filename);
            pageId = (out as { id: number }).id;
            db.prepare(
                'UPDATE posts SET title = ?, slug = ?, created = ?, edited = ? WHERE page_id = ?;',
            ).run(
                input.title,
                input.slug,
                input.created.toISOString(),
                input.edited.toISOString(),
                pageId,
            );
        } else {
            throw e;
        }
    }
    return {
        pageId,
        pathname,
        ...input,
    };
}

export interface PostReference {
    pageId: number;
    pathname: string;
    title: string;
    full: string;
}

export function getPostReferences(
    db: Database,
    parentId: number,
    childIds: number[],
): PostReference[] {
    const outputs = db
        .prepare(
            `SELECT child.page_id, childp.pathname, child.title
            FROM posts child INNER JOIN pages childp INNER JOIN page_references pr
            ON pr.parent_id = ? AND child.page_id = childp.id AND childp.id = pr.child_id
            AND pr.child_id IN (${childIds.map(() => '?').join(', ')});`,
        )
        .all(parentId, ...childIds);
    return (outputs as { page_id: number; pathname: string; title: string }[]).map(
        ({ page_id, pathname, title }) => ({
            pageId: page_id,
            pathname,
            title,
            full: title,
        }),
    );
}

export interface PostInfo {
    title: string;
    created: Date;
    edited: Date;
    pathname: string;
}

export function getPostInfos(db: Database): PostInfo[] {
    const outputs = db
        .prepare(
            `SELECT b.title, b.created, b.edited, a.pathname
            FROM pages a INNER JOIN posts b ON a.id = b.page_id ORDER BY b.edited DESC;`,
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
