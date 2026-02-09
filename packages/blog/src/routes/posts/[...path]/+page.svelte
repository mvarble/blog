<script>
    let { data } = $props();
</script>

<svelte:head>
    <title>{data.title} | rodent.club</title>
</svelte:head>

<div class="page">
    <h1>{data.title}</h1>
    <data.component />
</div>

<style>
    :root {
        --max-width: 1200px;
    }
    h1 {
        text-decoration: underline;
        font: 500 calc(1.25 * var(--font-size-h1)) / 1.2 var(--font-family-heading);
        margin-top: 0;
    }
    .page {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
        min-width: 0 !important;
        margin: 0 auto;
        max-width: var(--max-width);
    }
</style>
