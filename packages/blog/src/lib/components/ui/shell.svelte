<!--
The main shell of the application.

It provides a slots for top-navigation and main-content.

Based off of the component on the Svelte docs, at:
https://github.com/sveltejs/svelte.dev/blob/main/packages/site-kit/src/lib/components/Shell.svelte
-->

<script lang="ts">
    import type { Snippet } from 'svelte';

    import { overlay_open } from '$lib/stores';
    import ModalOverlay from './modal-overlay.svelte';
    import Icons from '../icons.svelte';

    interface Props {
        top_nav?: Snippet;
        children?: Snippet;
    }

    let { top_nav, children }: Props = $props();
</script>

<Icons />

<!-- An accessibility link which allows quick navigation to main content. -->
<a id="skip-to-main" href="#main">Skip to main content</a>

<!-- Shell is pretty self-explanatory -->
{@render top_nav?.()}

{#if $overlay_open}
    <ModalOverlay />
{/if}

<main id="main">
    {@render children?.()}
</main>

<style>
    #skip-to-main {
        display: flex;
        align-items: center;
        background: var(--bg-1);
        color: inherit;
        height: calc(var(--nav-height) - 2rem);
        padding: 0 1rem;
        position: absolute;
        inset-block-start: 1rem;
        inset-inline-start: 1rem;
        transform: translateY(-999px);
        font: var(--font-ui-medium);
        z-index: 1000;
    }

    a:focus {
        transform: translateY(0%);
    }

    main {
        position: relative;
        margin: 0 auto;
        padding-bottom: 0;
        height: 100%;
    }

    @media (min-width: 832px) {
        main {
            padding-top: var(--nav-height);
        }
    }
</style>
