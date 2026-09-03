<script>
    let { data } = $props();
</script>

<svelte:head>
    <title>{data.title} | rodent.club</title>
</svelte:head>

<h1>{data.title}</h1>
<data.component />

<style>
    h1 {
        text-decoration: underline;
        font: 500 calc(1.25 * var(--font-size-h1)) / 1.2 var(--font-family-heading);
        margin-top: 0;
    }

    @media screen and (min-width: 838px) {
        h1 {
            --font-size-h1: 2.3rem;
        }
    }
</style>
