import path from 'path';
import { type Database } from 'better-sqlite3';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import rehypeParse from 'rehype-parse';
import { type Root } from 'mdast';

import { hasStringField } from './typechecks';
import { Page, touchPageReference } from '../db';

export function findReferences(db: Database, page: Page, mdast: Root) {
	const rehypeParser = unified().use(rehypeParse);
	visit(mdast, (node) => {
		if (node.type == 'html') {
			const hast = rehypeParser.parse(node.value);
			visit(hast, { tagName: 'a' }, (node) => {
				if (hasStringField(node.properties, 'href')) {
					maybeTouchPageReference(db, page, node.properties.href);
				}
			});
		}
		if (node.type == 'link') {
			maybeTouchPageReference(db, page, node.url);
		}
	});
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
