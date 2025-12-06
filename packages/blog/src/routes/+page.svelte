<script>
    import Short from '../content/about/short.svx';
    import Long from '../content/about/long.svx';
    import Post from '$lib/components/post.svelte';
    let { data } = $props();
</script>

<div class="root">
    <div class="banner">
        <div class="content">
            <img src="/me.jpeg" alt="AI cartoon of Matthew Varble" />
            <div>
                <span>Howdy! 🤠</span>
                <Short />
            </div>
        </div>
    </div>
    <div class="page content">
        <Long />
        <h2>Posts</h2>
        {#each data.posts as post (post.pathname)}
            <Post {...post} />
        {/each}
        <a class="more" href="/posts">See all posts</a>
        <h2>Sequences</h2>
        {#each data.sequences as sequence (sequence.pathname)}
            <Post {...sequence} />
        {/each}
        <a class="more" href="/sequences">See all sequences</a>
    </div>
</div>

<style>
    .more {
        font-size: 1.25rem;
        font-weight: 500;
        margin: 1.2rem 0;
        display: block;
        text-decoration: none;
        text-align: center;
    }

    .more:hover {
        text-decoration: underline;
    }

    .root {
        --max-width: 1200px;
    }
    .page {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
        min-width: 0 !important;
        margin: 0 auto;
        max-width: var(--max-width);
    }

    .banner {
        background: var(--bg-2);
        border-bottom: 1px solid var(--border);
        & > .content {
            padding: 0 var(--page-padding-side);
            max-width: var(--max-width);
            margin: 0 auto;
            display: flex;
            flex-direction: row;
            align-items: center;
            flex-wrap: wrap;
            & > img {
                margin: 1em;
                max-width: 300px;
                margin: 1em auto;
                width: 100%;
                border: 1px solid var(--border);
                border-radius: 100%;
                flex-shrink: 0;
            }
            & > div {
                margin: 1em;
                flex-shrink: 1;
                flex-grow: 1;
                & > * {
                    font-family: var(--font-family-ui);
                }
                & > :global(p) {
                    font-size: 16pt;
                    font-weight: 500;
                    line-height: 1.5;
                }
            }
        }
    }

    @media (min-width: 700px) {
        .banner .content {
            flex-wrap: nowrap;
            & > img {
                margin: 1em;
                width: 40%;
            }
        }
    }
</style>
