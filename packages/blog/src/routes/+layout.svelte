<script lang="ts">
    import '../styles/index.css';

    import { page } from '$app/state';

    import Shell from '$lib/components/ui/shell.svelte';
    import Nav from '$lib/components/ui/nav.svelte';
    import { type DocumentSummary, isDocumentSummary } from '$lib/types';

    let { children } = $props();

    let contents = $derived(checkContents(page.data.contents));
    function checkContents(contents: unknown): DocumentSummary[] {
        if (!Array.isArray(contents)) {
            return [];
        }
        if (!contents.every(isDocumentSummary)) {
            console.error('Contents are not correct schema.', contents);
            return [];
        }
        return contents;
    }
</script>

{#snippet top_nav()}
    <Nav
        links={[
            { title: 'Posts', pathname: 'posts' },
            { title: 'Sequences', pathname: 'sequences' },
        ]}
        {contents}
    />
{/snippet}

<Shell {top_nav}>
    {@render children?.()}
</Shell>
