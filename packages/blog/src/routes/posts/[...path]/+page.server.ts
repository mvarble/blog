import { error, type Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = async ({ url }) => {
    const pathname = url.pathname.slice(1, -1);
    const post = db.getPost(db.connect(), pathname);
    if (!post) {
        error(404, { message: `Post not found ${pathname}` });
    }
    return post;
};
