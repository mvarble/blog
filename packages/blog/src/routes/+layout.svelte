<script>
    import '../styles/index.css';

    import Shell from '$lib/components/shell.svelte';
    import Nav from '$lib/components/nav.svelte';

    let { children } = $props();
</script>

{#snippet top_nav()}
    <Nav links={[]} />
{/snippet}

<Shell {top_nav} {children} />
