import { isUniqueConstraintError, type Database } from '..';

export interface TouchEquation {
    parentPageId: number;
    sourceMddocId: number;
    slug: string;
    label: string;
}

export interface Equation extends TouchEquation {
    id: number;
}

export function touchEquation(db: Database, eq: TouchEquation): Equation {
    let id: number;
    try {
        const out = db
            .prepare(
                `INSERT INTO equations (parent_page_id, source_mddoc_id, slug, label)
                VALUES (?, ?, ?, ?) RETURNING id;`,
            )
            .get(eq.parentPageId, eq.sourceMddocId, eq.slug, eq.label);
        id = (out as { id: number }).id;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const out = db
                .prepare(
                    `UPDATE equations
                    SET parent_page_id = ?, source_mddoc_id = ?, label = ? WHERE slug = ?
                    RETURNING id;`,
                )
                .get(eq.parentPageId, eq.sourceMddocId, eq.label, eq.slug);
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    return { id, ...eq };
}

export function touchEquationReference(db: Database, mddocId: number, slug: string): boolean {
    try {
        const out = db
            .prepare(
                `INSERT INTO equation_refs (source_mddoc_id, target_equation_id)
                SELECT ?, id FROM equations
                WHERE slug = ?;`,
            )
            .run(mddocId, slug);
        return out.changes > 0;
    } catch (e) {
        if (!isUniqueConstraintError(e)) {
            throw e;
        }
        return true;
    }
}

export interface EquationReference {
    id: number;
    slug: string;
    label: string;
    pathname: string;
}

export function getEquationReferences(db: Database, mddocId: number): EquationReference[] {
    const out = db
        .prepare(
            `SELECT e.id, e.slug, e.label, p.pathname
            FROM equations e
            INNER JOIN equation_refs er ON e.id = er.target_equation_id
            INNER JOIN pages p ON e.parent_page_id = p.id
            WHERE er.source_mddoc_id = ?`,
        )
        .all(mddocId) as EquationReference[];
    return out.map(({ id, slug, label, pathname: parentPathname }) => ({
        id,
        slug,
        label,
        pathname: `/${parentPathname}#eq:${slug}`,
    }));
}
