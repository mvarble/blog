import { Database } from 'better-sqlite3';

import { KatexMacros } from '.';
import { hasNumberField, hasStringField } from '../../plugin/typechecks';

export interface Page {
    id: number;
    pathname: string;
    filename: string;
    katexMacros: KatexMacros;
}

export function getPage(db: Database, filename: string): Page | undefined {
    const out = db.prepare('SELECT * FROM pages WHERE filename = ?;').get(filename);
    if (
        out &&
        hasNumberField(out, 'id') &&
        hasStringField(out, 'pathname') &&
        hasStringField(out, 'filename') &&
        hasStringField(out, 'katex_macros')
    ) {
        return {
            id: out.id,
            pathname: out.pathname,
            filename: out.filename,
            katexMacros: JSON.parse(out.katex_macros),
        };
    }
}
