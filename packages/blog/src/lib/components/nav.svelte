<!--
Top navigation bar for the application. It provides a slot for the left side, the right side, and the center.

Based off of the component on the Svelte docs, at:
https://github.com/sveltejs/svelte.dev/blob/main/packages/site-kit/src/lib/nav/Nav.svelte
-->

<script lang="ts">
    import { tick } from 'svelte';
    import { page } from '$app/state';

    import { overlay_open, on_this_page_open } from '../stores';
    import Icon from './icon.svelte';
    import ThemeToggle from './theme-toggle.svelte';
    import MobileMenu from './mobile-menu.svelte';
    import { type NavigationLink } from '$lib/types';

    let { links }: { links: NavigationLink[] } = $props();

    let visible = $state(true);

    // mobile nav stuff
    let open = $state(false);
    let current = $state.raw<NavigationLink | undefined>();
    let menu_button: HTMLButtonElement;

    // Prevents navbar to show/hide when clicking in docs sidebar
    let hash_changed = false;
    function handle_hashchange() {
        hash_changed = true;
    }

    let last_scroll = 0;
    function handle_scroll() {
        const scroll = window.scrollY;
        if (!hash_changed) {
            visible = scroll === last_scroll ? visible : scroll < 50 || scroll < last_scroll;
        }

        last_scroll = scroll;
        hash_changed = false;
    }

    $effect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
    });
</script>

<svelte:window
    onscroll={handle_scroll}
    onhashchange={handle_hashchange}
    onkeydown={(e) => {
        if (open && e.key === 'Escape') {
            open = false;
            // we only manage focus when Esc is hit
            // otherwise, the navigation will reset focus
            tick().then(() => menu_button.focus());
        }
    }}
/>

<nav
    class:visible
    style:z-index={$overlay_open && $on_this_page_open ? 80 : null}
    aria-label="Primary"
>
    <a class="home-link" href="/" title="Home" aria-label="Home"></a>

    <div class="desktop">
        <div class="links">
            {#each links as link (link.slug)}
                <a
                    href="/{link.slug}"
                    aria-current={page.url.pathname.startsWith(`/${link.slug}`) ? 'page' : null}
                >
                    {link.title}
                </a>
            {/each}
        </div>

        <div class="menu">
            <div class="external-links">
                <a href="https://github.com/sveltejs" aria-label="GitHub Organization">
                    <span data-icon="github"></span>
                </a>
            </div>

            <ThemeToggle />
        </div>
    </div>

    <div class="mobile mobile-menu">
        <ThemeToggle />

        <button
            bind:this={menu_button}
            aria-label="Toggle menu"
            aria-expanded={open}
            class="menu-toggle raised icon"
            class:open
            onclick={() => {
                open = !open;

                if (open) {
                    const segment = page.url.pathname.split('/')[1];
                    current = links.find((link) => link.slug === segment);
                }
            }}
        >
            <Icon name={open ? 'close' : 'menu'} size={16} />
        </button>
    </div>
</nav>

{#if open}
    <div class="mobile">
        <MobileMenu {links} {current} onclose={() => (open = false)} />
    </div>
{/if}

<style>
    nav {
        position: fixed;
        display: flex;
        top: 0;
        z-index: 101;
        width: 100vw;
        height: var(--nav-height);
        margin: 0 auto;
        padding: 0 var(--page-padding-side);
        background-color: var(--bg-1);
        font-family: var(--font-family-body);
        user-select: none;
        isolation: isolate;
        font-family: var(--font-family-ui);

        &::after {
            content: '';
            position: absolute;
            left: 0;
            top: -4px;
            width: 100%;
            height: 4px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.05), transparent);
        }

        :root.dark & {
            background-color: var(--bg-3);
        }
    }

    a {
        font: var(--font-ui-medium);
    }

    @media (max-width: 831px) {
        nav {
            transition: transform 0.2s;
        }

        nav:not(.visible):not(:focus-within) {
            transform: translate(0, calc(var(--nav-height)));
        }
    }

    .links {
        display: flex;
        width: 100%;
        align-items: center;

        a {
            color: inherit;
            font: var(--font-ui-medium);

            white-space: nowrap;
            height: 100%;
            display: flex;
            align-items: center;
            text-decoration: none;
            outline-offset: -2px;
            padding: 0.1rem 0.8rem 0 0.8rem;

            &:hover {
                box-shadow: inset 0 -1px 0 0 var(--border);
            }

            &[aria-current='page'] {
                color: var(--fg-accent);
                box-shadow: inset 0 -1px 0 0 currentColor;
            }
        }
    }

    .menu {
        position: relative;
        display: flex;
        width: 100%;
        gap: 0.5rem;

        .external-links {
            display: flex;
            height: 100%;
            margin: 0 0.5rem;

            a {
                outline-offset: -2px;
            }
        }
    }

    .home-link {
        height: 100%;
        width: 4em;
        background: url(/icons/rat.svg) no-repeat 0 50% / auto;
    }

    :root.dark .home-link {
        background-image: url(/icons/rat-dark.svg);
    }

    .mobile-menu {
        display: flex;
        flex: 1;
        justify-content: end;
        align-items: center;
        gap: 0.5rem; /* TODO tokenize */
    }

    .desktop {
        display: none;
    }

    nav :global(.small) {
        display: block;
    }

    @media (max-width: 831px) {
        nav {
            top: unset;
            bottom: 0;
        }

        .menu {
            position: relative;
            display: none;
            width: 100%;
            background: var(--bg-1);
            padding: 1rem var(--page-padding-side);
        }

        nav :global(.large) {
            display: none;
        }
    }

    @media (min-width: 832px) {
        nav {
            display: grid;
            grid-template-columns: auto 1fr 1fr;

            &::after {
                top: auto;
                bottom: -4px;
                background: linear-gradient(to bottom, rgba(0, 0, 0, 0.05), transparent);
            }
        }

        .menu {
            display: flex;
            width: auto;
            height: 100%;
            align-items: center;
        }

        .menu:last-child {
            justify-content: end;
        }

        .mobile {
            display: none;
        }

        .desktop {
            display: contents;

            [data-icon] {
                display: flex;
                background: var(--fg-3);
                padding: 0 0.5rem;
                height: 100%;
                aspect-ratio: 1;
                mask: no-repeat 50% 50%;
                mask-size: calc(100% - 1rem) auto;
            }

            [data-icon='github'] {
                width: 3rem;
                mask-image: url(/icons/github.svg);
            }
        }

        nav :global(.small) {
            display: none;
        }
    }
</style>
