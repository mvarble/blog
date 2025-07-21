import { type Database } from '..';
import { type KatexMacros } from '.';

export interface TouchPostInput {
    title: string;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
}

export interface Post {
    pageId: number;
    title: string;
    slug: string;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
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
        db.prepare('INSERT INTO posts (page_id, title, slug) VALUES (?, ?, ?);').run(
            pageId,
            input.title,
            input.slug,
        );
    } catch (e) {
        if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
            const out = db
                .prepare(
                    'UPDATE pages SET pathname = ?, katex_macros = ? WHERE filename = ? RETURNING id;',
                )
                .get(pathname, JSON.stringify(input.katexMacros), input.filename);
            pageId = (out as { id: number }).id;
            db.prepare('UPDATE posts SET title = ?, slug = ? WHERE page_id = ?;').run(
                input.title,
                input.slug,
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
    label: string;
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
            label: title,
        }),
    );
}
