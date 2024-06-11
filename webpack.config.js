const webpack = require('webpack');
const path = require('path');
const htmlWebpackPlugin = require("html-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const RemoveUnusedDependenciesPlugin = require("./plugins/RemoveUnusedDependenciesPlugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    index: path.resolve(__dirname, "./src/index.js"),
    a: path.resolve(__dirname, "./src/a.js"),
    b: path.resolve(__dirname, "./src/b.js"),
  },
  output: {
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js',
    publicPath: process.env.PUBLIC_PATH || '/',
  },
  mode: 'production',
  devtool: false,
  module:{
    rules:[
      {
        test: /\.css$/,
        use:[MiniCssExtractPlugin.loader,'css-loader']
      },
    ]
  },
  plugins: [
    new RemoveUnusedDependenciesPlugin({
      // targetEntries: ['b', 'index']
    }),
    new htmlWebpackPlugin({
      filename: "index.html",
      template: path.resolve(__dirname, "./src/public/index.html"),
      chunks: ["index"],
    }),
    new htmlWebpackPlugin({
      filename: "a.html",
      template: path.resolve(__dirname, "./src/public/a.html"),
      chunks: ["a"],
    }),
    new htmlWebpackPlugin({
      filename: "b.html",
      template: path.resolve(__dirname, "./src/public/b.html"),
      chunks: ["b"],
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: "static"
    }),
    new MiniCssExtractPlugin()
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          name: "vendors"
        },
        default: false
      }
    },
  },
};
