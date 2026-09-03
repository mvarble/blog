// The rules for turning a document's headings into an outline.
//
// Kept free of anything but types so the tests can import it directly: the
// slugs decide what every section anchor on the site is called, so getting them
// wrong renames URLs people may have linked to.

export interface Heading {
    // 1 for `#`, 2 for `##`. Nothing deeper is collected.
    depth: number;
    title: string;
    // The `id` given to the rendered heading, and the fragment linking to it.
    slug: string;
}

export interface OutlineEntry extends Heading {
    children: OutlineEntry[];
}

// A URL fragment for a heading: lowercase, with any run of characters that has
// no business in a fragment collapsed to a single hyphen.
export function slugifyHeading(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Slugs for a document's headings, in order.
//
// Two headings can easily share a title -- 'Notation' under two different
// chapters of the same page -- so a repeat is suffixed. A heading whose title
// slugifies to nothing at all (one that is only math, say) falls back to its
// position, which is stable as long as the document above it does not change.
export function headingSlugs(titles: readonly string[]): string[] {
    const used = new Map<string, number>();
    return titles.map((title, index) => {
        const base = slugifyHeading(title) || `section-${index}`;
        const seen = used.get(base) ?? 0;
        used.set(base, seen + 1);
        return seen == 0 ? base : `${base}-${seen + 1}`;
    });
}

// Nests each `##` under the `#` above it.
//
// A `##` that appears before any `#` has nothing to nest under, so it stands on
// its own rather than being dropped -- a document is free to be written that
// way, and silently losing a section from the table of contents would be worse
// than an uneven tree.
export function buildOutline(headings: readonly Heading[]): OutlineEntry[] {
    const out: OutlineEntry[] = [];
    for (const heading of headings) {
        const entry: OutlineEntry = { ...heading, children: [] };
        const parent = heading.depth > 1 ? out.at(-1) : undefined;
        if (parent) parent.children.push(entry);
        else out.push(entry);
    }
    return out;
}
