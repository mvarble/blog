<script lang="ts">
    import type { Snippet } from 'svelte';

    import TableOfContents from '$lib/components/ui/table-of-contents.svelte';
    import type { DocumentSummary } from '$lib/types';

    // The page shell used wherever a table of contents sits beside the content:
    // sequence pages, and posts. Below the breakpoint the sidebar is hidden and
    // the same `contents` reach the reader through the mobile menu in the nav.
    let { contents, children }: { contents: DocumentSummary[]; children: Snippet } = $props();
</script>

<div class="container">
    <div class="toc-container" style="order: 1">
        <TableOfContents {contents} />
    </div>

    <div class="page content">
        {@render children()}
    </div>
</div>

<style>
    .container {
        --sidebar-menu-width: 18rem;
        --sidebar-width: var(--sidebar-menu-width);

        display: flex;
        flex-direction: column;
    }

    .page {
        padding: var(--page-padding-top) var(--page-padding-side) var(--page-padding-bottom);
        min-width: 0 !important;
        text-align: justify;
    }

    .page :global(h1),
    .page :global(h2),
    .page :global(h3),
    .page :global(h4),
    .page :global(h5),
    .page :global(h6) {
        text-align: left;
    }

    .page :global(:where(h2, h3) code) {
        all: unset;
    }

    .toc-container {
        background: var(--bg-2);
        display: none;

        :root.dark & {
            background: var(--bg-0);
        }
    }

    @media (min-width: 838px) {
        .content {
            padding-left: calc(var(--sidebar-width) + var(--page-padding-side));
        }
        .toc-container {
            display: block;
            width: var(--sidebar-width);
            height: calc(100vh - var(--nav-height) - var(--banner-height));
            position: fixed;
            left: 0;
            top: var(--nav-height);
            overflow: hidden;

            &::after {
                content: '';
                position: absolute;
                right: 0;
                top: 0;
                width: 3px;
                height: 100%;
                background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.03));
            }
        }

        .page {
            padding-left: calc(var(--sidebar-width) + var(--page-padding-side));
        }
    }

    @media (min-width: 1200px) {
        .container {
            --sidebar-width: max(
                18rem,
                calc(
                    0.5 *
                        (
                            100vw - var(--page-content-width) - var(--page-padding-side) -
                                var(--page-padding-side)
                        )
                )
            );
            flex-direction: row;
        }

        .page {
            --on-this-page-display: block;
            padding: var(--page-padding-top) calc(var(--sidebar-width) + var(--page-padding-side));
            margin: 0 auto;
            box-sizing: content-box;
            width: 100%;
        }
    }
</style>
