import bibtex from 'bibtex';

import { type FileHooks } from '.';
import { touchCitation } from '../../db';

const hooks: FileHooks = {
    initialize(db, _filename, _frontmatter, contents) {
        const bibFile = bibtex.parseBibFile(contents);
        Object.entries(bibFile.entries$).forEach(([key, entry]) => {
            touchCitation(db, {
                kind: entry.type,
                key,
                title: entry.getFieldAsString('title') as string,
                year: entry.getFieldAsString('year') as string,
                doi: entry.getFieldAsString('doi') as string | undefined,
                publisher: entry.getFieldAsString('publisher') as string | undefined,
                issn: entry.getFieldAsString('issn') as string | undefined,
                isbn: entry.getFieldAsString('isbn') as string | undefined,
                journal: entry.getFieldAsString('journal') as string | undefined,
                number: entry.getFieldAsString('number') as string | undefined,
                pages: entry.getFieldAsString('pages') as string | undefined,
                volume: entry.getFieldAsString('volume') as string | undefined,
                institution: entry.getFieldAsString('institution') as string | undefined,
                edition: entry.getFieldAsString('edition') as string | undefined,
                url: entry.getFieldAsString('url') as string | undefined,
                series: entry.getFieldAsString('series') as string | undefined,
                authors: entry.getAuthors()!.authors$.map((author) => ({
                    lastname: String(author.lastNames$.at(-1)),
                    fullname: fullname(author),
                })),
            });
        });
    },
};

function fullname(name: bibtex.AuthorName): string {
    let out = name.firstNames.join(' ');
    out = append(out, name.vons.join(' '));
    out = append(out, name.lastNames.join(' '));
    out = append(out, name.jrs.join(' '));
    return out;
}

function append(str: string, add: string): string {
    return `${str.trim()} ${add.trim()}`;
}

export default hooks;
