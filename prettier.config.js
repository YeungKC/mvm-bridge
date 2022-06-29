// prettier.config.js
module.exports = {
  plugins: [
    require('@trivago/prettier-plugin-sort-imports'),
    require('prettier-plugin-tailwindcss'),
  ],

  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,
  trailingComma: 'all',

  importOrder: ['^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
