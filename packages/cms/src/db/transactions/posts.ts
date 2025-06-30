import { type Database } from 'better-sqlite3';

import { type KatexMacros } from '.';
import { hasNumberField, hasStringField } from '../../plugin/typechecks';

export interface TouchPostInput {
	title: string;
	slug: string;
	filename: string;
	katexMacros: KatexMacros;
}

export interface Post {
	pageId: number;
	title: string;
	slug: string;
	pathname: string;
	filename: string;
	katexMacros: KatexMacros;
}

export function touchPost(db: Database, input: TouchPostInput): Post {
	let pageId: number;
	const pathname = `posts/${input.slug}`;
	try {
		const out = db
			.prepare(
				'INSERT INTO pages (pathname, filename, katex_macros) VALUES (?, ?, ?) RETURNING id;',
			)
			.get(pathname, input.filename, JSON.stringify(input.katexMacros));
		pageId = (out as { id: number }).id;
		db.prepare('INSERT INTO posts (page_id, title, slug) VALUES (?, ?, ?);').run(
			pageId,
			input.title,
			input.slug,
		);
	} catch (e) {
		if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
			const out = db
				.prepare('UPDATE pages SET pathname = ?, katex_macros = ? WHERE filename = ? RETURNING id;')
				.get(pathname, JSON.stringify(input.katexMacros), input.filename);
			pageId = (out as { id: number }).id;
			db.prepare('UPDATE posts SET title = ?, slug = ? WHERE page_id = ?;').run(
				input.title,
				input.slug,
				pageId,
			);
		} else {
			throw e;
		}
	}
	return {
		pageId,
		pathname,
		...input,
	};
}

export function getPost(db: Database, slug: string): Post | undefined {
	const output = db
		.prepare(
			'SELECT posts.page_id, posts.title, posts.slug, pages.pathname, pages.filename, pages.katex_macros FROM posts INNER JOIN pages WHERE pages.id = posts.page_id AND posts.slug = ?;',
		)
		.get(slug);
	if (
		output &&
		hasNumberField(output, 'page_id') &&
		hasStringField(output, 'title') &&
		hasStringField(output, 'slug') &&
		hasStringField(output, 'pathname') &&
		hasStringField(output, 'filename') &&
		hasStringField(output, 'katex_macros')
	) {
		return {
			pageId: output.page_id,
			title: output.title,
			slug: output.slug,
			pathname: output.pathname,
			filename: output.filename,
			katexMacros: JSON.parse(output.katex_macros),
		};
	}
}
