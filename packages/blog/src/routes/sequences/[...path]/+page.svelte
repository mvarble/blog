<script lang="ts">
    import type { Component } from 'svelte';
    import type { Sequence, SequenceChild } from 'cms';

    import Controls from '$lib/components/ui/controls.svelte';
    import type { DocumentSummary, SequencePage } from '$lib/types';
    import tableOfContentsStore from './table-of-contents';

    interface Data {
        filename: string;
        sequence: Sequence;
        component: Component;
        prev?: SequencePage;
        self: SequencePage;
        next?: SequencePage;
    }
    let { data }: { data: Data } = $props();

    function toControl(page?: SequencePage): { title: string; path: string } | null {
        return page ? { title: page.title, path: `/${page.pathname}` } : null;
    }

    let prev = $derived(toControl(data.prev));
    let next = $derived(toControl(data.next));

    function toTableOfContents(sequence: Sequence): DocumentSummary[] {
        const summary: DocumentSummary[] = [];
        summary.push({
            title: sequence.title,
            pathname: sequence.pathname,
            children: [],
        });

        function toDocumentSummary(child: SequenceChild): DocumentSummary {
            return {
                title: child.title,
                pathname: child.pathname,
                children: child.children ? child.children.map(toDocumentSummary) : [],
            };
        }

        if (sequence.children) {
            summary.push(...sequence.children.map(toDocumentSummary));
        }

        return summary;
    }

    let tableOfContents = $derived(toTableOfContents(data.sequence));
    $effect(() => {
        tableOfContentsStore.set(tableOfContents);
    });
</script>

<h1>{data.self.label ? `${data.self.label}. ${data.self.title}` : data.self.title}</h1>

<div>
    <data.component />
</div>

<Controls {prev} {next} />

<style>
    div {
        padding-bottom: 2em;
        border-bottom: 1px solid var(--border);
    }
</style>
