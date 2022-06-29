// prettier.config.js
module.exports = {
  plugins: [
    require('prettier-plugin-tailwindcss'),
    require('@trivago/prettier-plugin-sort-imports'),
  ],

  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',

  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
