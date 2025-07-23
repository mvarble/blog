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
    let id: number;
    try {
        const out = db
            .prepare(
                `INSERT INTO citations (${fields.join(', ')})
                VALUES (${fields.map(() => '?').join(', ')}) RETURNING id;`,
            )
            .get(...fields.map((field) => citation[field]));
        id = (out as { id: number }).id;
        db.prepare(
            `INSERT INTO citation_authors (citation_id, item, lastname, fullname)
            VALUES ${citation.authors.map(() => '(?, ?, ?, ?)').join(', ')};`,
        ).run(
            ...citation.authors.flatMap((author, i) => [id, i, author.lastname, author.fullname]),
        );
    } catch (e) {
        if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
            const out = db
                .prepare(
                    `UPDATE citations SET
                    ${fields
                        .slice(1)
                        .map((field) => `${field} = ?`)
                        .join(', ')}
                    WHERE key = ? RETURNING id;`,
                )
                .get(...fields.slice(1).map((field) => citation[field]), citation.key);
            id = (out as { id: number }).id;
            db.prepare('DELETE FROM citation_authors WHERE citation_id = ?').run(id);
            db.prepare(
                `INSERT INTO citation_authors (citation_id, item, lastname, fullname)
                VALUES ${citation.authors.map(() => '(?, ?, ?, ?)').join(', ')};`,
            ).run(
                ...citation.authors.flatMap((author, i) => [
                    id,
                    i,
                    author.lastname,
                    author.fullname,
                ]),
            );
        } else {
            throw e;
        }
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
