import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';
import sqlite3 from 'better-sqlite3';
import glob from 'fast-glob';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMath from 'remark-math';

import { getParentSequence, getStatementParent, prepareDb, connect, cacheDir } from '../db';
import { hasStringField } from './typechecks';
import post from './posts';
import sequence from './sequences';
import statement from './statements';

// Database callbacks on visits to each file.
export interface FileHooks {
    // First hook: "node" data which does not include any cross-re:erencing.
    initialize?(
        db: sqlite3.Database,
        filename: string,
        frontmatter: { type: string; [key: string]: unknown },
        contents: string,
    ): Promise<void>;
    // Second hook: "edge" data which assumes nodes have already been populated in DB.
    crossReference?(
        db: sqlite3.Database,
        filename: string,
        frontmatter: { type: string; [key: string]: unknown },
        contents: string,
    ): Promise<void>;
}

// CMS DB hooks
const HOOKS: { [key: string]: FileHooks } = { post, sequence, statement };

// base parser used throughout
export const mdastParser = unified().use(remarkParse).use([remarkFrontmatter, remarkMath]);

// Vite plugin which exposes a virtual module for access to a database that is populated from
// project files. These files are watched in development mode to hot-update the database, which
// is why need a Vite Plugin.
export default function cmsPlugin(): Plugin {
    // make the CMS cache directory
    fs.mkdirSync(path.resolve(cacheDir), { recursive: true });

    // prepare an empty database for all of the data of the site
    const db = connect();
    prepareDb(db);

    // helper function called on each file during first-pass of adding "nodes"
    async function initializeFile(
        filename: string,
        frontmatter: { [key: string]: unknown },
        contents: string,
    ) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if (hook.initialize) {
                await hook.initialize(db, filename, frontmatter, contents);
            }
        }
    }

    // helper function called on each file during second-pass of adding "edges"
    async function crossReferenceFile(
        filename: string,
        frontmatter: { [key: string]: unknown },
        contents: string,
        checkParents = false,
    ) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            const hook = HOOKS[frontmatter.type];
            if (hook.crossReference) {
                await hook.crossReference(db, filename, frontmatter, contents);
            }
        } else if (checkParents) {
            const parentFilename = getParentSequence(db, filename);
            if (parentFilename) {
                await crossReferenceFile(
                    parentFilename,
                    matter(await fs.promises.readFile(parentFilename, 'utf8')).data,
                    contents,
                    false,
                );
            }
        }
    }

    // helper function called during hot-updates to file
    async function updateFile(
        filename: string,
        frontmatter: { [key: string]: unknown },
        contents: string,
    ) {
        if (hasStringField(frontmatter, 'type') && frontmatter.type in HOOKS) {
            initializeFile(filename, frontmatter, contents);
        } else {
            // if the page is a sequence-page or a statement, we grab its parent from the database to trigger the correct node resolution.
            let parentFilename = getParentSequence(db, filename);
            if (!parentFilename) {
                // if the page is a
                parentFilename = getStatementParent(db, filename);
            }
            if (parentFilename) {
                const parentContents = await fs.promises.readFile(parentFilename, 'utf8');
                await updateFile(parentFilename, matter(parentContents).data, parentContents);
            }
        }
    }

    // return the plugin
    return {
        name: 'cms',
        version: '0.0.1',

        async buildStart() {
            // all of the files
            const svxFilenames = await glob('src/content/**/*.svx');

            // first pass
            for (const svxFilename of svxFilenames) {
                const svxFile = await fs.promises.readFile(svxFilename, 'utf8');
                await initializeFile(svxFilename, matter(svxFile).data, svxFile);
            }

            // second pass
            for (const svxFilename of svxFilenames) {
                const svxFile = await fs.promises.readFile(svxFilename, 'utf8');
                const frontmatter = matter(svxFile).data;
                await crossReferenceFile(svxFilename, frontmatter, svxFile);
            }
        },

        async handleHotUpdate({ file }) {
            const filename = path.relative(path.resolve('.'), file);
            if (filename.startsWith('src/content') && filename.endsWith('.svx')) {
                const svxFile = await fs.promises.readFile(filename, 'utf8');
                const frontmatter = matter(svxFile).data;
                await updateFile(filename, frontmatter, svxFile);
                await crossReferenceFile(filename, frontmatter, svxFile);
            }
        },
    };
}
