import { isUniqueConstraintError, type Database } from '..';

export interface TouchEquation {
    parentPageId: number;
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
                'INSERT INTO equations (parent_page_id, slug, label) VALUES (?, ?, ?) RETURNING id;',
            )
            .get(eq.parentPageId, eq.slug, eq.label);
        id = (out as { id: number }).id;
    } catch (e) {
        if (isUniqueConstraintError(e)) {
            const out = db
                .prepare(
                    'UPDATE equations SET parent_page_id = ?, label = ? WHERE slug = ? RETURNING id;',
                )
                .get(eq.parentPageId, eq.label, eq.slug);
            id = (out as { id: number }).id;
        } else {
            throw e;
        }
    }
    return { id, ...eq };
}

export function touchEquationReference(db: Database, mddocId: number, equationId: number) {
    try {
        db.prepare(
            'INSERT INTO equation_refs (source_mddoc_id, target_equation_id) VALUES (?, ?);',
        ).run(mddocId, equationId);
    } catch (e) {
        if (!isUniqueConstraintError(e)) {
            throw e;
        }
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
            FROM equations e INNER JOIN pages p INNER JOIN equation_refs er
            ON e.parent_page_id = p.id AND e.id = er.target_equation_id
            WHERE er.source_mddoc_id = ?`,
        )
        .all(mddocId) as (EquationReference & { slug: string })[];
    return out.map(({ id, slug, label, pathname: parentPathname }) => ({
        id,
        slug,
        label,
        pathname: `${parentPathname}#${slug}`,
    }));
}
