import { type Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = async () => {
    const conn = db.connect();
    return { posts: db.getPostInfos(conn) };
};
