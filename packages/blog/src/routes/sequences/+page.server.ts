import { type Load } from '@sveltejs/kit';

import { cms } from '$cms';

export const load: Load = async () => {
    return { sequences: cms.sequences.list() };
};
