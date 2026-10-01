import {
    citationLabel,
    type OutlineEntry,
    type SequenceChild,
} from '@mvarble/mesearch-cms/presets/blog/runtime';
import type { KatexMacros } from '@mvarble/mesearch-markdown/katex';
import type { Reference, TocEntry, TrackItem } from '@mvarble/mesearch-ui';
import { inlineHtml, referenceHtml } from '@mvarble/mesearch-ui/server';
import { cms } from '$cms';

// What the routes hand the components: titles as HTML and every link a URL.
// `trailingSlash` is `always`, so every URL ends in one; a link without it is
// a redirect, and a fragment is not worth trusting to survive that.

export const url = (pathname: string) => `/${pathname}/`;

// A page's headings, as its table of contents.
export function tocOf(filename: string, macros: KatexMacros = {}): TocEntry[] {
    const toEntry = (entry: OutlineEntry): TocEntry => ({
        slug: entry.slug,
        titleHtml: inlineHtml(entry.title, macros),
        depth: entry.depth,
        children: entry.children.map(toEntry),
    });
    return cms.outline(filename).map(toEntry);
}

// A sequence's pages, as the stops on its track.
export const trackOf = (children: SequenceChild[]): TrackItem[] =>
    children.map((child) => ({
        key: child.filename,
        url: url(child.pathname),
        titleHtml: inlineHtml(child.title, child.katexMacros),
        label: child.label,
        children: child.children.length ? trackOf(child.children) : undefined,
    }));

// What a page cites, for the list at its end. A `cite:key` link on the page
// jumps to `#cite:key`.
export const referencesOf = (pathname: string, macros: KatexMacros = {}): Reference[] =>
    cms.bibliography(pathname).map((citation) => ({
        id: `cite:${citation.key}`,
        label: citationLabel(citation),
        html: referenceHtml(citation, macros),
    }));
