const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const isDevMode = process.env.NODE_ENV === "development";

module.exports = {
    entry: "./src/publish/publish.admonition.ts",
    output: {
        path: path.resolve(__dirname, "./publish"),
        filename: "publish.admonition.txt",
        libraryTarget: "commonjs"
    },
    target: "web",
    mode: isDevMode ? "development" : "production",
    ...(/* isDevMode ? { devtool: "eval" } :  */{}),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    transpileOnly: true
                }
            },
            {
                test: /\.css?$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            url: false
                        }
                    }
                ]
            },
            {
                test: /^publish/,
                type: "raw-loader"
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: "./manifest.json", to: "." }]
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        }),
        new MiniCssExtractPlugin({
            filename: "publish.admonition.css"
        })
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        mainFields: ["browser", "module", "main"],
        alias: {
            src: path.resolve(__dirname, "src")
        }
    },
    externals: {
    }
};
