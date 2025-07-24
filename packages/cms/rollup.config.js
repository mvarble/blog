import ts from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

export default [
    {
        input: 'src/lib/db.ts',
        output: [{ file: 'dist/db.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/lib/db.ts',
        output: [{ file: 'dist/db.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
    {
        input: 'src/lib/mdsvex.ts',
        output: [{ file: 'dist/mdsvex.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/lib/mdsvex.ts',
        output: [{ file: 'dist/mdsvex.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
    {
        input: 'src/lib/vite.ts',
        output: [{ file: 'dist/vite.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/lib/vite.ts',
        output: [{ file: 'dist/vite.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
];
