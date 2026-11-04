import type { Component } from 'svelte';
import type { PostInfoWithDescription } from '$lib/types';

import { getComponent, getImg } from '$lib/load';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data: d }) => {
    const posts: PostInfoWithDescription[] = [];
    const sequences: PostInfoWithDescription[] = [];
    for (const post of d.posts) {
        posts.push({
            ...post,
            description: post.descriptionFilename
                ? await getComponent(post.descriptionFilename)
                : undefined,
            image: post.imageFilename ? await getImg(post.imageFilename) : undefined,
        });
    }
    for (const sequence of d.sequences) {
        sequences.push({
            ...sequence,
            description: sequence.descriptionFilename
                ? await getComponent(sequence.descriptionFilename)
                : undefined,
            image: sequence.imageFilename ? await getImg(sequence.imageFilename) : undefined,
        });
    }
    // The map's preview of a post or a sequence is its description.
    const descriptions: Record<string, Component> = {};
    for (const entry of [...posts, ...sequences]) {
        if (entry.description) descriptions[entry.pathname] = entry.description;
    }
    return {
        ...d,
        posts,
        sequences,
        descriptions,
    };
};
