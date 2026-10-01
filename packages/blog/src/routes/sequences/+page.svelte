<script lang="ts">
    import Posts from '$lib/components/posts.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Sequences | rodent.club</title>
</svelte:head>

<main id="main" class="listing">
    <h1 class="listing-title">Sequences</h1>
    <Posts posts={data.sequences} />
</main>
