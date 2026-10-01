import type { Load } from '@sveltejs/kit';
import { cms } from '$cms';

export const load: Load = () => {
    const posts = cms.posts.list({ limit: 3 });
    const sequences = cms.sequences.list({ limit: 3 });
    return { posts, sequences };
};
