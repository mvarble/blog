<script lang="ts">
    import type { DocumentSummary } from '$lib/types';
    import TableOfContentsTree from './table-of-contents-tree.svelte';

    let { contents }: { contents: DocumentSummary[] } = $props();
</script>

<nav aria-label="table-of-contents">
    <ul>
        {#each contents as summary (summary.pathname)}
            <TableOfContentsTree {summary} root />
        {/each}
    </ul>
</nav>

<style>
    nav {
        top: 0;
        left: 0;
        color: var(--fg-2);
        position: relative;
    }

    ul {
        padding: 1rem;
        height: 100%;
        bottom: auto;
        width: 100%;
        margin: 0;
    }

    @media (min-width: 838px) {
        nav {
            max-height: calc(100vh - var(--nav-height));
            overflow-x: hidden;
            overflow-y: auto;
        }

        ul {
            columns: 1;
            padding-left: 1rem;
            padding-right: 0;
            padding-top: var(--page-padding-top);
            width: var(--sidebar-menu-width);
            margin: 0 0 0 auto;
        }
    }
</style>
