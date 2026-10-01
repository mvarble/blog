<script lang="ts">
    import { Article, ArticleHeader, Pager, SequenceTrack, Toc } from '@mvarble/mesearch-ui';

    import Tags from '$lib/components/tags.svelte';

    let { data } = $props();

    let crumbs = $derived([
        { label: 'rodent.club', url: '/' },
        { label: 'Sequences', url: '/sequences/' },
        ...(data.root
            ? []
            : [
                  {
                      label: data.sequenceTitle,
                      url: data.sequenceUrl,
                      note: `${data.position.index} of ${data.position.count - 1}`,
                  },
              ]),
    ]);
</script>

<svelte:head>
    <title>{data.title} | rodent.club</title>
</svelte:head>

{#snippet header()}
    <ArticleHeader
        {crumbs}
        titleHtml={data.titleHtml}
        created={data.root ? data.created : undefined}
        updated={data.root ? data.edited : undefined}
    >
        {#if data.root && data.tags.length}
            <div class="tags"><Tags tags={data.tags} /></div>
        {/if}
    </ArticleHeader>
{/snippet}

{#snippet track()}
    <SequenceTrack
        title={data.sequenceTitleHtml}
        url={data.sequenceUrl}
        items={data.track}
        current={data.filename}
        eyebrow="Sequence"
    />
{/snippet}

{#snippet contents(folded: boolean)}
    <Toc entries={data.toc} label={folded ? 'Contents' : 'On this page'} />
{/snippet}

{#snippet footer()}
    <Pager label="Through {data.sequenceTitle}" previous={data.previous} next={data.next} />
{/snippet}

<Article
    kind="sequence"
    {header}
    {footer}
    left={track}
    leftLabel="Sequence: {data.sequenceTitle}"
    leftNote={data.root ? undefined : `${data.position.index} of ${data.position.count - 1}`}
    right={data.toc.length ? contents : undefined}
>
    <data.component />
</Article>

<style>
    .tags {
        margin-top: 0.9rem;
    }
</style>
