<script>
    let { data } = $props();
</script>

<data.component />

{#if data.next}
    <a href={`/${data.next.pathname}`}>Next up: {data.next.title}</a>
{/if}
