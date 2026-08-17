import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';
import { defineConfig, includeIgnoreFile } from 'eslint/config';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    ts.configs.recommended,
    prettier,
    {
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        rules: {
            'no-undef': 'off',
        },
    },
    {
        ignores: ['./dist'],
    },
    {
        rules: {
            'comma-dangle': [2, 'always-multiline'],
        },
    },
);
