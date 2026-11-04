import type { Component } from 'svelte';
import type { PostInfo } from '$lib/cms/runtime';
import type { GraphLink, GraphNode, IndexEntry } from '@mvarble/mesearch-ui';

export interface PostInfoWithDescription extends PostInfo {
    description?: Component;
    image?: string;
}

// The map on the home page, laid out at build time.
export interface SiteGraph {
    nodes: GraphNode[];
    links: GraphLink[];
    entries: IndexEntry[];
}
