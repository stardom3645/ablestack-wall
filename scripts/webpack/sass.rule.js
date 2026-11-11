'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = function (options) {
  const use = (esModule) => [
    MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        importLoaders: 2,
        // Preserve this font URL relative to the extracted stylesheet. ESM URL
        // generation otherwise resolves it against the build-time root URL.
        esModule,
        // Legacy Grafana assets keep their public URLs, but Monaco's relative
        // icon font must be emitted and rewritten by webpack in production too.
        url: options.preserveUrl || { filter: (url) => /(^|\/)codicon\.ttf(?:\?|$)/.test(url) },
        sourceMap: options.sourceMap,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: options.sourceMap,
        postcssOptions: {
          config: path.resolve(__dirname),
        },
      },
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: options.sourceMap,
      },
    },
  ];
  return {
    test: /\.(sa|sc|c)ss$/,
    exclude: /wall-modern[\\/]modern\.css$/,
    oneOf: [{ test: /[\\/]codicon\.css$/, use: use(false) }, { use: use(true) }],
  };
};
