import { type Database } from '..';
import { type KatexMacros, replaceTags, upsertMddoc, upsertPage } from '.';

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
    const pathname = `posts/${post.slug}`;

    const mddocId = upsertMddoc(db, {
        filename: post.filename,
        katexMacros: post.katexMacros,
    });
    const descriptionId = descriptionFilename
        ? upsertMddoc(db, { filename: descriptionFilename, root: mddocId })
        : undefined;
    const pageId = upsertPage(db, mddocId, pathname);
    replaceTags(db, pageId, tags);

    db.prepare(
        `INSERT INTO posts (
            page_id, description_id, image_filename, title, slug, created, edited)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (slug) DO UPDATE SET
            page_id = excluded.page_id,
            description_id = excluded.description_id,
            image_filename = excluded.image_filename,
            title = excluded.title,
            created = excluded.created,
            edited = excluded.edited;`,
    ).run(
        pageId,
        descriptionId ?? null,
        post.imageFilename ?? null,
        post.title,
        post.slug,
        post.created.toISOString(),
        post.edited.toISOString(),
    );

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
