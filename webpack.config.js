// webpack.config.js
const path = require('path');

module.exports = {
    entry: './app.ts',
    target: 'node',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'), // 输出文件夹路径
        publicPath: '/' // 公共路径，用于处理静态资源的访问路径
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    optimization: {
        minimize: false
    },

    mode: 'production' // 生产模式，会对代码进行优化
};
