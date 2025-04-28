const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');
const reactRefresh = require('eslint-plugin-react-refresh');
const prettier = require('eslint-plugin-prettier');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['dist', 'build', 'node_modules', '.venv', 'src/components/ui/**'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
