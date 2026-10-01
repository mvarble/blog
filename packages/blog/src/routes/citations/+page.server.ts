import type { Load } from '@sveltejs/kit';

import { inlineHtml } from '@mvarble/mesearch-ui/server';
import { cms } from '$cms';

export const load: Load = () => {
    return {
        citations: cms.citations
            .list()
            .map((citation) => ({ ...citation, titleHtml: inlineHtml(citation.title) })),
    };
};
