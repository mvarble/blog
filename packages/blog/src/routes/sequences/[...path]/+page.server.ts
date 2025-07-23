import { dev } from '$app/environment';
import { error, type Load } from '@sveltejs/kit';

import { db, type SequenceChild } from 'cms';

export const load: Load = async ({ url }) => {
    // connect to database
    const conn = db.connect();

    // get the filename from that pathname
    const pathname = url.pathname.slice(1, -1);
    const filename = db.getPageFilename(conn, pathname);
    if (!filename) {
        error(404, { message: `Not found ${pathname}` });
    }

    // get the sequence from the filename
    const sequence = db.getSequence(conn, filename);
    if (!sequence) {
        if (dev) {
            error(500, {
                message: `Page found for ${pathname} but no matching sequence. This should never happen`,
            });
        } else {
            error(404, { message: `Not found ${pathname}` });
        }
    }

    // get the index within the parent sequence
    const next = findNext(sequence, filename);

    return { filename, sequence, next };
};

function findNext(
    child: SequenceChild,
    filename: string,
    data: { found: boolean } = { found: false },
): SequenceChild | undefined {
    if (data.found) return child;
    if (child.filename == filename) data.found = true;
    for (const grandchild of child.children || []) {
        const next = findNext(grandchild, filename, data);
        if (next) return next;
    }
}
