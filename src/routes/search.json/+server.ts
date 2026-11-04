import { json } from '@sveltejs/kit';
import type { SequenceChild } from '@mvarble/mesearch-cms/presets/blog';
import type { SearchEntry } from '@mvarble/mesearch-ui';
import { cms } from '$cms';
import { describe, url } from '$lib/server/pages';

export const prerender = true;

// Everything the search palette can find: each post, each sequence, and each
// page of a sequence, with their sections. Fetched the first time the palette
// opens.
export const GET = () => {
    const entries: SearchEntry[] = [];
    const add = (
        kind: string,
        page: { title: string; pathname: string; filename: string },
        summary = '',
    ) =>
        entries.push({
            key: page.filename,
            kind,
            url: url(page.pathname),
            title: page.title,
            summary,
            headings: cms.headings(page.filename).map(({ title, slug }) => ({ title, slug })),
        });

    for (const { pathname } of cms.posts.list()) {
        const post = cms.posts.get(pathname)!;
        add('post', post, describe(post.descriptionFilename));
    }
    const pages = (children: SequenceChild[]): void =>
        children.forEach((child) => {
            add('page', child);
            pages(child.children);
        });
    for (const { pathname } of cms.sequences.list()) {
        const sequence = cms.sequences.get(pathname.split('/')[1]!)!;
        add('sequence', sequence, describe(sequence.descriptionFilename));
        pages(sequence.children);
    }
    return json(entries);
};
