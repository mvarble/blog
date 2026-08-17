import { type Database } from '..';
import { parseReference, resolveReferenceScope } from '.';

export interface TouchEquation {
    parentPageId: number;
    sourceMddocId: number;
    // The post or sequence root this equation's slug is unique within.
    scopeId: number;
    slug: string;
    label: string;
}

export interface Equation extends TouchEquation {
    id: number;
}

export function touchEquation(db: Database, eq: TouchEquation): Equation {
    const out = db
        .prepare(
            `INSERT INTO equations (parent_page_id, source_mddoc_id, scope_id, slug, label)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (scope_id, slug) DO UPDATE
                SET parent_page_id = excluded.parent_page_id,
                    source_mddoc_id = excluded.source_mddoc_id,
                    label = excluded.label
            RETURNING id;`,
        )
        .get(eq.parentPageId, eq.sourceMddocId, eq.scopeId, eq.slug, eq.label);
    return { id: (out as { id: number }).id, ...eq };
}

// Records that `sourceMddocId` refers to an equation, resolving `ref` within the
// referencing document's own scope unless it explicitly names another.
export function touchEquationReference(
    db: Database,
    sourceMddocId: number,
    sourceScopeId: number,
    ref: string,
): boolean {
    const parsed = parseReference(ref);
    const scopeId = resolveReferenceScope(db, sourceScopeId, parsed);
    if (typeof scopeId != 'number') return false;
    const out = db
        .prepare(
            `INSERT OR IGNORE INTO equation_refs (source_mddoc_id, target_equation_id, ref)
            SELECT ?, id, ? FROM equations WHERE scope_id = ? AND slug = ?;`,
        )
        .run(sourceMddocId, ref, scopeId, parsed.slug);
    if (out.changes > 0) return true;
    return (
        db
            .prepare('SELECT 1 AS ok FROM equation_refs WHERE source_mddoc_id = ? AND ref = ?;')
            .get(sourceMddocId, ref) != undefined
    );
}

export interface EquationReference {
    id: number;
    // The reference exactly as written in the document.
    ref: string;
    slug: string;
    label: string;
    pathname: string;
}

export function getEquationReferences(db: Database, mddocId: number): EquationReference[] {
    const out = db
        .prepare(
            `SELECT e.id, er.ref, e.slug, e.label, p.pathname
            FROM equations e
            INNER JOIN equation_refs er ON e.id = er.target_equation_id
            INNER JOIN pages p ON e.parent_page_id = p.id
            WHERE er.source_mddoc_id = ?

            UNION

            SELECT e.id, e.slug AS ref, e.slug, e.label, p.pathname
            FROM equations e
            INNER JOIN pages p ON e.parent_page_id = p.id
            WHERE e.source_mddoc_id = ?;`,
        )
        .all(mddocId, mddocId) as EquationReference[];
    return out.map(({ id, ref, slug, label, pathname: parentPathname }) => ({
        id,
        ref,
        slug,
        label,
        pathname: `/${parentPathname}#eq:${slug}`,
    }));
}
