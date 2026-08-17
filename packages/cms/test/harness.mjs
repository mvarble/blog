// Runs the content layer against a fixture tree in a throwaway working
// directory and returns everything position-dependent that it produced.
//
// The plugin resolves both `src/content` and the `.cms` cache relative to
// `process.cwd()`, so the fixture is staged into a temp directory and the
// process chdir'd into it. Nothing outside that directory is touched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sqlite3 from 'better-sqlite3';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function buildFixture(fixtureName = 'content') {
    const { cmsSource } = await import('../dist/vite.js');

    const cwd = process.cwd();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-fixture-'));
    try {
        fs.mkdirSync(path.join(tmp, 'src'), { recursive: true });
        fs.cpSync(path.join(here, 'fixtures', fixtureName), path.join(tmp, 'src', 'content'), {
            recursive: true,
        });
        process.chdir(tmp);

        const plugin = cmsSource();
        await plugin.buildStart.call({}, {});

        return readSnapshot(path.join(tmp, '.cms', 'cache.db'));
    } finally {
        process.chdir(cwd);
        fs.rmSync(tmp, { recursive: true, force: true });
    }
}

// Only the things whose value depends on where a node sits in the document
// tree. Surrogate ids are excluded on purpose: they are not behaviour.
function readSnapshot(dbFile) {
    const db = new sqlite3(dbFile, { readonly: true });
    const snapshot = {
        statements: db
            .prepare(
                `SELECT s.slug, s.kind, s.label, p.pathname
                 FROM statements s
                 INNER JOIN page_mddocs pm ON s.mddoc_id = pm.imported_mddoc_id
                 INNER JOIN pages p ON pm.parent_page_id = p.id
                 ORDER BY s.slug;`,
            )
            .all(),
        equations: db
            .prepare(
                `SELECT e.slug, e.label, p.pathname
                 FROM equations e
                 INNER JOIN pages p ON e.parent_page_id = p.id
                 ORDER BY e.slug;`,
            )
            .all(),
        sequencePages: db
            .prepare(
                `SELECT sp.slug, sp.title, sp.item, sp.label, sp.appendix, p.pathname
                 FROM sequence_pages sp
                 INNER JOIN pages p ON sp.page_id = p.id
                 ORDER BY p.pathname;`,
            )
            .all(),
        pages: db.prepare('SELECT pathname FROM pages ORDER BY pathname;').all(),
        // How each written reference actually resolved.
        statementRefs: db
            .prepare(
                `SELECT src.filename AS source, sr.ref, s.slug, s.kind, s.label,
                        scope.filename AS targetScope
                 FROM statement_refs sr
                 INNER JOIN mddocs src ON sr.source_mddoc_id = src.id
                 INNER JOIN statements s ON sr.target_statement_id = s.id
                 INNER JOIN mddocs scope ON s.scope_id = scope.id
                 ORDER BY src.filename, sr.ref;`,
            )
            .all(),
        equationRefs: db
            .prepare(
                `SELECT src.filename AS source, er.ref, e.slug, e.label
                 FROM equation_refs er
                 INNER JOIN mddocs src ON er.source_mddoc_id = src.id
                 INNER JOIN equations e ON er.target_equation_id = e.id
                 ORDER BY src.filename, er.ref;`,
            )
            .all(),
    };
    db.close();
    return snapshot;
}
