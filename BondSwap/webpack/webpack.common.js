const path = require("path");
const eslint = require("eslint");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const commonPaths = require("./paths");
const convert = require('koa-connect');
const history = require('connect-history-api-fallback');

module.exports = {
  entry: commonPaths.entryPath,
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(ts|tsx)$/,
        loader: "eslint-loader",
        options: {
          formatter: eslint.CLIEngine.getFormatter("stylish"),
          emitWarning: process.env.NODE_ENV !== "production",
        },
      },
      {
        test: /\.(ts|tsx)$/,
        loader: "babel-loader",
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: commonPaths.imagesFolder,
              name: "[name].[contenthash:6].[ext]",
              esModule: false
            },
          },
        ],
      },
      {
        test: /\.(woff2|ttf|woff|eot|otf)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: commonPaths.fontsFolder,
              name: "[name].[contenthash:6].[ext]",
            },
          },
        ],
      },
    ],
  },
  serve: {
    add: (app) => {
      app.use(convert(history()));
    },
    content: commonPaths.entryPath,
    dev: {
      publicPath: commonPaths.outputPath,
    },
    open: true,
  },
  resolve: {
    modules: ["src", "node_modules"],
    extensions: ["*", ".json", ".js", ".jsx", ".ts", ".tsx", ".otf", ".png", ".jpg"],
    alias: {
      src: path.resolve(__dirname, "../src"),
    },
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new HtmlWebpackPlugin({
      template: commonPaths.templatePath,
    }),
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: "async",
    }),
  ],
};
