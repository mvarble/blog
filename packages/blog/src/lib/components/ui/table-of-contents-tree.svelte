<script lang="ts">
    import { page } from '$app/state';

    import { type DocumentSummary, summaryHref } from '$lib/types';
    import Self from './table-of-contents-tree.svelte';

    let { summary, root = false }: { summary: DocumentSummary; root?: boolean } = $props();
</script>

<li>
    <a
        class:root
        class:section={!!summary.anchor}
        aria-current={!summary.anchor && `/${summary.pathname}/` == page.url.pathname
            ? 'page'
            : undefined}
        href={summaryHref(summary)}
    >
        {summary.title}
    </a>
    <ul>
        {#each summary.children as child (summaryHref(child))}
            <Self summary={child} />
        {/each}
    </ul>
</li>

<style>
    li {
        position: relative;
        display: block;
        margin: 0;
        padding-right: 0.5rem; /* leave space for focus ring */
    }

    li:last-child {
        margin-bottom: 0;
    }

    a {
        position: relative;
        transition: color 0.2s;
        border-bottom: none;
        padding: 0;
        color: inherit;
        user-select: none;
        display: block;
        font: var(--font-ui-medium);

        &.root {
            font-weight: 500;
        }

        /* A heading inside the page being read, rather than another page. */
        &.section {
            color: var(--fg-3);
        }
    }

    [aria-current='page'] {
        color: var(--fg-accent);
        text-decoration: underline;
    }

    @media (min-width: 838px) {
        :global(.scrollbars-invisible) li:has(> [aria-current='page'])::after {
            --size: 1.8rem;
            content: '';
            position: absolute;
            width: var(--size);
            height: var(--size);
            top: calc(1.4rem - var(--size) * 0.5);
            right: calc(-0.5rem - 0.5 * var(--size));
            background-color: var(--bg-1);
            z-index: 2;
            position: absolute;
            rotate: 45deg;
            box-shadow: 0 0 3px rgba(0, 0, 0, 0.12);
        }
    }
</style>
