import { type Load } from '@sveltejs/kit';

import { cms } from '$cms';

export const load: Load = async () => {
    return { posts: cms.posts.list() };
};
