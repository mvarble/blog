import type { Sequence, SequenceChild } from '@mvarble/mesearch-cms/presets/blog/runtime';
import type { DocumentRef, GraphLink, IndexEntry } from '@mvarble/mesearch-ui';
import { inlineHtml, layoutGraph } from '@mvarble/mesearch-ui/server';
import { cms } from '$cms';
import type { SiteGraph } from '$lib/types';

import { describe, url } from './pages';

// The map on the home page: every post, every sequence and every chapter of a
// sequence. Solid arrows run from a sequence to its chapters; dashed lines
// join pages that refer to one another, by a link or to an equation or
// statement on the other page. A section is not drawn: what it refers to,
// and what refers to it, counts for its chapter, and the chapter's preview
// lists it.
export function graphOf(): SiteGraph {
    const entries: IndexEntry[] = [];
    const links: GraphLink[] = [];
    // The node standing for each page: its own, or its chapter's.
    const nodeOf = new Map<string, string>();
    const add = (entry: Omit<IndexEntry, 'url' | 'titleHtml' | 'summaryHtml'>, macros = {}) => {
        nodeOf.set(entry.key, entry.key);
        entries.push({
            ...entry,
            url: url(entry.key),
            titleHtml: inlineHtml(entry.title, macros),
            summaryHtml: inlineHtml(entry.summary, macros),
        });
    };

    for (const { pathname } of cms.posts.list()) {
        const post = cms.posts.get(pathname)!;
        add(
            {
                key: post.pathname,
                kind: 'post',
                title: post.title,
                summary: describe(post.descriptionFilename),
                created: post.created,
                updated: post.edited,
            },
            post.katexMacros,
        );
    }

    for (const { pathname } of cms.sequences.list()) {
        const sequence = cms.sequences.get(pathname.split('/')[1]!)!;
        add(
            {
                key: sequence.pathname,
                kind: 'sequence',
                title: sequence.title,
                summary: describe(sequence.descriptionFilename),
                created: sequence.created,
                updated: sequence.edited,
            },
            sequence.katexMacros,
        );
        for (const chapter of sequence.children) {
            add(
                {
                    key: chapter.pathname,
                    kind: 'chapter',
                    title: chapter.label ? `${chapter.label}. ${chapter.title}` : chapter.title,
                    summary: placeOf(chapter, sequence),
                    created: sequence.created,
                    updated: sequence.edited,
                },
                chapter.katexMacros,
            );
            links.push({ from: sequence.pathname, to: chapter.pathname, style: 'solid' });
            const sections = (children: SequenceChild[]) =>
                children.forEach((section) => {
                    nodeOf.set(section.pathname, chapter.pathname);
                    sections(section.children);
                });
            sections(chapter.children);
        }
    }

    // One dashed line per pair of nodes, and none alongside an arrow.
    const pair = (a: string, b: string) => [a, b].sort().join('\0');
    const joined = new Set(links.map((link) => pair(link.from, link.to)));
    for (const link of cms.links()) {
        const from = nodeOf.get(link.from);
        const to = nodeOf.get(link.to);
        if (!from || !to || from == to || joined.has(pair(from, to))) continue;
        joined.add(pair(from, to));
        links.push({ from, to, style: 'dashed' });
    }

    const documents: Array<DocumentRef & { sequenced?: boolean }> = entries;
    return { nodes: layoutGraph(documents, links, TUNING), links, entries };
}

// Each sequence and each lone post is a cluster of its own. A stronger pull
// to the middle keeps them near enough to fill the map, and a stronger push
// between nodes keeps a sequence's chapters from crowding.
const TUNING = { charge: -1500, linkDistance: 110, gravity: 0.09 };

// Where a chapter sits, and what is in it, for the map's preview of it.
function placeOf(chapter: SequenceChild, sequence: Sequence): string {
    const where = !chapter.label
        ? `Part of ${sequence.title}`
        : `${chapter.appendix ? 'Appendix' : 'Chapter'} ${chapter.label} of ${sequence.title}`;
    const sections = chapter.children.map((section) => section.title);
    if (!sections.length) return `${where}.`;
    const list =
        sections.length == 1
            ? sections[0]
            : `${sections.slice(0, -1).join(', ')} and ${sections.at(-1)}`;
    return `${where}, with ${sections.length == 1 ? 'a section' : 'sections'} on ${list}.`;
}
