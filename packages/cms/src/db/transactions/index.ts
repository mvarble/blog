export interface KatexMacros {
    [macro: string]: string;
}

export * from './citations';
export * from './page_references';
export * from './pages';
export * from './posts';
export * from './sequences';
export * from './statement_dependencies';
export * from './statements';
export * from './tag_references';
export * from './tags';

import { type Database } from '../types';
import { getStatementParentFilename } from './statements';
import { getParentSequenceFilename } from './sequences';

export function getRootDescendant(db: Database, filename: string): string {
    const statementParentFilename = getStatementParentFilename(db, filename);
    if (statementParentFilename) {
        return getRootDescendant(db, statementParentFilename);
    }
    const sequenceFilename = getParentSequenceFilename(db, filename);
    if (sequenceFilename) {
        return getRootDescendant(db, sequenceFilename);
    }
    return filename;
}
