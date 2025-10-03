import path from 'path';
import { type RootContent, type Root } from 'mdast';
import type { RootContent as RehypeContent } from 'hast';
import { type Plugin } from 'unified';
import { type VFile } from 'vfile';
import type { KatexOptions } from 'katex';
import rehypeKatexSvelte from 'rehype-katex-svelte';

import { hasStringField, resolvePathname, eqRegex } from '../util';
import {
    connect,
    getPageReferences,
    foldKatexMacros,
    getCitationReferences,
    getStatementReferences,
    getEquationReferences,
    getMddoc,
    getRelevantPathname,
} from '../db';

export const remarkCms: Plugin<[undefined?], Root, Root> = () => {
    const db = connect();
    return (root: Root, vfile: VFile) => {
        // obtain the page from CMS; if it is not present, we do nothing
        if (!hasStringField(vfile, 'filename')) {
            throw 'VFile has no filename.';
        }
        const filename = path.relative('.', vfile.filename);
        const mddoc = getMddoc(db, filename);
        if (!mddoc) return;
        const pathname = getRelevantPathname(db, mddoc.id);

        // replace intra-cite references and links
        const citations = Object.fromEntries(
            getCitationReferences(db, mddoc.id).map((citation) => [citation.key, citation]),
        );
        const eqReferences = Object.fromEntries(
            getEquationReferences(db, mddoc.id).map((obj) => [obj.slug, obj]),
        );
        const statementReferences = Object.fromEntries(
            getStatementReferences(db, mddoc.id).map((obj) => [obj.slug, obj]),
        );
        const pageReferences = Object.fromEntries(
            getPageReferences(db, mddoc.id).map((obj) => [obj.pathname, obj]),
        );
        const children: RootContent[] = root.children.toReversed();
        while (children.length > 0) {
            const node = children.pop()!;
            if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
                children.push(...node.children.toReversed());
            }

            // replace `@tag($slug)` within math blocks with `\label{$eq.label}`
            // (where `$eq` is the equation with `$eq.slug = $slug`)
            if (node.type == 'math') {
                for (const eqMatch of node.value.matchAll(eqRegex)) {
                    const slug = eqMatch[1];
                    const eq = eqReferences[slug];
                    if (eq) {
                        node.value = node.value.replaceAll(eqMatch[0], `\\tag{${eq.label}}`);
                        if (
                            node.data &&
                            'hChildren' in node.data &&
                            Array.isArray(node.data.hChildren) &&
                            node.data.hChildren.length == 1 &&
                            typeof node.data.hChildren[0] == 'object' &&
                            'value' in node.data.hChildren[0] &&
                            typeof node.data.hChildren[0].value == 'string'
                        ) {
                            node.data.hChildren[0].value = node.data.hChildren[0].value.replaceAll(
                                eqMatch[0],
                                `\\tag{${eq.label}}`,
                            );
                            if (
                                'hProperties' in node.data &&
                                typeof node.data.hProperties == 'object' &&
                                node.data.hProperties
                            ) {
                                // @ts-expect-error: weird typing of remark-math@3.0.0
                                node.data.hProperties.id = `eq:${slug}`;
                            }
                        }
                    }
                }
            }

            // substitute custom link directives
            if (node.type == 'link') {
                // if it starts with `cite:`, we try to resolve as a citation
                if (node.url.startsWith('cite:')) {
                    const key = node.url.slice('cite:'.length);
                    const citation = citations[key];
                    if (!citation) continue;
                    node.url = citation.pathname;
                    if (node.children.length == 1 && node.children[0].type == 'text') {
                        node.children[0].value = `[${citation.label}, ${node.children[0].value}]`;
                    } else if (!node.children.length) {
                        node.children = [{ type: 'text', value: `[${citation.label}]` }];
                    }
                    continue;
                }

                // if it starts with `eq:`, we try to resolve as an equation
                if (node.url.startsWith('eq:')) {
                    const slug = node.url.slice('eq:'.length);
                    const eq = eqReferences[slug];
                    if (!eq) continue;
                    node.url = eq.pathname;
                    node.children = [{ type: 'text', value: `(${eq.label})` }];
                }

                // if it starts with `statement:`, we try to resolve as a statement
                if (node.url.startsWith('statement:')) {
                    const key = node.url.slice('statement:'.length);
                    const statement = statementReferences[key];
                    if (!statement) continue;
                    node.url = statement.pathname;
                    if (node.children.length != 1 || node.children[0].type != 'text') continue;
                    const child = node.children[0];
                    child.value = child.value.replaceAll('%label', statement.label);
                    child.value = child.value.replaceAll('%kind', statement.kind);
                    child.value = child.value.replaceAll('%full', statement.full);
                }

                // make sure there is some text to potentially replace
                if (node.children.length != 1 || node.children[0].type != 'text') continue;
                const child = node.children[0];

                // resolve the pathname in the way it is shoved into the database
                const linkpath = resolvePathname(pathname, node.url);
                if (!linkpath) continue;
                const ref = pageReferences[linkpath];
                if (!ref) continue;

                // perform replacement
                if (hasStringField(ref, 'title')) {
                    child.value = child.value.replaceAll('%title', ref.title);
                }
                if (hasStringField(ref, 'label')) {
                    child.value = child.value.replaceAll('%label', ref.label);
                }
                if (hasStringField(ref, 'sequence')) {
                    child.value = child.value.replaceAll('%sequence', ref.sequence);
                }
                if (hasStringField(ref, 'full')) {
                    child.value = child.value.replaceAll('%full', ref.full);
                }
            }
        }

        return root;
    };
};

export const rehypeCms: Plugin<[KatexOptions?]> = (options) => {
    const db = connect();
    return (tree, vfile) => {
        // fold the katex macros of all the (potential) parents
        //
        // - statement -> post
        // - statement -> sequence-child -> .. -> sequence-child -> sequence
        // - sequence-child -> .. -> sequence-child -> sequence
        if (!hasStringField(vfile, 'filename')) {
            throw 'VFile has no filename.';
        }
        const filename = path.relative('.', vfile.filename);
        const mddoc = getMddoc(db, filename);
        if (!mddoc) return;
        const katexMacros = foldKatexMacros(db, mddoc.id, mddoc.katexMacros);
        // @ts-expect-error: rehypeKatexSvelte actually has this API
        rehypeKatexSvelte({
            macros: {
                ...(options?.macros || {}),
                ...katexMacros,
            },
        })(tree);
    };
};

export const rehypeKatexBox: Plugin<[]> = () => {
    interface VisitState {
        parent: { children: RehypeContent[] };
        child: RehypeContent;
        index: number;
    }

    function visitor({ parent, child, index }: VisitState) {
        // find any katex display block
        if (
            child.type != 'element' ||
            child.tagName != 'div' ||
            !('className' in child.properties) ||
            !Array.isArray(child.properties.className) ||
            !child.properties.className.includes('math') ||
            !child.properties.className.includes('math-display')
        ) {
            return;
        }

        // see if it has a tag (super dirty, but what the hell)
        let tag: string | undefined = undefined;
        if (
            child.children.length == 1 &&
            child.children[0].type == 'text' &&
            child.children[0].value.startsWith('{@html')
        ) {
            const startIndex = child.children[0].value.indexOf('<span class=\\"tag\\"');
            if (startIndex > 0) {
                const rest = child.children[0].value.slice(startIndex);
                let depth = 0;
                let stopIndex = 0;
                while (stopIndex < rest.length) {
                    // Found opening <span
                    if (rest.slice(stopIndex, stopIndex + 5) === '<span') {
                        depth++;
                        stopIndex += 5;
                        // Skip to end of opening tag
                        while (stopIndex < rest.length && rest[stopIndex] !== '>') stopIndex++;
                        stopIndex++; // Skip the '>'
                    }
                    // Found closing </span>
                    else if (rest.slice(stopIndex, stopIndex + 7) === '</span>') {
                        depth--;
                        stopIndex += 7;
                        if (depth === 0) {
                            break;
                        }
                    } else {
                        stopIndex++;
                    }
                }
                stopIndex += startIndex;

                const beforeText = child.children[0].value.slice(0, startIndex);
                tag = child.children[0].value.slice(startIndex, stopIndex);
                const afterText = child.children[0].value.slice(stopIndex);
                child.children[0].value = beforeText + afterText;
            }
        }

        const mathDiv: RehypeContent = {
            type: 'element',
            tagName: 'div',
            properties: {
                className: ['math-scroll-container'],
            },
            children: [
                {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: ['math-container'],
                    },
                    children: [child],
                },
            ],
        };

        if (tag) {
            parent.children[index] = {
                type: 'element',
                tagName: 'div',
                properties: {
                    className: ['math-tag-container'],
                },
                children: [
                    mathDiv,
                    {
                        type: 'element',
                        tagName: 'div',
                        properties: {
                            className: ['math-tag'],
                        },
                        children: [
                            {
                                type: 'text',
                                value: `{@html "${tag}"}`,
                            },
                        ],
                    },
                ],
            };
        } else {
            parent.children[index] = mathDiv;
        }
    }

    return (tree) => {
        if (!('children' in tree) || !Array.isArray(tree.children)) {
            return;
        }

        const n = tree.children.length - 1;
        const nodes: VisitState[] = tree.children.toReversed().map(
            (child, i) =>
                ({
                    parent: tree,
                    child,
                    index: n - i,
                }) as VisitState,
        );

        while (nodes.length > 0) {
            const node = nodes.pop()!;
            visitor(node);
            if ('children' in node.child && Array.isArray(node.child)) {
                const n = node.child.children.length - 1;
                nodes.push(
                    ...node.child.children.toReversed().map(
                        (child, i) =>
                            ({
                                parent: node.child,
                                child,
                                index: n - i,
                            }) as VisitState,
                    ),
                );
            }
        }
    };
};
