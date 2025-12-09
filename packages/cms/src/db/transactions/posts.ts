import { isUniqueConstraintError, type Database } from '..';
import { type KatexMacros } from '.';

interface PostBase {
    title: string;
    created: Date;
    edited: Date;
    slug: string;
    filename: string;
    katexMacros: KatexMacros;
    imageFilename?: string;
}

export interface TouchPostInput extends PostBase {
    descriptionFilename?: string;
    tags?: string[];
}

export interface Post extends PostBase {
    mddocId: number;
    descriptionId?: number;
    pageId: number;
    pathname: string;
    tags: string[];
}

export function getPost(db: Database, pathname: string): Post | undefined {
    const obj = db
        .prepare(
            `SELECT
                p.page_id, p.description_id, p.image_filename, p.title, p.created, p.edited,
                p.slug, pp.pathname, pm.id as mddocId, pm.filename, pm.katex_macros
            FROM posts p
            INNER JOIN pages pp ON p.page_id = pp.id
            INNER JOIN mddocs pm ON pp.mddoc_id = pm.id
            WHERE pp.pathname = ?;`,
        )
        .get(pathname) as
        | {
            page_id: number;
            description_id: number | null;
            image_filename: string;
            title: string;
            created: string;
            edited: string;
            slug: string;
            pathname: string;
            mddocId: number;
            filename: string;
            katex_macros: string;
        }
        | undefined;
    if (obj) {
        return {
            pageId: obj.page_id,
            descriptionId: obj.description_id || undefined,
            imageFilename: obj.image_filename,
            title: obj.title,
            created: new Date(obj.created),
            edited: new Date(obj.edited),
            slug: obj.slug,
            pathname: obj.pathname,
            mddocId: obj.mddocId,
            filename: obj.filename,
            katexMacros: JSON.parse(obj.katex_macros),
            tags: (
                db.prepare('SELECT tag FROM tags WHERE page_id = ?;').all(obj.page_id) as {
                    tag: string;
                }[]
            ).map(({ tag }) => tag),
        };
    }
}

export function touchPost(
    db: Database,
    { descriptionFilename, tags, ...post }: TouchPostInput,
): Post {
    let mddocId: number;
    let pageId: number;
    let descriptionId: number | undefined = undefined;
    const pathname = `posts/${post.slug}`;
    try {
        const mddoc = db
            .prepare('INSERT INTO mddocs (filename, katex_macros) VALUES (?, ?) RETURNING id;')
            .get(post.filename, JSON.stringify(post.katexMacros));
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

        db.prepare(
            'INSERT INTO posts (page_id, description_id, image_filename, title, slug, created, edited) VALUES (?, ?, ?, ?, ?, ?, ?);',
        ).run(
            pageId,
            descriptionId || null,
            post.imageFilename || null,
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
                db.prepare(`INSERT INTO tags (page_id, tag) VALUES ${qmarks}`).run(...values);
            }

            db.prepare(
                'UPDATE posts SET title = ?, description_id = ?, created = ?, edited = ?, slug = ? WHERE page_id = ?;',
            ).run(
                post.title,
                descriptionId || null,
                post.created.toISOString(),
                post.edited.toISOString(),
                post.slug,
                pageId,
            );
        } else {
            throw e;
        }
    }
    return { mddocId, pageId, descriptionId, pathname, tags: tags || [], ...post };
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
    descriptionFilename?: string;
    imageFilename?: string;
    tags: string[];
}

export function getPostInfos(db: Database, max?: number): PostInfo[] {
    const outputs = db
        .prepare(
            `SELECT title, created, edited, pathname, image_filename, mddocs.filename, page_id
            FROM posts
            INNER JOIN pages ON posts.page_id = pages.id
            LEFT OUTER JOIN mddocs ON mddocs.id = posts.description_id
            ORDER BY posts.edited DESC
            ${typeof max == 'number' ? 'LIMIT ' + max : ''};`,
        )
        .all() as {
            title: string;
            created: string;
            edited: string;
            pathname: string;
            image_filename: string;
            filename: string | null;
            page_id: number;
        }[];
    return outputs.map(({ created, edited, filename, image_filename, page_id, ...post }) => ({
        ...post,
        descriptionFilename: filename || undefined,
        imageFilename: image_filename,
        created: new Date(created),
        edited: new Date(edited),
        tags: (
            db.prepare('SELECT tag FROM tags WHERE page_id = ?;').all(page_id) as { tag: string }[]
        ).map(({ tag }) => tag),
    }));
}
