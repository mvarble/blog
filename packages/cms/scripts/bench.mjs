// Times a full CMS build against the blog's content tree and prints row counts.
//
//   node ../cms/scripts/bench.mjs      (run from packages/blog)
//
// The plugin resolves content and the `.cms` cache directory relative to the
// working directory, so this must run from `packages/blog`.
import sqlite3 from 'better-sqlite3';
import { cmsSource } from 'cms/vite';

const TABLES = [
    'mddocs',
    'pages',
    'tags',
    'page_mddocs',
    'posts',
    'sequences',
    'sequence_pages',
    'statements',
    'equations',
    'citations',
    'citation_authors',
    'page_refs',
    'statement_refs',
    'equation_refs',
    'citation_refs',
];

const plugin = cmsSource();

const start = performance.now();
await plugin.buildStart.call({}, {});
const elapsed = performance.now() - start;

console.log(`build: ${elapsed.toFixed(0)} ms`);

const db = new sqlite3('.cms/cache.db', { readonly: true });
for (const table of TABLES) {
    const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table};`).get();
    console.log(`  ${table.padEnd(18)} ${n}`);
}
db.close();
