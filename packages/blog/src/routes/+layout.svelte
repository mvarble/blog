<script>
    import '../styles/index.css';

    import Shell from '$lib/components/ui/shell.svelte';
    import Nav from '$lib/components/ui/nav.svelte';

    let { children } = $props();
</script>

{#snippet top_nav()}
    <Nav links={[]} />
{/snippet}

<Shell {top_nav} {children} />
