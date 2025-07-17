import { error, type Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = async ({ url }) => {
    const pathname = url.pathname.slice(1, -1);
    const filename = db.getPageFilename(db.connect(), pathname);
    if (!filename) {
        error(404, { message: `Not found ${pathname}` });
    }
    return { filename };
};
