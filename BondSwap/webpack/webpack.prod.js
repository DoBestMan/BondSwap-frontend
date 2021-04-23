const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const { getThemeVariables } = require("antd/dist/theme");

const commonPaths = require("./paths");

module.exports = {
  mode: "production",
  output: {
    filename: `${commonPaths.jsFolder}/[name].[contenthash:6].js`,
    path: commonPaths.outputPath,
    chunkFilename: `${commonPaths.jsFolder}/[name].[contenthash:6].js`,
    publicPath: "/",
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: false,
        extractComments: false,
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            inline: 2,
            comparisons: false,
            warnings: false,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
          },
        },
      }),
      new OptimizeCSSAssetsPlugin(),
    ],
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      cacheGroups: {
        react: {
          test: /react|react-dom|classnames/,
          name: "react",
          chunks: "initial",
          priority: 8,
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "initial",
          priority: 5,
        },
        ethers: {
          test: /ethers/,
          name: "ethers",
          chunks: "initial",
          priority: 10,
        },
        async: {
          test: /[\\/]node_modules[\\/]/,
          name: "async",
          chunks: "async",
          minChunks: 4,
        },
      },
    },
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: true,
  },

  module: {
    rules: [
      {
        test: /\.(css|less)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: false,
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: getThemeVariables({
                  dark: true,
                }),
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `${commonPaths.cssFolder}/[name].[contenthash:6].css`,
      chunkFilename: `${commonPaths.cssFolder}/[name].[contenthash:6].css`,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
    }),
  ],
  devtool: false,
};
