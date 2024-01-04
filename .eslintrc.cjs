/** @type {import('eslint').Linter.BaseConfig} */
module.exports = {
  extends: ['@napaling'],
  rules: {
    '@stylistic/lines-around-comment': [
      'error',
      { afterHashbangComment: true },
    ],
    '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true }],
    'import/consistent-type-specifier-style': 'error',
  },
};
