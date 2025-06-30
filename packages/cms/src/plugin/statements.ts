import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { fromJs } from 'esast-util-from-js';
import rehypeParse from 'rehype-parse';
import matter from 'gray-matter';

import { getStatement, touchStatementDependency, TouchStatementInput } from '../db';
import { hasArrayField, hasObjectField, hasStringField } from './typechecks';
import { FileHooks, mdastParser } from '.';
import { findReferences } from './page_references';

const hooks: FileHooks = {
    async crossReference(db, _filename, frontmatter, contents) {
        if (!hasStringField(frontmatter, 'slug')) return;
        const statement = getStatement(db, frontmatter.slug);
        if (!statement) {
            return;
        }
        const mdast = mdastParser.parse(contents);
        findReferences(
            db,
            {
                id: statement.pageId,
                pathname: statement.pathname,
                filename: statement.filename,
                katexMacros: statement.katexMacros,
            },
            mdast,
        );
        if (hasArrayField(frontmatter, 'dependencies')) {
            frontmatter.dependencies.forEach((dep) => {
                if (typeof dep != 'string' || !dep) {
                    console.error('Statement has dependency which is not a string: ', dep);
                    return;
                }
                const childStatement = getStatement(db, dep);
                if (!childStatement) {
                    console.error(`Statement has dependency '${dep}' which does not exist.`);
                    return;
                }
                touchStatementDependency(db, statement.id, childStatement.id);
            });
        }
    },
};

export default hooks;

export async function getStatements(
    parentId: number,
    parentFilename: string,
    contents: string,
    startItem: number,
    itemPrefix: number | undefined = undefined,
): Promise<TouchStatementInput[]> {
    const promises: (() => Promise<TouchStatementInput | undefined>)[] = [];
    const mdast = mdastParser.parse(contents);
    let item = startItem;
    const rehypeParser = unified().use(rehypeParse);
    visit(mdast, 'html', (node) => {
        visit(rehypeParser.parse(node.value), { tagName: 'script' }, (node) => {
            if (node.children.length == 1 && node.children[0].type == 'text') {
                const script = fromJs(node.children[0].value, { module: true });
                script.body.forEach((node) =>
                    visit(node, 'ImportDeclaration', ({ source }) => {
                        if (
                            source.type == 'Literal' &&
                            typeof source.value == 'string' &&
                            source.value &&
                            source.value.startsWith('.') &&
                            source.value.endsWith('.svx')
                        ) {
                            const filename = path.join(path.dirname(parentFilename), source.value);
                            promises.push(() =>
                                fs.promises.readFile(filename).then((file) => {
                                    const frontmatter = matter(file).data;
                                    if (!hasStringField(frontmatter, 'type') || frontmatter.type != 'statement') {
                                        return undefined;
                                    }
                                    if (!hasStringField(frontmatter, 'kind') || !frontmatter.kind) {
                                        console.error('Statements must have a string-field `kind`.');
                                        return undefined;
                                    }
                                    if (!hasStringField(frontmatter, 'slug') || !frontmatter.slug) {
                                        console.error('Statements must have a string-field `slug`.');
                                        return undefined;
                                    }
                                    let katexMacros = {};
                                    if (hasObjectField(frontmatter, 'katex_macros') && frontmatter.katex_macros) {
                                        katexMacros = frontmatter.katex_macros;
                                    }

                                    return {
                                        parentId,
                                        kind: frontmatter.kind,
                                        slug: frontmatter.slug,
                                        item: item++,
                                        itemPrefix,
                                        filename,
                                        katexMacros,
                                    };
                                }),
                            );
                        }
                    }),
                );
            }
        });
    });
    const out: TouchStatementInput[] = [];
    for (const promise of promises) {
        const result = await promise();
        if (result) {
            out.push(result);
        }
    }
    return out;
}
