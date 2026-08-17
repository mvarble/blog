import { type Database, getPage } from '../../db';
import { edgeParser } from '../parsers';
import { hasStringField } from '../../util';

import post from './posts';
import sequence from './sequences';
import statement from './statements';
import bibtex from './bibtex';

// A document declares what it is with a `type` field in its frontmatter, and
// each type registers itself in two passes.
//
// The split exists because a reference can only be recorded once the thing it
// points at is known: every document contributes its own nodes first, and only
// then is any document asked to resolve what it mentions. That makes the result
// independent of the order documents happen to be visited.
export interface FileHooks {
    // Pass one: what this document contributes -- pages, statements, equations.
    initialize?(
        db: Database,
        filename: string,
        frontmatter: Record<'type', string>,
        contents: string,
    ): void;
    // Pass two: what this document points at. Every node already exists.
    crossReference?(
        db: Database,
        filename: string,
        frontmatter: Record<'type', string>,
        contents: string,
    ): void;
}

const HOOKS: { [type: string]: FileHooks } = {
    post,
    sequence,
    statement,
    bibtex,
};

function hooksFor(frontmatter: object & {}): FileHooks | undefined {
    if (!hasStringField(frontmatter, 'type')) return undefined;
    return HOOKS[frontmatter.type];
}

export function initializeDocument(
    db: Database,
    filename: string,
    frontmatter: object & {},
    contents: string,
) {
    hooksFor(frontmatter)?.initialize?.(
        db,
        filename,
        frontmatter as Record<'type', string>,
        contents,
    );
}

export function crossReferenceDocument(
    db: Database,
    filename: string,
    frontmatter: object & {},
    contents: string,
) {
    const hooks = hooksFor(frontmatter);
    if (hooks?.crossReference) {
        hooks.crossReference(db, filename, frontmatter as Record<'type', string>, contents);
        return;
    }
    // Anything that is itself a page -- a sequence page has no `type` of its
    // own -- still gets its references resolved.
    defaultCrossReference(db, filename, contents);
}

export function defaultCrossReference(db: Database, filename: string, contents: string) {
    const page = getPage(db, filename);
    if (!page) return;
    edgeParser(
        db,
        {
            mddocId: page.mddocId,
            root: page.root,
            relevantPageId: page.id,
            pathname: page.pathname,
            filename,
        },
        contents,
    );
}
