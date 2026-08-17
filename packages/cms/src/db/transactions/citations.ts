import { type Database } from '..';

export interface CitationAuthor {
    lastname: string;
    fullname: string;
}

export interface TouchCitation {
    key: string;
    kind: string;
    title: string;
    year: string;
    doi?: string;
    publisher?: string;
    issn?: string;
    isbn?: string;
    journal?: string;
    number?: string;
    pages?: string;
    volume?: string;
    institution?: string;
    edition?: string;
    url?: string;
    series?: string;
    authors: CitationAuthor[];
}

export interface Citation extends TouchCitation {
    id: number;
}

export function touchCitation(db: Database, citation: TouchCitation): Citation {
    const fields: (keyof TouchCitation)[] = [
        'key',
        'kind',
        'doi',
        'title',
        'year',
        'publisher',
        'issn',
        'isbn',
        'journal',
        'number',
        'pages',
        'volume',
        'institution',
        'edition',
        'url',
        'series',
    ];
    const out = db
        .prepare(
            `INSERT INTO citations (${fields.join(', ')})
            VALUES (${fields.map(() => '?').join(', ')})
            ON CONFLICT (key) DO UPDATE SET
                ${fields
                    .slice(1)
                    .map((field) => `${field} = excluded.${field}`)
                    .join(', ')}
            RETURNING id;`,
        )
        .get(...fields.map((field) => citation[field]));
    const id = (out as { id: number }).id;

    db.prepare('DELETE FROM citation_authors WHERE citation_id = ?;').run(id);
    if (citation.authors.length) {
        db.prepare(
            `INSERT INTO citation_authors (citation_id, item, lastname, fullname)
            VALUES ${citation.authors.map(() => '(?, ?, ?, ?)').join(', ')};`,
        ).run(
            ...citation.authors.flatMap((author, i) => [id, i, author.lastname, author.fullname]),
        );
    }
    return {
        id,
        ...citation,
    };
}

export function getCitations(db: Database): Citation[] {
    const citationsNoAuthors = db.prepare('SELECT * FROM citations;').all() as Citation[];
    const citations: Record<number, Citation> = Object.fromEntries(
        citationsNoAuthors.map((citation) => [
            citation.id,
            {
                ...citation,
                authors: [],
            },
        ]),
    );
    const authors = db
        .prepare('SELECT * from citation_authors ORDER BY item DESC;')
        .all() as (CitationAuthor & {
            item: number;
            citation_id: number;
        })[];
    while (authors.length) {
        const author = authors.pop()!;
        citations[author.citation_id].authors.push({
            lastname: author.lastname,
            fullname: author.fullname,
        });
    }
    return Object.values(citations);
}

export function touchCitationReference(db: Database, mddocId: number, key: string): boolean {
    const out = db
        .prepare(
            `INSERT OR IGNORE INTO citation_refs (source_mddoc_id, target_citation_id)
            SELECT ?, id FROM citations WHERE key = ?;`,
        )
        .run(mddocId, key);
    if (out.changes > 0) return true;
    // Already recorded on an earlier mention in the same document.
    return (
        db
            .prepare(
                `SELECT 1 AS ok FROM citation_refs cr
                INNER JOIN citations c ON cr.target_citation_id = c.id
                WHERE cr.source_mddoc_id = ? AND c.key = ?;`,
            )
            .get(mddocId, key) != undefined
    );
}

export interface CitationReference {
    id: number;
    key: string;
    label: string;
    pathname: string;
}

export function getCitationReferences(db: Database, mddocId: number): CitationReference[] {
    interface Select {
        id: number;
        key: string;
        year: number;
        lastname: string;
    }
    const citations = db
        .prepare(
            `SELECT c.id, c.key, c.year, ca.lastname
            FROM citations c
            INNER JOIN citation_refs cr ON c.id = cr.target_citation_id
            LEFT JOIN citation_authors ca ON c.id = ca.citation_id
            WHERE cr.source_mddoc_id = ?
            AND ca.item = (
                SELECT MIN(item)
                FROM citation_authors
                WHERE citation_authors.citation_id = c.id
            )`,
        )
        .all(mddocId) as Select[];

    return citations.map(({ id, key, year, lastname }) => ({
        id,
        key,
        label: `${lastname.slice(0, 4)}${String(year).slice(-2)}`,
        pathname: `/citations#${key}`,
    }));
}
