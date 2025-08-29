import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginImport from 'eslint-plugin-import';
import pluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginJest from 'eslint-plugin-jest';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  configPrettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.jest
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
          tsx: true
        },
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
      import: pluginImport,
      'simple-import-sort': pluginSimpleImportSort,
      jest: pluginJest,
      prettier: pluginPrettier
    },
    settings: {
      react: {
        version: 'detect'
      },
      jest: {
        version: 'detect',
        globalAliases: {
          describe: ['context'],
          fdescribe: ['fcontext'],
          xdescribe: ['xcontext']
        }
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json'
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },
    rules: {
      'prettier/prettier': [
        'warn',
        {
          singleQuote: true,
          semi: true
        }
      ],

      'react-refresh/only-export-components': 'warn',
      ...pluginReactHooks.configs.recommended.rules,

      'no-multiple-empty-lines': [2, { max: 2 }],
      semi: [2, 'always'],
      curly: ['warn'],
      'prefer-template': ['warn'],
      'space-before-function-paren': [0, { anonymous: 'always', named: 'always' }],
      camelcase: 0,
      'no-return-assign': 0,
      quotes: ['error', 'single'],

      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      'import/no-unresolved': 0,
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-duplicates': 'warn',
      'import/no-named-as-default': 0,

      ...pluginJest.configs.recommended.rules
    }
  },

  {
    files: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}', '**/__tests__/**'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    },
    rules: {
      'jest/expect-expect': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/prefer-to-have-length': 'warn',
      'no-unused-vars': 'off'
    }
  },

  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      '.eslintrc.*',
      'src/components/**'
    ]
  }
]);
