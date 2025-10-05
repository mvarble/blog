import { isUniqueConstraintError, type Database } from '..';
import { type KatexMacros } from '.';

interface PostBase {
    title: string;
    created: Date;
    edited: Date;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
}

export interface TouchPostInput extends PostBase {
    descriptionId?: number;
}

export interface Post extends PostBase {
    mddocId: number;
    pageId: number;
    pathname: string;
}

export function touchPost(db: Database, { descriptionId, ...post }: TouchPostInput): Post {
    let mddocId: number;
    let pageId: number;
    const pathname = `posts/${post.slug}`;
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(post.filename, JSON.stringify(post.katexMacros));
        mddocId = (mddoc as { id: number }).id;

        const page = db
            .prepare('INSERT INTO pages (mddoc_id, pathname) VALUES (?, ?) RETURNING id;')
            .get(mddocId, pathname);
        pageId = (page as { id: number }).id;

        db.prepare(
            'INSERT INTO posts (page_id, description_id, title, slug, created, edited) VALUES (?, ?, ?, ?, ?, ?);',
        ).run(
            pageId,
            typeof descriptionId == 'number' ? descriptionId : null,
            post.title,
            post.slug,
            post.created.toISOString(),
            post.edited.toISOString(),
        );
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const mddoc = db
                .prepare('UPDATE mddocs SET katex_macros = ? WHERE filename = ? RETURNING id;')
                .get(JSON.stringify(post.katexMacros), post.filename);
            mddocId = (mddoc as { id: number }).id;

            const page = db
                .prepare('UPDATE pages SET pathname = ? WHERE mddoc_id = ? RETURNING id;')
                .get(pathname, mddocId);
            pageId = (page as { id: number }).id;

            db.prepare(
                'UPDATE posts SET title = ?, created = ?, edited = ?, slug = ? WHERE page_id = ?;',
            ).run(
                post.title,
                post.created.toISOString(),
                post.edited.toISOString(),
                post.slug,
                pageId,
            );
        } else {
            throw e;
        }
    }
    return { mddocId, pageId, pathname, ...post };
}

export interface PostReference {
    pageId: number;
    pathname: string;
    title: string;
    full: string;
}

export function getPostReferences(db: Database, sourceMddocId: number): PostReference[] {
    const outputs = db
        .prepare(
            `SELECT post_page.id, post_page.pathname, post.title
            FROM posts post
            INNER JOIN pages post_page ON post.page_id = post_page.id
            INNER JOIN page_refs refs ON post_page.id = refs.target_page_id
            WHERE refs.source_mddoc_id = ?`,
        )
        .all(sourceMddocId);
    return (outputs as { id: number; pathname: string; title: string }[]).map(
        ({ id, pathname, title }) => ({
            pageId: id,
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
            `SELECT title, created, edited, pathname
            FROM posts INNER JOIN pages ON posts.page_id = pages.id
            ORDER BY posts.edited DESC;`,
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
