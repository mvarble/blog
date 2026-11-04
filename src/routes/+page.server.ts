import { cms } from '$cms';
import { graphOf } from '$lib/server/graph';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
    posts: cms.posts.list(),
    sequences: cms.sequences.list(),
    graph: graphOf(),
});
