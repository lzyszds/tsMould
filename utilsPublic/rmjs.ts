//node 删除项目中所有js文件
import fs from 'node:fs'
import path from "node:path";

const files = fs.readdirSync(path.resolve(__dirname, '../'));
const exclude = [
    'node_modules',
    '.git',
    '.idea',
    'dist',
    'public',
    "webpack.config.js"
]

// 使用递归寻找出所有的js文件
const findJs = (files: string[], basePath: string): string[] => {
    const jsFiles: string[] = [];
    files.forEach((item) => {
        const fullPath = path.join(basePath, item); // 获取文件的完整路径
        if (exclude.includes(item)) return;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const dirFiles = fs.readdirSync(fullPath);
            jsFiles.push(...findJs(dirFiles, fullPath)); // 传入完整路径递归查找子目录
        } else {
            if (item.endsWith('.js')) {
                jsFiles.push(fullPath);
            }
        }
    });
    return jsFiles;
};
const jsFiles = findJs(files, path.resolve(__dirname, '../'));
jsFiles.forEach((item) => {
    fs.unlinkSync(item);
})