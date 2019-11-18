/**
 * Copyright 2019 the orbs-client-sdk-javascript authors
 * This file is part of the orbs-client-sdk-javascript library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

const path = require("path");
var nodeExternals = require("webpack-node-externals");

const production = process.env.NODE_ENV === "production";
const libraryName = "OrbsPOSData";
const plugins = [];

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// plugins.push(new BundleAnalyzerPlugin());
function genConfig(target, entry, filename) {
  return {
    target,
    externals: [nodeExternals()],
    mode: production ? "production" : "development",
    devtool: production ? "" : "inline-source-map",
    entry,
    output: {
      path: path.join(__dirname, "dist"),
      filename,
      library: libraryName,
      libraryTarget: "umd",
      umdNamedDefine: true,
    },
    resolve: {
      extensions: [".js", ".ts"],
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/env", { modules: false }], "@babel/typescript"],
              plugins: ["@babel/plugin-transform-runtime", "@babel/plugin-proposal-class-properties", "@babel/plugin-proposal-object-rest-spread"],
            },
          },
        },
      ],
    },
  }
}

const webConfig = genConfig("web", "./src/index.ts", `orbs-pos-data-web.js`);
const nodeConfig = genConfig("node", "./src/index.ts", `orbs-pos-data.js`);
const nodeTestKitConfig = genConfig("node", "./src/testkit/index.ts", `testkit.js`);

module.exports = [webConfig, nodeConfig, nodeTestKitConfig];
