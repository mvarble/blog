import { Plugin, ViteDevServer } from 'vite';
import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';
import matter from 'gray-matter';

import { prepareDb, connect, cacheDir, getPage, getRoot } from '../db';
import { edgeParser } from './parsers';
import { hasStringField } from '../util';

import post from './doctypes/posts';
import sequence from './doctypes/sequences';
import statement from './doctypes/statements';
import bibtex from './doctypes/bibtex';

import { type Database } from '../db';

export interface FileHooks {
    // First hook: "node" data which does not include any cross-referencing.
    initialize?(
        db: Database,
        filename: string,
        frontmatter: Record<'type', string>,
        contents: string,
    ): Promise<void>;
    // Second hook: "edge" data which assumes nodes have already been populated in DB.
    crossReference?(
        db: Database,
        filename: string,
        frontmatter: Record<'type', string>,
        contents: string,
    ): Promise<void>;
    // HMR trigger
    hmr?(
        db: Database,
        filename: string,
        frontmatter: Record<'type', string>,
        contents: string,
    ): Promise<void>;
}

// CMS DB hooks
const HOOKS: { [key: string]: FileHooks } = {
    post,
    sequence,
    statement,
    bibtex,
};

export async function defaultCrossReference(db: Database, filename: string, contents: string) {
    // otherwise, we use the default
    const page = getPage(db, filename);
    if (page) {
        edgeParser(
            db,
            {
                mddocId: page.mddocId,
                root: page.root,
                relevantPageId: page.id,
                pathname: page.pathname,
                filename,
            },
            contents,
        );
    }
}

// Vite plugin which exposes a virtual module for access to a database that is populated from
// project files. These files are watched in development mode to hot-update the database, which
// is why need a Vite Plugin.
export function cmsSource(): Plugin {
    // make the CMS cache directory
    fs.mkdirSync(path.resolve(cacheDir), { recursive: true });

    // prepare an empty database for all of the data of the site
    const db = connect();
    prepareDb(db);

    // helper function called on each file during first-pass of adding "nodes"
    async function initialize(filename: string, frontmatter: object & {}, contents: string) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if (hook.initialize) {
                await hook.initialize(db, filename, frontmatter, contents);
            }
        }
    }

    // helper function called on each file during second-pass of adding "edges"
    async function crossReference(filename: string, frontmatter: object & {}, contents: string) {
        // if we have a custom cross-referencing procedure, we run that.
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if (hook.crossReference) {
                await hook.crossReference(db, filename, frontmatter, contents);
                return;
            }
        }
        // otherwise, use the default
        defaultCrossReference(db, filename, contents);
    }

    // helper function called during hot-updates to file which updates database
    async function hmr(filename: string, frontmatter: object & {}, contents: string) {
        // just use the initialization for bibtex documents
        if ('type' in frontmatter && frontmatter.type == 'bibtex') {
            await initialize(filename, frontmatter, contents);
            return;
        }

        // otherwise, find the root document and initialize it
        const root = getRoot(db, filename);
        console.log('ROOT: ', root);
        if (root) {
            const contents = await fs.promises.readFile(root.filename, 'utf8');
            const frontmatter = matter(contents).data;
            await initialize(root.filename, frontmatter, contents);
        } else {
            initialize(filename, frontmatter, contents);
        }

        // finally, perform cross-referencing on this document once more
        await crossReference(filename, frontmatter, contents);
    }

    // helper function called during hot-updates to file which invalidates
    function invalidate(filename: string, server: ViteDevServer) {
        const file = path.join(path.resolve('.'), filename);
        const module = server.moduleGraph.getModuleById(file);
        if (module) server.moduleGraph.invalidateModule(module);
    }

    // return the plugin
    return {
        name: 'cms',
        version: '0.0.1',

        // https://rollupjs.org/plugin-development/#buildstart
        async buildStart() {
            // all of the SVX/bibtex files
            const svxFilenames = await glob('src/content/**/*.svx');
            const bibFilenames = await glob('src/content/**/*.bib');

            // first pass
            const svxFileData = new Map<string, { file: string; frontmatter: object & {} }>();
            for (const filename of svxFilenames) {
                const file = await fs.promises.readFile(filename, 'utf8');
                const frontmatter = matter(file).data;
                svxFileData.set(filename, { frontmatter, file });
                await initialize(filename, frontmatter, file);
            }
            for (const filename of bibFilenames) {
                const file = await fs.promises.readFile(filename, 'utf8');
                await initialize(filename, { type: 'bibtex' }, file);
            }

            // second pass
            for (const filename of svxFilenames) {
                const { file, frontmatter } = svxFileData.get(filename)!;
                await crossReference(filename, frontmatter, file);
            }
        },

        // https://vite.dev/guide/api-plugin.html#handlehotupdate
        async handleHotUpdate({ file, server }) {
            const filename = path.relative(path.resolve('.'), file);
            const inContent = filename.startsWith('src/content');
            const isSvx = filename.endsWith('.svx');
            const isBib = filename.endsWith('.bib');
            if (inContent && (isSvx || isBib)) {
                console.log('HOT UPDATE: ', filename);
                const file = await fs.promises.readFile(filename, 'utf8');
                const frontmatter = isSvx ? matter(file).data : { type: 'bibtex' };
                await hmr(filename, frontmatter, file); // this will update the database
                invalidate(filename, server);
            }
        },
    };
}
