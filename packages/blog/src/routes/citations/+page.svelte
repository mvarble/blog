<script lang="ts">
    import type { Citation, CitationAuthor } from '@mvarble/mesearch-cms/presets/blog';

    let { data } = $props();
    let citations = $derived(data.citations);
    let titles = $derived(Object.fromEntries(citations.map((ref) => [ref.key, ref.titleHtml])));
</script>

<svelte:head>
    <title>Citations | rodent.club</title>
</svelte:head>

{#snippet authors(authors: CitationAuthor[])}
    {#each authors as author, i (author.fullname)}
        <span>{author.fullname.trimEnd()}{i != authors.length - 1 ? ', ' : '.'}</span>
    {/each}
{/snippet}

{#snippet link(ref: Citation)}
    {#if ref.doi}
        <a href={`https://doi.org/${ref.doi}`}>{ref.doi}</a>.
    {:else if ref.url}
        <a href={ref.url}>link</a>.
    {/if}
{/snippet}

{#snippet citation(ref: Citation)}
    {@render authors(ref.authors)}
    {#if ref.kind == 'book'}
        <cite>{@html titles[ref.key]}{ref.volume || ref.edition ? ',' : '.'}</cite>
        {#if ref.volume}
            <span>{ref.volume}{ref.edition ? ',' : '.'}</span>
        {/if}
        {#if ref.edition}
            <span>{ref.edition}.</span>
        {/if}
        {#if ref.publisher}
            <span>{ref.publisher},</span>
        {/if}
        <span>{ref.year}.</span>
        {#if ref.isbn}
            <span>{ref.isbn}.</span>
        {/if}
        {@render link(ref)}
    {:else if ref.kind == 'thesis'}
        <cite>{@html titles[ref.key]}.</cite>
        <span>Thesis,</span>
        {#if ref.institution}
            <span>{ref.institution},</span>
        {/if}
        <span>{ref.year}.</span>
        {@render link(ref)}
    {:else}
        <cite>{@html titles[ref.key]}.</cite>
        {#if ref.publisher}
            <span>{ref.publisher},</span>
        {/if}
        {#if ref.journal}
            <span>{ref.journal},</span>
        {/if}
        {#if ref.series}
            <span>{ref.series},</span>
        {/if}
        {#if ref.volume}
            <span>Volume {ref.volume},</span>
        {/if}
        {#if ref.edition}
            <span>Edition {ref.edition},</span>
        {/if}
        {#if ref.pages}
            <span>Pages {ref.pages},</span>
        {/if}
        <span>{ref.year}.</span>
        {#if ref.issn}
            <span>{ref.issn}.</span>
        {/if}
        {@render link(ref)}
    {/if}
{/snippet}

<main id="main" class="listing">
    <h1 class="listing-title">Citations</h1>
    <ul class="prose">
        {#each citations as ref (ref.key)}
            <li id={ref.key}>{@render citation(ref)}</li>
        {/each}
    </ul>
</main>

<style>
    ul {
        max-width: var(--measure);
        padding: 0;
        list-style: none;
        text-align: left;
    }

    li {
        margin-bottom: 0.75rem;
        scroll-margin-top: 2rem;
    }

    li:target {
        background: var(--accent-soft);
    }
</style>
