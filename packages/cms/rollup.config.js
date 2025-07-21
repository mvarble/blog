import ts from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

export default [
    {
        input: 'src/lib.ts',
        output: [{ file: 'dist/lib.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/lib.ts',
        output: [{ file: 'dist/lib.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
    {
        input: 'src/plugin/index.ts',
        output: [{ file: 'dist/plugin.js', format: 'esm', sourcemap: true }],
        plugins: [ts(), string({ include: '**/*.sql' })],
    },
    {
        input: 'src/plugin/index.ts',
        output: [{ file: 'dist/plugin.d.ts', format: 'esm' }],
        plugins: [dts()],
    },
];
