import type { OutlineEntry } from '@mvarble/mesearch-cms/presets/blog';
import { cms } from '$cms';

import type { DocumentSummary } from '$lib/types';

// The headings of one page, as table-of-contents entries beneath it.
//
// The tree itself -- `##` under the `#` above it -- is decided in the content
// layer, so that the rule has one implementation and one set of tests. All that
// happens here is putting it in the shape the sidebar renders.
export function outlineOf(filename: string, pathname: string): DocumentSummary[] {
    const toSummary = (entry: OutlineEntry): DocumentSummary => ({
        title: entry.title,
        pathname,
        anchor: entry.slug,
        children: entry.children.map(toSummary),
    });
    return cms.outline(filename).map(toSummary);
}
