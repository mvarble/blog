// `vite.config.ts` lists `**/*.glb` in `assetsInclude`, so importing one yields
// its URL. Vite's own client types cover images and media but not model formats.
declare module '*.glb' {
    const src: string;
    export default src;
}
