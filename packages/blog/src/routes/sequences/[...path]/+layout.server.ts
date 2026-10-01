import { error, type Load } from '@sveltejs/kit';

import { cms } from '$cms';

export const load: Load = async ({ params }) => {
    const sequenceSlug = params.path!.split('/')[0]!;
    const sequence = cms.sequences.get(sequenceSlug);
    if (!sequence) {
        error(404, { message: `Sequence not found ${sequenceSlug}` });
    }
    return { sequence };
};
