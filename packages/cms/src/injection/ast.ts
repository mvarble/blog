import path from 'path';
import { type RootContent, type Root } from 'mdast';
import { type Plugin } from 'unified';
import { type VFile } from 'vfile';
import type { KatexOptions } from 'katex';
import rehypeKatexSvelte from 'rehype-katex-svelte';

import { hasStringField, resolvePathname, tagRegex } from '../util';
import {
    connect,
    getPage,
    getPageReferences,
    foldKatexMacros,
    getCitations,
    getTagReferences,
} from '../db';

export const remarkCms: Plugin<[undefined?], Root, Root> = () => {
    const db = connect();
    return (root: Root, vfile: VFile) => {
        // obtain the page from CMS; if it is not present, we do nothing
        if (!hasStringField(vfile, 'filename')) {
            throw 'VFile has no filename.';
        }
        const filename = path.relative('.', vfile.filename);
        const page = getPage(db, filename);
        if (!page) return;

        // replace intra-cite references and links
        const pageReferences = getPageReferences(db, page.id);
        const tagReferences = getTagReferences(db, page.id);
        const citations = Object.fromEntries(
            getCitations(db).map((citation) => [citation.key, citation]),
        );
        const children: RootContent[] = root.children.toReversed();
        while (children.length > 0) {
            const node = children.pop()!;
            if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
                children.push(...node.children.toReversed());
            }

            if (node.type == 'math') {
                // TODO: add ID as well
                for (const tagMatch of node.value.matchAll(tagRegex)) {
                    const slug = tagMatch[1];
                    const tag = tagReferences[slug];
                    if (tag) {
                        node.value = node.value.replaceAll(tagMatch[0], `\\tag{${tag.label}}`);
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
                                tagMatch[0],
                                `\\tag{${tag.label}}`,
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
                        console.log(JSON.stringify(node, null, 2));
                    }
                }
            }

            if (node.type == 'link') {
                // if we have `/citations#key`, we try to resolve as a citation
                if (node.url.startsWith('/citations#')) {
                    const key = node.url.slice('/citations#'.length);
                    const citation = citations[key];
                    if (!citation) continue;
                    if (node.children.length == 1 && node.children[0].type == 'text') {
                        node.children[0].value = `[${key}, ${node.children[0].value}]`;
                    } else if (!node.children.length) {
                        node.children = [{ type: 'text', value: `[${key}]` }];
                    }
                    continue;
                }

                // if it starts with `tag:`, then resolve the tag
                if (node.url.startsWith('tag:')) {
                    const slug = node.url.slice('tag:'.length);
                    const tag = tagReferences[slug];
                    if (!tag) continue;
                    node.url = `/${tag.pathname}#${slug}`;
                    node.children = [{ type: 'text', value: tag.label }];
                }

                // make sure there is some text to potentially replace
                if (node.children.length != 1 || node.children[0].type != 'text') continue;
                const child = node.children[0];

                // resolve the pathname in the way it is shoved into the database
                const pathname = resolvePathname(page.pathname, node.url);
                if (!pathname) continue;

                // otherwise, we try to resolve as a page
                const ref = pageReferences[pathname];
                if (!ref) continue;

                // perform replacement
                if (hasStringField(ref, 'title')) {
                    child.value = child.value.replaceAll('%title', ref.title);
                }
                if (hasStringField(ref, 'label')) {
                    child.value = child.value.replaceAll('%label', ref.label);
                }
                if (hasStringField(ref, 'kind')) {
                    child.value = child.value.replaceAll('%kind', ref.kind);
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
        const page = getPage(db, filename);
        if (!page) return;
        const katexMacros = foldKatexMacros(db, page.id, page.katexMacros);
        // @ts-expect-error: rehypeKatexSvelte actually has this API
        rehypeKatexSvelte({
            macros: {
                ...(options?.macros || {}),
                ...katexMacros,
            },
        })(tree);
    };
};
