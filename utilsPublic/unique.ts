/*
* 工具 字体压缩工具
* node查看文字是否重复出现，重复出现则删除当前文字
* 工作原理：每次发送请求都会将数据放进./font.txt中，每一个小时去重一次
* 每天0点 通过fontmin压缩txt中的字体，生成字体文件woff、ttf
* 这样做是为了减小字体文件过大的问题，避免浪费资源
* */

// 1. 读取文件
import fs from "node:fs"
import path from "node:path"
import Fontmin from "fontmin";
import {processFileContent} from "../src/utils/common";
//将txt进行去重
processFileContent()

const filePath = path.join(__dirname, "./font.txt")

const fontfiles = fs.readdirSync(path.resolve(__dirname, '../public/font/fonts'))
let fontmin;
fontfiles.forEach(res => {
    const srcPath: string = 'public/font/fonts/' + res; // 字体源文件
    const destPath: string = 'public/font/dist';    // 输出路径
    let text = fs.readFileSync(filePath, "utf-8") as string

    // 初始化
    fontmin = new Fontmin()
        .src(srcPath)               // 输入配置
        .use(Fontmin.glyph({        // 字型提取插件
            text: text              // 所需文字
        }))
        // .use(Fontmin.ttf2eot())     // eot 转换插件
        .use(Fontmin.ttf2woff())    // woff 转换插件
        // .use(Fontmin.ttf2svg())     // svg 转换插件
        .dest(destPath);            // 输出配置

    // 执行
    fontmin.run(function (err: any, files: any, stream: any) {
        if (err) {                  // 异常捕捉
            console.error(err);
        }
        console.log('成功', res);        // 成功
    });
})

