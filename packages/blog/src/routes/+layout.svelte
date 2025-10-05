<script>
    import '../styles/index.css';

    import Shell from '$lib/components/ui/shell.svelte';
    import Nav from '$lib/components/ui/nav.svelte';

    let { children } = $props();
</script>

{#snippet top_nav()}
    <Nav
        links={[
            { title: 'Posts', slug: 'posts' },
            { title: 'Sequences', slug: 'sequences' },
        ]}
    />
{/snippet}

<Shell {top_nav}>
    {@render children?.()}
</Shell>
