import path from 'path';
import { type RootContent, type Root } from 'mdast';
import { type Plugin } from 'unified';
import { type VFile } from 'vfile';
import type { KatexOptions } from 'katex';
import rehypeKatexSvelte from 'rehype-katex-svelte';

import { hasStringField, resolvePathname, eqRegex } from '../util';
import {
    connect,
    getPageReferences,
    foldKatexMacros,
    getCitations,
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
            getCitations(db).map((citation) => [citation.key, citation]),
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
                                node.data.hProperties.id = slug;
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
                    const label = `${citation.authors[0].lastname.slice(0, 4)}${String(citation.year).slice(-2)}`;
                    node.url = `/citations#${key}`;
                    if (node.children.length == 1 && node.children[0].type == 'text') {
                        node.children[0].value = `[${label}, ${node.children[0].value}]`;
                    } else if (!node.children.length) {
                        node.children = [{ type: 'text', value: `[${label}]` }];
                    }
                    continue;
                }

                // if it starts with `eq:`, we try to resolve as an equation
                if (node.url.startsWith('eq:')) {
                    const slug = node.url.slice('eq:'.length);
                    const eq = eqReferences[slug];
                    if (!eq) continue;
                    node.url = `/${eq.pathname}#${slug}`;
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
