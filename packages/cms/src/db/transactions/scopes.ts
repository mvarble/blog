import { type Database } from '..';

// A "scope" is the umbrella a slug is unique within: a post, or the root
// document of a sequence. Every markdown document belongs to exactly one, which
// `mddocs.root` already records -- a document with no root is its own scope.
//
// References are resolved within the referencing document's scope, so a short
// slug means the same thing wherever it is written inside one piece of writing,
// and unrelated writing is free to reuse it.

export interface ParsedReference {
    // Present when the reference explicitly names another scope.
    scopeSlug?: string;
    slug: string;
}

// `slug` stays inside the current scope; `some-post/slug` reaches into another.
// Slugs never contain a slash, so the split is unambiguous.
export function parseReference(ref: string): ParsedReference {
    const separator = ref.lastIndexOf('/');
    if (separator < 0) return { slug: ref };
    return {
        scopeSlug: ref.slice(0, separator),
        slug: ref.slice(separator + 1),
    };
}

export function getScopeId(db: Database, mddocId: number): number {
    const out = db.prepare('SELECT root FROM mddocs WHERE id = ?;').get(mddocId) as
        | { root: number | null }
        | undefined;
    return out?.root ?? mddocId;
}

// The mddoc a post or sequence slug names, which is that document's own scope.
export function getScopeIdFromSlug(db: Database, scopeSlug: string): number | undefined {
    const out = db
        .prepare(
            `SELECT m.id
            FROM mddocs m
            INNER JOIN pages p ON m.id = p.mddoc_id
            INNER JOIN posts ON p.id = posts.page_id
            WHERE posts.slug = ?

            UNION

            SELECT m.id
            FROM mddocs m
            INNER JOIN pages p ON m.id = p.mddoc_id
            INNER JOIN sequences ON p.id = sequences.page_id
            WHERE sequences.slug = ?;`,
        )
        .get(scopeSlug, scopeSlug) as { id: number } | undefined;
    return out?.id;
}

// Names a scope the way an author would write it, for error messages.
export function describeScope(db: Database, scopeId: number): string {
    const out = db
        .prepare(
            `SELECT 'post' AS kind, posts.slug FROM posts
            INNER JOIN pages p ON posts.page_id = p.id WHERE p.mddoc_id = ?

            UNION

            SELECT 'sequence' AS kind, sequences.slug FROM sequences
            INNER JOIN pages p ON sequences.page_id = p.id WHERE p.mddoc_id = ?;`,
        )
        .get(scopeId, scopeId) as { kind: string; slug: string } | undefined;
    if (out) return `${out.kind} '${out.slug}'`;
    const mddoc = db.prepare('SELECT filename FROM mddocs WHERE id = ?;').get(scopeId) as
        | { filename: string }
        | undefined;
    return mddoc ? `'${mddoc.filename}'` : `scope ${scopeId}`;
}

// Resolves a reference to the scope it should be looked up in. Returns
// undefined when an explicit scope slug names nothing on the site.
export function resolveReferenceScope(
    db: Database,
    sourceScopeId: number,
    parsed: ParsedReference,
): number | undefined {
    if (typeof parsed.scopeSlug != 'string') return sourceScopeId;
    return getScopeIdFromSlug(db, parsed.scopeSlug);
}
