const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    context: path.resolve(__dirname, "src"),
    entry: "./index.js",
    module: {
        rules: [
            {
                test: /\.jsx$/,
                loader: 'buble-loader',
                include: path.join(__dirname, 'src'),
                options: {
                    objectAssign: 'Object.assign'
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({template: './index.html'})
    ],
    resolve: {
        extensions: ['.js', '.jsx']
    },
    target: "web",
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, "dist"),
    },
    optimization: {
        usedExports: true
    }
};