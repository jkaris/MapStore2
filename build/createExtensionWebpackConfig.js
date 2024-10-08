const path = require("path");

const shared = require('./moduleFederation').shared;
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
/**
 * Produces a webpack configuration that allow to create a MapStore extension.
 * It works together with the ModuleFederationPlugin present in MapStore's webpack configuration.
 * @param {object} cfg configuration passed to this utility function
 * @param {boolean} cfg.prod discriminates the production or development environment
 * @param {string} cfg.name the name of the plugin/extension
 * @param {object} cfg.exposes this is the main entry point of the module federation plugin. For MapStore extension plugin it must be { './plugin': "path/to/the/plugin/file>"}
 * @param {boolean} cfg.sharedLibrariesEager this flag controls whether shared libraries should be included into index.js of extensions or loaded asynchronously
 * @param {object} cfg.alias aliases for the JS build
 * @param {object} cfg.publicPath the publicPath, useful for debugging
 * @param {string} cfg.destination the destination folder of the build packages
 * @param {array} cfg.plugins additional plugins, more then the default ones.
 * @param {object} cfg.overrides any other configuration you want to add to the configuration.
 */
module.exports = ({ prod = true, name, exposes, sharedLibrariesEager = true, alias = {}, publicPath, destination, plugins = [], overrides = {} }) => ({
    target: "web",
    mode: prod ? "production" : "development",
    entry: {},
    optimization: {
        minimize: !!prod,
        ...(prod && {
            minimizer: [
                // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`)
                `...`,
                new CssMinimizerPlugin() // minify css bundle
            ]
        })
    },
    resolve: {
        fallback: {
            path: false,
            http: false,
            https: false,
            zlib: false,
            timers: false,
            stream: false
        },
        extensions: [".js", ".jsx"],
        alias
    },
    plugins: [new ModuleFederationPlugin({
        name,
        filename: "index.js", // "bundle.[chunkhash:8].js", // [chunkhash:8]
        exposes,
        shared: Object.keys(shared).reduce((prev, el) => {
            prev[el] = {...shared[el], eager: sharedLibrariesEager};
            return prev;
        }, {})
    }),
    new MiniCssExtractPlugin({
        filename: "assets/css/[name].css"
    }), ...plugins],
    module: {
        noParse: [/html2canvas/],
        rules: [
            {
                test: /\.css$/,
                use: [
                    prod ? MiniCssExtractPlugin.loader : "style-loader", // because HMR do not work with mini-css plugin
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.jsx?$/,
                exclude: /(ol\.js)$|(Cesium\.js)$/,
                use: [{
                    loader: "babel-loader",
                    options: {
                        configFile: path.join(__dirname, 'babel.config.js')
                    }
                }]
            }, {
                test: /\.(png|jpg|gif|svg)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        name: "assets/img/[path][name][hash].[ext]",
                        limit: 8192
                    }
                }] // inline base64 URLs for <=8k images, direct URLs for the rest
            }
        ]
    },
    output: {
        hashFunction: "xxhash64", // needed for newer version of node (> version 16)
        publicPath,
        chunkFilename: 'assets/js/[name].[chunkhash:8].js',
        path: destination,
        uniqueName: name
    },
    ...overrides
});
