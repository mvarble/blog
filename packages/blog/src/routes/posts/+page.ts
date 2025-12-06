import type { Load } from '@sveltejs/kit';
import type { PostInfo } from 'cms';
import type { PostInfoWithDescription } from '$lib/types';

import { getComponent, getImg } from '$lib/load';

export const load: Load = async ({ data }) => {
    const d = data as { posts: PostInfo[] };
    const posts: PostInfoWithDescription[] = [];
    for (const post of d.posts) {
        posts.push({
            ...post,
            description: post.descriptionFilename
                ? await getComponent(post.descriptionFilename)
                : undefined,
            image: post.imageFilename ? await getImg(post.imageFilename) : undefined,
        });
    }
    return {
        posts,
    };
};
