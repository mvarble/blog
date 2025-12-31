import { error, type Load } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';

import { db } from 'cms';

export const entries: EntryGenerator = () => {
    const conn = db.connect();
    return db
        .getPostInfos(conn)
        .map((post) => ({ path: post.pathname.split('/').slice(1).join('/') }));
};

export const load: Load = async ({ url }) => {
    const pathname = url.pathname.slice(1, -1);
    const post = db.getPost(db.connect(), pathname);
    if (!post) {
        error(404, { message: `Post not found ${pathname}` });
    }
    return post;
};
