import path from 'path';
import { visit } from 'unist-util-visit';
import { type Root, type Link } from 'mdast';

import { type Database, type Page, touchPageReference } from '../db';

export function findReferences(db: Database, page: Page, mdast: Root) {
    visitReferences(mdast, (node) => maybeTouchPageReference(db, page, node.url));
}

export function visitReferences(mdast: Root, visitor: (node: Link) => void) {
    visit(mdast, 'link', visitor);
}

export function resolvePathname(base: string, rel: string): string | undefined {
    if (rel.startsWith('/')) {
        return rel.slice(1);
    }
    if (rel.startsWith('.')) {
        return path.join(base, rel);
    }
}

export function maybeTouchPageReference(db: Database, page: Page, url: string) {
    const pathname = resolvePathname(page.pathname, url);
    if (pathname) {
        touchPageReference(db, page.id, pathname);
    }
}
