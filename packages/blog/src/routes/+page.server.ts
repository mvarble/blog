import type { Load } from '@sveltejs/kit';
import { db } from 'cms';

export const load: Load = () => {
    const conn = db.connect();
    const posts = db.getPostInfos(conn);
    const sequences = db.getSequenceInfos(conn);
    return { posts, sequences };
};
