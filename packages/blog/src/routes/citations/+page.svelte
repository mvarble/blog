<script lang="ts">
    import type { Citation, CitationAuthor } from 'cms';
    import { renderToString } from 'katex';

    let { data } = $props();
    let citations = $derived(data.citations);

    function renderTitle(title: string) {
        let out = title;
        const matches = [...out.matchAll(/\$[\s\S]*?\$/gs)].toReversed();
        for (const match of matches) {
            out =
                out.slice(0, match.index) +
                renderToString(out.slice(match.index + 1, match.index + match[0].length - 1)) +
                out.slice(match.index + match[0].length);
        }
        return out;
    }
</script>

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
        <cite>{@html renderTitle(ref.title)}{ref.volume || ref.edition ? ',' : '.'}</cite>
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
        <cite>{@html renderTitle(ref.title)}.</cite>
        <span>Thesis,</span>
        {#if ref.institution}
            <span>{ref.institution},</span>
        {/if}
        <span>{ref.year}.</span>
        {@render link(ref)}
    {:else}
        <cite>{@html renderTitle(ref.title)}.</cite>
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

<ul>
    {#each citations as ref (ref.key)}
        <li id={ref.key}>{@render citation(ref)}</li>
    {/each}
</ul>
