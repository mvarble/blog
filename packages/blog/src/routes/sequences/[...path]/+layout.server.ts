import { error, type Load } from '@sveltejs/kit';

import { db } from 'cms';

export const load: Load = async ({ params }) => {
    const sequenceSlug = params.path!.split('/')[0];
    const conn = db.connect();
    const sequence = db.getSequence(conn, sequenceSlug);
    if (!sequence) {
        error(404, { message: `Sequence not found ${sequenceSlug}` });
    }
    return { sequence };
};
