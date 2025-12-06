import type { Load } from '@sveltejs/kit';
import type { PostInfo } from 'cms';
import type { PostInfoWithDescription } from '$lib/types';

import { getComponent, getImg } from '$lib/load';

export const load: Load = async ({ data }) => {
    const d = data as { sequences: PostInfo[] };
    const sequences: PostInfoWithDescription[] = [];
    for (const sequence of d.sequences) {
        sequences.push({
            ...sequence,
            description: sequence.descriptionFilename
                ? await getComponent(sequence.descriptionFilename)
                : undefined,
            image: sequence.imageFilename ? await getImg(sequence.imageFilename) : undefined,
        });
    }
    return {
        sequences,
    };
};
