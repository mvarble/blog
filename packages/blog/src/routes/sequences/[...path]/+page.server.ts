import { error, type Load } from '@sveltejs/kit';
import type { EntryGenerator } from './$types';

import type { Sequence, SequenceChild } from '@mvarble/mesearch-cms/presets/blog';
import { inlineHtml } from '@mvarble/mesearch-ui/server';
import { cms } from '$cms';
import { tocOf, trackOf, url } from '$lib/server/pages';

export const entries: EntryGenerator = () => {
    return cms.sequences
        .list()
        .map((sequence) => ({ path: sequence.pathname.split('/').slice(1).join('/') }));
};

export const load: Load = async ({ url: { pathname: path }, parent }) => {
    const { sequence } = (await parent()) as { sequence: Sequence };

    const pathname = path.slice(1, -1);
    const filename = cms.pages.get(pathname)?.filename;
    if (!filename) {
        error(404, { message: `Not found ${pathname}` });
    }

    // The sequence's pages in reading order: its own page, then every chapter
    // and section, depth first.
    const order: Array<Sequence | SequenceChild> = [sequence];
    const walk = (children: SequenceChild[]) =>
        children.forEach((child) => {
            order.push(child);
            walk(child.children);
        });
    walk(sequence.children);
    const at = order.findIndex((page) => page.filename == filename);
    if (at < 0) {
        error(500, {
            message: `The filename '${filename}' is expected to be in sequence ${sequence.title}`,
        });
    }
    const self = order[at]!;
    const stop = (page: Sequence | SequenceChild | undefined) =>
        page && {
            url: url(page.pathname),
            titleHtml: inlineHtml(
                page.label ? `${page.label}. ${page.title}` : page.title,
                page.katexMacros,
            ),
        };

    return {
        filename,
        root: at == 0,
        title: self.label ? `${self.label}. ${self.title}` : self.title,
        titleHtml: stop(self)!.titleHtml,
        sequenceTitle: sequence.title,
        sequenceTitleHtml: inlineHtml(sequence.title, sequence.katexMacros),
        sequenceUrl: url(sequence.pathname),
        created: sequence.created,
        edited: sequence.edited,
        tags: sequence.tags,
        track: trackOf(sequence.children),
        toc: tocOf(filename, self.katexMacros),
        previous: stop(order[at - 1]),
        next: stop(order[at + 1]),
        position: { index: at, count: order.length },
    };
};
