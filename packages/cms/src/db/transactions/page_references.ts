import { type Database } from 'better-sqlite3';

import { hasNumberField } from '../../plugin/typechecks';

export interface PageReference {
	parentId: number;
	childId: number;
}

export function touchPageReference(
	db: Database,
	parentId: number,
	childPathname: string,
): PageReference | undefined {
	let childId: number;
	try {
		const child = db.prepare('SELECT id FROM pages WHERE pathname = ?;').get(childPathname);
		if (!child || !hasNumberField(child, 'id')) {
			console.error(`The pathname '${childPathname}' does not resolve to a page in the site.`);
			return;
		}
		childId = child.id;
		db.prepare('INSERT INTO page_references (parent_id, child_id) VALUES (?, ?);').run(
			parentId,
			childId,
		);
		return { parentId, childId };
	} catch (e) {
		if (typeof e == 'object' && e && 'code' in e && e.code == 'SQLITE_CONSTRAINT_UNIQUE') {
			return { parentId, childId: childId! };
		} else {
			throw e;
		}
	}
}
