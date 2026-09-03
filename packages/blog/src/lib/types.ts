import type { Component } from 'svelte';
import type { PostInfo } from 'cms';

export interface DocumentSummary {
    title: string;
    pathname: string;
    // A section within `pathname`, rather than the page itself. Set for the
    // headings of the page currently being read.
    anchor?: string;
    children: DocumentSummary[];
}

// What a summary links to, and what distinguishes it from its siblings.
//
// The trailing slash matters: `trailingSlash` is `always`, so a link without
// one is a redirect, and a fragment is not worth trusting to survive that.
export function summaryHref(summary: DocumentSummary): string {
    return summary.anchor ? `/${summary.pathname}/#${summary.anchor}` : `/${summary.pathname}`;
}

export function isDocumentSummary(obj: unknown): obj is DocumentSummary {
    return (
        !!obj &&
        typeof obj == 'object' &&
        'title' in obj &&
        typeof obj.title == 'string' &&
        'pathname' in obj &&
        typeof obj.pathname == 'string' &&
        (!('anchor' in obj) || typeof obj.anchor == 'string' || obj.anchor === undefined) &&
        'children' in obj &&
        Array.isArray(obj.children) &&
        obj.children.every(isDocumentSummary)
    );
}

export interface SequencePage {
    label?: string;
    title: string;
    pathname: string;
}

export interface PostInfoWithDescription extends PostInfo {
    description?: Component;
    image?: string;
}
