/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    // ensure semicolons
    'semi': ['error', 'always'],
    // ensure trailing commas
    'comma-dangle': ['error', 'always-multiline'],
    // ensure single quotes
    'quotes': ['error', 'single'],
    // ensure no unused variables
    'no-unused-vars': 'error',
  },
};
