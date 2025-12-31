import { error, type Load } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';

import { db, type Sequence, type SequenceChild } from 'cms';
import type { SequencePage } from '$lib/types';
import type { DocumentSummary } from '$lib/types';

export const entries: EntryGenerator = () => {
    const conn = db.connect();
    return db
        .getSequenceInfos(conn)
        .map((sequence) => ({ path: sequence.pathname.split('/').slice(1).join('/') }));
};

export const load: Load = async (req) => {
    const { url, parent } = req;
    const { sequence } = await parent();

    // get the filename from the pathname
    const pathname = url.pathname.slice(1, -1);
    const conn = db.connect();
    const filename = db.getPageFilename(conn, pathname);
    if (!filename) {
        error(404, { message: `Not found ${pathname}` });
    }

    // prepare the page data
    return {
        filename,
        contents: toTableOfContents(sequence),
        ...findSiblings(sequence, filename),
    };
};

function toTableOfContents(sequence: Sequence): DocumentSummary[] {
    const summary: DocumentSummary[] = [];
    summary.push({
        title: sequence.title,
        pathname: sequence.pathname,
        children: [],
    });

    function toDocumentSummary(child: SequenceChild): DocumentSummary {
        return {
            title: child.title,
            pathname: child.pathname,
            children: child.children ? child.children.map(toDocumentSummary) : [],
        };
    }

    if (sequence.children) {
        summary.push(...sequence.children.map(toDocumentSummary));
    }

    return summary;
}

function toSequencePage({ title, pathname, label }: Sequence | SequenceChild): SequencePage {
    return { title, pathname, label };
}

function findSiblings(
    sequence: Sequence,
    filename: string,
): { prev?: SequencePage; self: SequencePage; next?: SequencePage } {
    let prev: SequencePage | undefined = undefined;
    let current: SequencePage = toSequencePage(sequence);
    let self: SequencePage | undefined =
        sequence.filename == filename ? toSequencePage(sequence) : undefined;

    const descendants: SequenceChild[] = sequence.children ? sequence.children.toReversed() : [];
    while (descendants.length != 0) {
        const descendant = descendants.pop()!;
        if (self) {
            return {
                prev,
                self,
                next: toSequencePage(descendant),
            };
        }
        prev = current;
        current = toSequencePage(descendant);
        if (descendant.filename == filename) {
            self = current;
        }
        if (descendant.children) {
            descendants.push(...descendant.children.toReversed());
        }
    }
    if (self) {
        return { prev, self };
    }

    error(500, {
        message: `The filename '${filename}' is expected to be in sequence ${sequence.title}`,
    });
}
