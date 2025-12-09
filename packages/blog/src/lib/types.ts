import type { Component } from 'svelte';
import type { PostInfo } from 'cms';

export interface DocumentSummary {
    title: string;
    pathname: string;
    children: DocumentSummary[];
}

export function isDocumentSummary(obj: unknown): obj is DocumentSummary {
    return (
        obj &&
        typeof obj == 'object' &&
        'title' in obj &&
        typeof obj.title == 'string' &&
        'pathname' in obj &&
        typeof obj.pathname == 'string' &&
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
