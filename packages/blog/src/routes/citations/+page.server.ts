import type { Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = () => {
    const conn = db.connect();
    return { citations: db.getCitations(conn) };
};
