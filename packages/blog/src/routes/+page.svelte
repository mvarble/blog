<script lang="ts">
    import Short from '$content/about/short.svx';
    import Long from '$content/about/long.svx';
    import Posts from '$lib/components/posts.svelte';

    let { data } = $props();
</script>

<svelte:head>
    <title>Home | rodent.club</title>
</svelte:head>

<main id="main">
    <div class="banner">
        <div class="hello">
            <img src="/me.jpeg" alt="AI cartoon of Matthew Varble" />
            <div class="greeting">
                <p class="howdy">Howdy! 🤠</p>
                <Short />
            </div>
        </div>
    </div>

    <div class="home">
        <div class="prose about">
            <Long />
        </div>

        <section aria-labelledby="posts-heading">
            <div class="section-head">
                <h2 id="posts-heading">Posts</h2>
                <a href="/posts/">See all posts →</a>
            </div>
            <Posts posts={data.posts} />
        </section>

        <section aria-labelledby="sequences-heading">
            <div class="section-head">
                <h2 id="sequences-heading">Sequences</h2>
                <a href="/sequences/">See all sequences →</a>
            </div>
            <Posts posts={data.sequences} />
        </section>
    </div>
</main>

<style>
    .banner {
        --grid: 20px;
        --angle: 15deg;
        --line: var(--rule);

        background:
            repeating-linear-gradient(
                calc(90deg + var(--angle)),
                var(--line) 0 1px,
                transparent 1px var(--grid)
            ),
            repeating-linear-gradient(var(--angle), var(--line) 0 1px, transparent 1px var(--grid));
        box-shadow: inset 0 -80px 100px var(--paper);
    }

    .hello {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem 3rem;
        width: min(64rem, 100% - 2 * var(--gutter));
        margin: 0 auto;
        padding: clamp(1.5rem, 5vw, 3.5rem) 0;
    }

    img {
        flex: none;
        width: min(100%, 300px);
        margin: 0 auto;
        border: 1px solid var(--rule-strong);
        border-radius: 100%;
        box-shadow: var(--shadow);
    }

    .greeting {
        flex: 1 1 18rem;
        font-family: var(--font-ui);
    }

    .howdy {
        margin: 0 0 0.75rem;
        font: 600 var(--font-size-title) / 1.1 var(--font-heading);
        letter-spacing: -0.02em;
    }

    .greeting :global(p:not(.howdy)) {
        margin: 0;
        font: 500 1.3rem / 1.5 var(--font-ui);
        color: var(--ink-soft);
        text-wrap: pretty;
    }

    .home {
        width: min(64rem, 100% - 2 * var(--gutter));
        margin: 0 auto;
        padding: clamp(1.5rem, 4vw, 3rem) 0 4rem;
    }

    .about {
        max-width: var(--measure);
        margin: 0 auto clamp(3rem, 7vw, 5rem);
    }

    section {
        margin-bottom: clamp(3rem, 7vw, 4.5rem);
    }

    .section-head {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem 1.5rem;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--rule);
    }

    h2 {
        margin: 0;
        font: 600 1.6rem / 1.2 var(--font-heading);
    }

    .section-head a {
        font: 500 var(--font-size-ui) / 1.4 var(--font-ui);
        color: var(--accent);
        text-decoration: none;
    }

    .section-head a:hover {
        text-decoration: underline;
    }

    @media (min-width: 700px) {
        .hello {
            flex-wrap: nowrap;
        }

        img {
            width: 38%;
            margin: 0;
        }
    }
</style>
