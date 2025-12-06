import type { Load } from '@sveltejs/kit';
import { db } from 'cms';

export const load: Load = () => {
    const conn = db.connect();
    const posts = db.getPostInfos(conn, 3);
    const sequences = db.getSequenceInfos(conn, 3);
    return { posts, sequences };
};
