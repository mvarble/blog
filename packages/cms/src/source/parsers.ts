import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMath from 'remark-math';
import rehypeParse from 'rehype-parse';
import matter from 'gray-matter';
import { fromJs } from 'esast-util-from-js';
import type { RootContent as RemarkContent } from 'mdast';
import type { RootContent as RehypeContent } from 'hast';

import {
    type Database,
    touchTag,
    touchStatement,
    touchPageReference,
    touchTagReference,
} from '../db';
import { buildLabel, resolvePathname, tagRegex } from '../util';
import { parseStatementFrontmatter } from './tables/statements';

const remark = unified().use(remarkParse).use(remarkFrontmatter).use(remarkMath);
const rehype = unified().use(rehypeParse);

const componentRegex = /<(\w+)\s+\{\.\.\.(\w+)\}\s*(\/?)>/g;

export async function nodeParser(
    db: Database,
    page: { id: number; pathname: string; filename: string },
    contents: string,
    item: number,
    itemPrefix: number | undefined = undefined,
): Promise<number> {
    // create our node-visiting state
    const nodes: Node[] = [];
    const imports: Record<string, string> = {};
    let itemsAdded = 0;

    // initialize our visitor buffer
    const root = remark.parse(contents);
    nodes.push(
        ...root.children.toReversed().map((source) => ({ kind: 'remark', source }) as RemarkNode),
    );

    // visit nodes depth-first
    while (nodes.length > 0) {
        const typedNode = nodes.pop()!;

        // if we are visiting a remark node, we must check for the following:
        //   - tags within math blocks
        //   - tags within numbered lists
        //   - `<Component {...blob}>` for `blob` SVX imports
        //   - HTML blocks
        if (typedNode.kind == 'remark') {
            const node = typedNode.source;

            // check math blocks for `@tag(...)`
            itemsAdded += checkMathTags(db, node, page.id, item + itemsAdded, itemPrefix);

            // check ordered lists for `@tag(...)`
            itemsAdded += checkNumberedListTags(db, node, page.id, item + itemsAdded, itemPrefix);

            // check for components that aren't detected as HTML; expand the search if they are an import
            if (node.type == 'text') {
                const spreadComponents = node.value.matchAll(componentRegex);
                for (const [, component, prop] of spreadComponents) {
                    const componentPath = imports[component];
                    const propPath = imports[prop];
                    if (
                        componentPath &&
                        propPath &&
                        (componentPath == '$lib/components/statement.svelte' ||
                            remapFile(page.filename, componentPath) ==
                                'src/lib/components/statement.svelte')
                    ) {
                        itemsAdded += await recurseChild(
                            propPath,
                            db,
                            page,
                            item + itemsAdded,
                            itemPrefix,
                        );
                    }
                }
            }

            // if HTML, parse and expand the search
            if (node.type == 'html') {
                const root = rehype.parse(node.value);
                nodes.push(
                    ...root.children
                        .toReversed()
                        .map((source) => ({ kind: 'rehype', source }) as RehypeNode),
                );
            }

            if ('children' in node && Array.isArray(node.children) && node.children.length) {
                nodes.push(
                    ...node.children
                        .toReversed()
                        .map((source) => ({ kind: 'remark', source }) as RemarkNode),
                );
            }
        }

        // if we are visiting a rehype node, we must check for the following:
        //   - imports in script tag
        //   - SVX components
        if (typedNode.kind == 'rehype') {
            const node = typedNode.source;

            checkImports(node, imports);

            if (node.type == 'element') {
                const componentPath = imports[node.tagName];
                if (componentPath && componentPath.endsWith('.svx')) {
                    itemsAdded += await recurseChild(
                        componentPath,
                        db,
                        page,
                        item + itemsAdded,
                        itemPrefix,
                    );
                }
            }

            if ('children' in node && Array.isArray(node.children) && node.children.length) {
                nodes.push(
                    ...node.children
                        .toReversed()
                        .map((source) => ({ kind: 'rehype', source }) as RehypeNode),
                );
            }
        }
    }
    return itemsAdded;
}

export function edgeParser(
    db: Database,
    page: { id: number; pathname: string; filename: string },
    contents: string,
) {
    const root = remark.parse(contents);
    const nodes: RemarkContent[] = root.children.toReversed();
    while (nodes.length > 0) {
        const node = nodes.pop()!;
        if (node.type == 'math') {
            for (const [, slug] of node.value.matchAll(tagRegex)) {
                touchTagReference(db, page.id, slug);
            }
        }
        if (node.type == 'link') {
            const absPathname = resolvePathname(page.pathname, node.url);
            if (absPathname && absPathname.startsWith('tag:')) {
                const tag = touchTagReference(db, page.id, absPathname.slice('tag:'.length));
                if (!tag) {
                    console.error(`'${absPathname}' does not resolve to a tag in the site.`);
                }
            }
            if (absPathname && !absPathname.startsWith('citations')) {
                const ref = touchPageReference(db, page.id, absPathname);
                if (!ref) {
                    console.error(`'${absPathname}' does not resolve to a page in the site.`);
                }
            }
        }
        if ('children' in node && Array.isArray(node.children) && node.children.length) {
            nodes.push(...node.children.toReversed());
        }
    }
}

function checkMathTags(
    db: Database,
    node: RemarkContent,
    parentId: number,
    item: number,
    itemPrefix?: number,
): number {
    if (node.type != 'math') return 0;
    let itemsAdded = 0;
    for (const [, slug] of node.value.matchAll(tagRegex)) {
        touchTag(db, {
            parentId,
            slug,
            label: buildLabel(item + itemsAdded++, itemPrefix),
        });
    }
    return itemsAdded;
}

function checkNumberedListTags(
    db: Database,
    node: RemarkContent,
    parentId: number,
    item: number,
    itemPrefix?: number,
): number {
    if (node.type != 'list' || !node.ordered) return 0;
    let itemsAdded = 0;
    node.children.forEach((child) => {
        child.children.forEach((child) => {
            if (child.type == 'paragraph' && child.children.length) {
                child.children.forEach((child) => {
                    if (child.type == 'text') {
                        for (const [, slug] of child.value.matchAll(tagRegex)) {
                            touchTag(db, {
                                parentId,
                                slug,
                                label: buildLabel(item + itemsAdded++, itemPrefix),
                            });
                        }
                    }
                });
            }
        });
    });
    return itemsAdded;
}

function checkImports(node: RehypeContent, imports: Record<string, string>) {
    if (
        node.type != 'element' ||
        node.tagName != 'script' ||
        node.children.length != 1 ||
        node.children[0].type != 'text'
    )
        return;
    const script = fromJs(node.children[0].value, { module: true });
    script.body.forEach((node) => {
        visit(node, 'ImportDeclaration', (node) => {
            if (
                node.source.type == 'Literal' &&
                typeof node.source.value == 'string' &&
                node.source.value &&
                ((node.source.value.startsWith('.') && node.source.value.endsWith('.svx')) ||
                    (node.source.value.startsWith('.') &&
                        node.source.value.endsWith('statement.svelte')) ||
                    node.source.value == '$lib/components/statement.svelte') &&
                node.specifiers.length == 1 &&
                (node.specifiers[0].type == 'ImportDefaultSpecifier' ||
                    node.specifiers[0].type == 'ImportNamespaceSpecifier')
            ) {
                imports[node.specifiers[0].local.name] = node.source.value;
            }
        });
    });
}

function remapFile(baseFilename: string, relativeFilename: string) {
    return path.relative('.', path.resolve(path.dirname(baseFilename), relativeFilename));
}

async function recurseChild(
    relFilename: string,
    db: Database,
    page: { id: number; pathname: string; filename: string },
    item: number,
    itemPrefix?: number,
): Promise<number> {
    let itemsAdded = 0;
    const filename = remapFile(page.filename, relFilename);
    const contents = await fs.promises.readFile(filename, 'utf8');
    const frontmatter = matter(contents).data;
    const statementFrontmatter = parseStatementFrontmatter(filename, frontmatter);
    if (statementFrontmatter) {
        const statement = touchStatement(db, {
            ...statementFrontmatter,
            parentId: page.id,
            kind: frontmatter.kind,
            label: buildLabel(item + itemsAdded++, itemPrefix),
            filename,
        });
        itemsAdded += await nodeParser(
            db,
            {
                id: statement.pageId,
                pathname: statement.pathname,
                filename: statement.filename,
            },
            contents,
            item + itemsAdded,
            itemPrefix,
        );
    }
    return itemsAdded;
}

interface RemarkNode {
    kind: 'remark';
    source: RemarkContent;
}

interface RehypeNode {
    kind: 'rehype';
    source: RehypeContent;
}

type Node = RemarkNode | RehypeNode;
