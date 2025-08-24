import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';
import matter from 'gray-matter';

import {
    getParentSequenceFilename,
    getStatementParentFilename,
    prepareDb,
    connect,
    cacheDir,
} from '../db';
import { hasStringField } from '../util';

import post from './tables/posts';
import sequence from './tables/sequences';
import statement from './tables/statements';
import citation from './tables/citations';

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
    citation,
};

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
    async function crossReference(
        filename: string,
        frontmatter: object & {},
        contents: string,
        checkParents = false,
    ) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if (hook.crossReference) {
                await hook.crossReference(db, filename, frontmatter, contents);
            }
        } else if (checkParents) {
            const parentFilename = getParentSequenceFilename(db, filename);
            if (parentFilename) {
                await crossReference(
                    parentFilename,
                    matter(await fs.promises.readFile(parentFilename, 'utf8')).data,
                    contents,
                    false,
                );
            }
        }
    }

    // helper function called during hot-updates to file
    async function hmr(filename: string, frontmatter: object & {}, contents: string) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if ('hmr' in hook && typeof hook.hmr == 'function') {
                hook.hmr(db, filename, frontmatter, contents);
                return;
            }
        }
        // if the page is a sequence-page or a statement, we grab its parent from the database to trigger the correct node resolution.
        let parentFilename = getParentSequenceFilename(db, filename);
        if (!parentFilename) {
            parentFilename = getStatementParentFilename(db, filename);
        }
        if (parentFilename) {
            const parentContents = await fs.promises.readFile(parentFilename, 'utf8');
            const parentFrontmatter = matter(parentContents).data;
            await hmr(parentFilename, parentFrontmatter, parentContents);
        }
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
                await initialize(filename, { type: 'citation' }, file);
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
                const file = await fs.promises.readFile(filename, 'utf8');
                const frontmatter = isSvx ? matter(file).data : { type: 'citation' };
                await hmr(filename, frontmatter, file);
                // do a full reload since Vite somehow doesn't know about this file
                server.ws.send({ type: 'full-reload' });
                return [];
            }
        },
    };
}
