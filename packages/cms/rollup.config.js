import ts from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

export default [
    {
        input: 'src/entries/db.ts',
        output: [{ file: 'dist/db.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/entries/db.ts',
        output: [{ file: 'dist/db.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
    {
        input: 'src/entries/mdsvex.ts',
        output: [{ file: 'dist/mdsvex.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/entries/mdsvex.ts',
        output: [{ file: 'dist/mdsvex.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
    {
        input: 'src/entries/vite.ts',
        output: [{ file: 'dist/vite.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/entries/vite.ts',
        output: [{ file: 'dist/vite.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
];
