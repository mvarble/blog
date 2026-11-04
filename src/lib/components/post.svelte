<script lang="ts">
    import { formatDate, isoDate } from '@mvarble/mesearch-ui';
    import Tags from '$lib/components/tags.svelte';
    import { theme } from '$lib/state';
    import type { PostInfoWithDescription } from '$lib/types';

    function hash(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    let {
        title,
        created,
        edited,
        pathname,
        image,
        tags,
        description: Description,
    }: PostInfoWithDescription = $props();

    // A post without a picture gets the rat, tinted with a colour of its own.
    let hue = $derived(Math.abs(hash(title)) % 360);
    let dark = $derived(theme.current == 'dark');
    let gradient = $derived(
        dark
            ? `linear-gradient(to bottom, hsl(${hue}, 20%, 80%), hsl(${hue}, 20%, 60%))`
            : `linear-gradient(to bottom, hsl(${hue}, 40%, 98%), hsl(${hue}, 40%, 85%))`,
    );
    let filter = $derived(
        image
            ? dark
                ? 'brightness(88%)'
                : undefined
            : `${dark ? 'brightness(80%) ' : ''}sepia(100%) hue-rotate(${hue + 120}deg)`,
    );
    let revised = $derived(isoDate(created) != isoDate(edited));
</script>

<a class="card" href="/{pathname}/">
    <div class="thumb" style:background={gradient}>
        <div
            class="img"
            style:background-image={image ? `url(${image})` : 'url(/rat.png)'}
            style:filter
        ></div>
    </div>
    <div class="body">
        <h3>{title}</h3>
        <p class="meta">
            <span>Written <time datetime={isoDate(created)}>{formatDate(created)}</time></span>
            {#if revised}
                <span>Revised <time datetime={isoDate(edited)}>{formatDate(edited)}</time></span>
            {/if}
        </p>
        <Tags {tags} />
        {#if Description}
            <div class="description"><Description /></div>
        {/if}
    </div>
</a>

<style>
    .card {
        display: flex;
        flex-wrap: wrap;
        overflow: hidden;
        border: 1px solid var(--rule);
        border-radius: var(--radius-large);
        background: var(--paper-raised);
        color: inherit;
        text-decoration: none;
        transition:
            box-shadow 150ms,
            transform 150ms;
    }

    .card:hover {
        box-shadow: var(--shadow);
        transform: translateY(-1px);
    }

    .thumb {
        position: relative;
        flex: 1 1 17rem;
        aspect-ratio: 3 / 2;
        overflow: hidden;
    }

    .img {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        transition: transform 200ms;
    }

    .card:hover .img {
        transform: scale(1.06);
    }

    .body {
        flex: 999 1 20rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        padding: 1.3rem 1.5rem 1.5rem;
    }

    h3 {
        margin: 0;
        font: 600 1.45rem / 1.25 var(--font-heading);
        color: var(--ink);
    }

    .card:hover h3 {
        color: var(--accent);
    }

    .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 1.1rem;
        margin: 0;
        font: 400 var(--font-size-ui) / 1.4 var(--font-ui);
        color: var(--muted);
    }

    .description {
        font: 400 1rem / 1.6 var(--font-body);
        color: var(--ink-soft);
    }

    .description :global(p) {
        margin: 0;
    }
</style>
