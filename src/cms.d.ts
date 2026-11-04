// The content layer's queries, served by the `createCms` plugin in
// `vite.config.ts`. Server-only: import it from `+page.server` and
// `+layout.server` modules.
declare module '$cms' {
    export const cms: import('@mvarble/mesearch-cms/presets/blog').BlogCms;
}
