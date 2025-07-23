import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import { type Database } from '../db';
import { mdastParser, type FileHooks } from '.';
import {
    hasArrayField,
    hasBooleanField,
    hasDateField,
    hasObjectField,
    hasStringField,
} from './typechecks';
import { getStatements } from './statements';
import {
    touchStatement,
    SequenceChild,
    touchSequence,
    TouchSequenceChildInput,
    getSequence,
} from '../db';
import { findReferences } from './page_references';

const hooks: FileHooks = {
    async initialize(db, filename, frontmatter, contents) {
        // check frontmatter for title
        if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
            console.error('Sequences must have a `title` string-field in the frontmatter.');
            return;
        }

        // check frontmatter for slug
        if (!hasStringField(frontmatter, 'slug') || !frontmatter.slug) {
            console.error('Sequences must have a `slug` string-field in the frontmatter.');
            return;
        }

        if (!hasDateField(frontmatter, 'created')) {
            console.error('Sequences must have a `created` date-field.');
            return;
        }
        let edited: Date = frontmatter.created;
        if (hasDateField(frontmatter, 'edited')) {
            edited = frontmatter.edited;
        }

        // check frontmatter for enumerate (optional or boolean)
        if ('enumerate' in frontmatter && !hasBooleanField(frontmatter, 'enumerate')) {
            console.error('Sequences field `enumerate` must be boolean.');
            return;
        }
        let enumerate = false;
        if (hasBooleanField(frontmatter, 'enumerate')) {
            enumerate = frontmatter.enumerate;
        }

        // check frontmatter for katex macros (optional or object)
        let katexMacros = {};
        if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
            katexMacros = frontmatter.katex_macros;
        }

        // if frontmatter does not have children, then the sequence is done
        if (!('children' in frontmatter)) {
            const sequence = touchSequence(db, {
                title: frontmatter.title,
                slug: frontmatter.slug,
                created: frontmatter.created,
                edited,
                filename,
                enumerate,
                katexMacros,
            });

            // get statements from content
            const statements = await getStatements(sequence.pageId, filename, contents, 0);
            statements.forEach((statement) => touchStatement(db, statement));
            return;
        }

        // ensure the children are presented as an array; check each child and short-circuit if any fail
        if (!hasArrayField(frontmatter, 'children')) {
            console.error('Sequences field `children` must be an array of objects.');
            return;
        }

        const children = await buildChildren(filename, frontmatter.children);
        if (!children) {
            return;
        }

        const sequence = touchSequence(db, {
            title: frontmatter.title,
            slug: frontmatter.slug,
            created: frontmatter.created,
            edited,
            filename,
            enumerate,
            katexMacros,
            children,
        });

        // get statements from content
        const statements = await getStatements(
            sequence.pageId,
            filename,
            contents,
            0,
            enumerate ? 0 : undefined,
        );
        statements.forEach((statement) => touchStatement(db, statement));

        // get statements recursively
        let i = 0;
        for (const child of sequence.children!) {
            await recurseGetStatements(db, child, 0, enumerate ? i++ : undefined);
        }
    },

    async crossReference(db, filename, _frontmatter, contents) {
        const sequence = getSequence(db, filename);
        if (sequence) {
            async function recurseFile(child: SequenceChild, file: string) {
                const mdast = mdastParser.parse(file);
                findReferences(
                    db,
                    {
                        id: child.pageId,
                        pathname: child.pathname,
                        filename: child.filename,
                        katexMacros: child.katexMacros,
                    },
                    mdast,
                );
                if (child.children) {
                    await Promise.all(child.children.map(recurse));
                }
            }

            async function recurse(child: SequenceChild) {
                const file = await fs.promises.readFile(child.filename, 'utf8');
                await recurseFile(child, file);
            }

            await recurseFile(sequence, contents);
        }
    },
};

async function recurseGetStatements(
    db: Database,
    child: SequenceChild,
    startItem: number,
    itemPrefix: number | undefined,
) {
    const statements = await getStatements(
        child.pageId,
        child.filename,
        await fs.promises.readFile(child.filename, 'utf8'),
        startItem,
        itemPrefix,
    );
    statements.forEach((statement) => touchStatement(db, statement));
    if (child.children) {
        const newStartItem = startItem + statements.length;
        child.children.forEach((c) => recurseGetStatements(db, c, newStartItem, itemPrefix));
    }
}

async function buildChildren(
    rootFilename: string,
    children: unknown[],
): Promise<TouchSequenceChildInput[] | undefined> {
    const out: TouchSequenceChildInput[] = [];
    for (const child of children) {
        if (typeof child != 'object' || !child) {
            console.error('Each descendant in the sequences field `children` must be an object.');
            return;
        }
        if (!hasStringField(child, 'filename') || !child.filename) {
            console.error(
                'Each descendant in the sequences field `children` must have a string-field `filename`.',
            );
            return;
        }
        const filename = path.relative(
            path.resolve('.'),
            path.resolve(path.dirname(rootFilename), child.filename),
        );
        const frontmatter = matter(await fs.promises.readFile(filename, 'utf8')).data;

        if (!hasStringField(frontmatter, 'title') || !frontmatter.title) {
            console.error('Sequence pages must have a `title` string-field in the frontmatter.');
            return;
        }
        if (!hasStringField(frontmatter, 'slug') || !frontmatter.slug) {
            console.error('Sequence pages must have a `slug` string-field in the frontmatter.');
            return;
        }
        let katexMacros = {};
        if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
            katexMacros = frontmatter.katex_macros;
        }

        if (!('children' in child)) {
            out.push({
                title: frontmatter.title,
                slug: frontmatter.slug,
                filename,
                katexMacros,
            });
            continue;
        }

        if (!hasArrayField(child, 'children')) {
            console.error('Sequences field `children` must be an array of objects.');
            return;
        }

        const children = await buildChildren(rootFilename, child.children);
        if (!children) {
            return;
        }
        out.push({
            title: frontmatter.title,
            slug: frontmatter.slug,
            filename,
            katexMacros,
            children,
        });
    }
    return out;
}

export default hooks;
