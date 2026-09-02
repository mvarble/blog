import { Plugin, ViteDevServer } from 'vite';
import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';
import matter from 'gray-matter';

import { initializeDb, prepareDb, connect, cacheDir } from '../db';
import { crossReferenceDocument, initializeDocument } from '../content/doctypes';
import { getAllDocumentFacts, diffDocumentFacts } from '../content/facts';

const CONTENT_DIR = 'src/content';

// Vite plugin which exposes a virtual module for access to a database that is populated from
// project files. These files are watched in development mode to hot-update the database, which
// is why need a Vite Plugin.
export function cmsSource(): Plugin {
    // make the CMS cache directory
    fs.mkdirSync(path.resolve(cacheDir), { recursive: true });

    // Make sure the schema is there, but do *not* empty the database here.
    //
    // Constructing the plugin is not the same thing as starting a build: a
    // SvelteKit production build evaluates `vite.config.ts` several times in the
    // one process, including once while the postbuild step is reading the
    // database to collect prerender entries. Clearing on construction wiped the
    // content out from under that read, so every `entries()` came back empty and
    // no dynamic route was ever prerendered. `rebuild` clears inside its own
    // transaction anyway, which is the only place it is safe to.
    const db = connect();
    initializeDb(db);

    let server: ViteDevServer | undefined = undefined;
    let facts = new Map<string, string>();

    // Repopulate the whole database from the content directory.
    //
    // A full rebuild is cheap enough (a few hundred milliseconds) that there is
    // no reason to update the database in place on a file change. Doing so used
    // to mean a document could only be cross-referenced once every node it
    // mentions had already been visited, which made the result depend on which
    // file happened to be edited. Rebuilding sidesteps that entirely, and is
    // also the only way stale rows for renamed or deleted content get dropped.
    //
    // This is deliberately synchronous. It runs inside a single transaction, and
    // because it never yields, a page request can never be served against a
    // half-populated database.
    function rebuild() {
        // `fast-glob`'s async mode walks directories concurrently and so returns
        // entries in whatever order they happen to finish in; sorting keeps
        // document processing order -- and therefore every id, label and
        // last-writer-wins upsert -- reproducible from one build to the next.
        const svxFilenames = glob.sync(`${CONTENT_DIR}/**/*.svx`).sort();
        const bibFilenames = glob.sync(`${CONTENT_DIR}/**/*.bib`).sort();

        db.transaction(() => {
            prepareDb(db);

            // first pass: nodes
            const svxFileData = new Map<string, { file: string; frontmatter: object & {} }>();
            for (const filename of svxFilenames) {
                const file = fs.readFileSync(filename, 'utf8');
                const frontmatter = matter(file).data;
                svxFileData.set(filename, { frontmatter, file });
                initializeDocument(db, filename, frontmatter, file);
            }
            for (const filename of bibFilenames) {
                const file = fs.readFileSync(filename, 'utf8');
                initializeDocument(db, filename, { type: 'bibtex' }, file);
            }

            // second pass: edges
            for (const filename of svxFilenames) {
                const { file, frontmatter } = svxFileData.get(filename)!;
                crossReferenceDocument(db, filename, frontmatter, file);
            }
        })();
    }

    // Re-transform the documents whose rendered output actually depends on what
    // just changed. Vite only invalidates the file that was edited, but a label
    // is a function of position: inserting one statement renumbers every later
    // one, including those living in other files. Comparing the facts each
    // document exposes before and after tells us exactly which those are.
    function invalidateChanged(changed: string[]) {
        if (!server || changed.length == 0) return;
        for (const filename of changed) {
            const id = path.resolve(filename);
            for (const environment of Object.values(server.environments)) {
                const module = environment.moduleGraph.getModuleById(id);
                if (module) environment.moduleGraph.invalidateModule(module);
            }
        }
        server.hot.send({ type: 'full-reload' });
    }

    function isContentFile(filename: string): boolean {
        return (
            !path.relative(CONTENT_DIR, filename).startsWith('..') &&
            (filename.endsWith('.svx') || filename.endsWith('.bib'))
        );
    }

    // A single save can emit several watcher events, and adding a statement
    // usually lands as a create plus an edit to the file importing it. Coalesce
    // them so the rebuild runs once, after the dust settles.
    let pending: NodeJS.Timeout | undefined = undefined;
    function scheduleRebuild() {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => {
            pending = undefined;
            const before = facts;
            rebuild();
            facts = getAllDocumentFacts(db);
            invalidateChanged(diffDocumentFacts(before, facts));
        }, 10);
    }

    // return the plugin
    return {
        name: 'cms',
        version: '0.0.1',

        configureServer(devServer) {
            server = devServer;
        },

        // https://rollupjs.org/plugin-development/#buildstart
        buildStart() {
            rebuild();
            facts = getAllDocumentFacts(db);
        },

        // https://rollupjs.org/plugin-development/#watchchange
        //
        // Note this is `watchChange` rather than `handleHotUpdate`: Vite only
        // dispatches the latter for `update` events, so with it a newly created
        // or deleted document never reached the content layer at all.
        watchChange(id, { event }) {
            const filename = path.relative(path.resolve('.'), id);
            if (!isContentFile(filename)) return;
            // A delete leaves nothing to read, but still has to be reflected.
            if (event == 'delete' || fs.existsSync(filename)) scheduleRebuild();
        },
    };
}
