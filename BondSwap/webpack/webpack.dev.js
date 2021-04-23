const webpack = require("webpack");
const { getThemeVariables } = require("antd/dist/theme");
const commonPaths = require("./paths");

module.exports = {
  mode: "development",
  output: {
    filename: "[name].js",
    path: commonPaths.outputPath,
    chunkFilename: "[name].js",
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.(css|less)$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: getThemeVariables({
                  dark: true,
                  // black: "#090c2a",
                  // "primary-color": "#262627",
                  // "link-color": "#262627",
                  // "border-radius-base": "4px",
                  // "font-size-base": "16px",
                  // "font-size-sm": "14px",
                }),
              },
            },
          },
        ],
      },
    ],
  },
  devServer: {
    contentBase: commonPaths.outputPath,
    compress: true,
    hot: true,
    historyApiFallback: true,
    proxy: {
      "/api/": "http://localhost:3000/",
    },
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};
