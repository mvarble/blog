import type { Load } from '@sveltejs/kit';

import { cms } from '$cms';

export const load: Load = () => {
    return { citations: cms.citations.list() };
};
