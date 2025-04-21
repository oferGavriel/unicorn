module.exports = {
  root: false,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsxPragma: 'React',
  },
  settings: { react: { version: 'detect' } },
  env: { browser: true, node: true, es2022: true },
  ignorePatterns: ['dist', 'build', 'node_modules', '.venv'],
};
