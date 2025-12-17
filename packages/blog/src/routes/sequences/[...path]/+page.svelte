<script lang="ts">
    import type { PageProps } from './$types';

    import Controls from '$lib/components/ui/controls.svelte';
    import type { SequencePage } from '$lib/types';

    let { data }: PageProps = $props();

    function toControl(page?: SequencePage): { title: string; path: string } | null {
        return page ? { title: page.title, path: `/${page.pathname}` } : null;
    }

    let prev = $derived(toControl(data.prev));
    let next = $derived(toControl(data.next));
</script>

<svelte:head>
    <title>{data.self.title} | rodent.club</title>
</svelte:head>
<h1>{data.self.label ? `${data.self.label}. ${data.self.title}` : data.self.title}</h1>

<div>
    <data.component />
</div>

<Controls {prev} {next} />

<style>
    h1 {
        text-decoration: underline;
        font: 500 calc(1.25 * var(--font-size-h1)) / 1.2 var(--font-family-heading);
    }

    @media screen and (min-width: 838px) {
        h1 {
            --font-size-h1: 2.3rem;
        }
    }

    div {
        padding-bottom: 2em;
        border-bottom: 1px solid var(--border);
    }
</style>
