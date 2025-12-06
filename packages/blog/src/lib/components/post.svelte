<script lang="ts">
    import type { Component } from 'svelte';
    import { theme } from '$lib/state';

    function hash(str: string) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
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
        ...props
    }: {
        title: string;
        created: Date;
        edited: Date;
        pathname: string;
        description?: Component;
        image?: string;
    } = $props();

    let hue = Math.abs(hash(title)) % 360;
    let gradient = $derived(
        theme.current == 'light'
            ? `linear-gradient(to bottom, hsl(${hue}, 40%, 98%), hsl(${hue}, 40%, 85%))`
            : `linear-gradient(to bottom, hsl(${hue}, 40%, 60%), hsl(${hue}, 40%, 50%))`,
    );
    let filter = $derived(
        image
            ? theme.current == 'light'
                ? undefined
                : 'brightness(88%)'
            : theme.current == 'light'
              ? `sepia(100%) hue-rotate(${hue + 120}deg)`
              : `brightness(80%) sepia(100%) hue-rotate(${hue + 120}deg)`,
    );
</script>

<a href="/{pathname}">
    <div class="thumb" style:background={gradient}>
        <div
            class="img"
            style:background-image={image ? `url(${image})` : 'url(/rat.png)'}
            style:filter
        ></div>
    </div>
    <div class="desc">
        <h3>{title}</h3>
        <span>Created: {created.toDateString()}</span>
        {#if created.getTime() != edited.getTime()}
            <br />
            <span>Last edited: {edited.toDateString()}</span>
        {/if}
        {#if props.description}
            <props.description />
        {/if}
    </div>
</a>

<style>
    a {
        display: flex;
        flex-wrap: wrap;
        text-decoration: none;
        color: inherit;
        margin: 1em;
    }

    .thumb {
        flex-grow: 1;
        flex-shrink: 1;
        aspect-ratio: 2 / 1;
        width: 36%;
        min-width: 250px;
        margin: 0 auto;
        overflow: hidden;
        position: relative;
        border: 1px solid var(--border);
    }

    .desc {
        width: 64%;
        padding: 1em;
        flex-grow: 1;
        flex-shrink: 1;
    }

    h3 {
        color: var(--fg-accent);
    }

    .img {
        position: absolute;
        inset: 0;
        background-size: cover; /* fit entire image */
        background-position: center;
        background-repeat: no-repeat;
        transition: transform 0.2s;
    }

    a:hover {
        text-decoration: none;
        & h3 {
            text-decoration: underline;
        }

        .img {
            transform: scale(1.1);
        }
    }
</style>
