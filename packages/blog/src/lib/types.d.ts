import type { Component } from 'svelte';
import type { PostInfo } from 'cms';

export interface NavigationLink {
    title: string;
    slug: string;
    sections?: {
        title: string;
        path?: string;
        sections: {
            title: string;
            path?: string;
            sections: {
                title: string;
                path: string;
                badge?: string;
            }[];
        }[];
    }[];
}

export interface DocumentSummary {
    title: string;
    pathname: string;
    children: DocumentSummary[];
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
