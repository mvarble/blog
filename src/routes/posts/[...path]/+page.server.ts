import { error, type Load } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';

import { inlineHtml } from '@mvarble/mesearch-ui/server';
import { cms } from '$cms';
import { referencesOf, tocOf } from '$lib/server/pages';

export const entries: EntryGenerator = () => {
    return cms.posts.list().map((post) => ({ path: post.pathname.split('/').slice(1).join('/') }));
};

export const load: Load = async ({ url }) => {
    const pathname = url.pathname.slice(1, -1);
    const post = cms.posts.get(pathname);
    if (!post) {
        error(404, { message: `Post not found ${pathname}` });
    }
    return {
        filename: post.filename,
        title: post.title,
        titleHtml: inlineHtml(post.title, post.katexMacros),
        created: post.created,
        edited: post.edited,
        tags: post.tags,
        toc: tocOf(post.filename, post.katexMacros),
        references: referencesOf(post.pathname, post.katexMacros),
    };
};
