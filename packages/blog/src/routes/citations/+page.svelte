<script>
    let { data } = $props();
    let citations = $derived(data.citations);
    // TODO: finish rendering of citation
</script>

{#snippet citation(obj)}
    {#each obj.authors as author, i (author.fullname)}
        <span>{author.fullname.trimEnd()}{i != obj.authors.length - 1 ? ', ' : '.'}</span>
    {/each}
    <span>{obj.title}</span>
{/snippet}

<ul>
    {#each citations as obj (obj.key)}
        <li id={obj.key}>{@render citation(obj)}</li>
    {/each}
</ul>
