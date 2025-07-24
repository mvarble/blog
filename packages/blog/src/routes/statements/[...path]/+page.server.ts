import { dev } from '$app/environment';
import { error, type Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = async ({ url }) => {
    // connect to database
    const conn = db.connect();

    // get the filename from the pathname
    const pathname = url.pathname.slice(1, -1);
    const filename = db.getPageFilename(db.connect(), pathname);
    if (!filename) {
        error(404, { message: `Not found ${pathname}` });
    }

    // get the statement from the filename
    const statement = db.getStatementFromFilename(conn, filename);
    if (!statement) {
        if (dev) {
            error(500, {
                message: `Page found for ${pathname} but no matching statement. This should never happen.`,
            });
        } else {
            error(404, { message: `Not found ${pathname}` });
        }
    }

    // get the statement's parent's pathname
    const parentPathname = db.getStatementParentPathname(conn, filename);
    if (!parentPathname) {
        if (dev) {
            error(500, {
                message: `Page found for ${pathname} but no matching parent. This should never happen.`,
            });
        } else {
            error(404, { message: `Not found ${pathname}` });
        }
    }

    return { filename, statement, parentPathname };
};
