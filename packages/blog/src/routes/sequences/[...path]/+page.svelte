<script lang="ts">
    import type { Sequence } from 'cms';
    import type { SequencePage } from './proxy+page.server';
    import type { Component } from 'svelte';

    import Controls from '$lib/components/ui/controls.svelte';

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
