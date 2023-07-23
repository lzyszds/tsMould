import {Response} from "express";
import {ErrorR, ResponseData} from "../../typings/PostReturn";

import fs from "node:fs";
import path from "path";

//将要传给前端的结果，先上传至字体收集器中，便于后台压缩字体
const resultWriteFont = (text: string) => {
    // 3. 将文件内容转换为数组
    const arr = text.split("")
    // 4. 去重
    const newArr = [...new Set(arr)]
    // 5. 将数组转换为字符串
    const newStr = newArr.join("")
    fs.appendFileSync(path.resolve('utilsPublic/font.txt'), newStr)
    //打包想要路径
    // fs.appendFileSync(path.resolve('./public/font/font.txt'), newStr)
}

const success = <T>(res: Response, data: T, msg?: string, total?: number) => {
    /* T:泛型 res:响应 data:响应数据 msg:响应信息 total:响应数据总条数 */
    resultWriteFont(JSON.stringify(data))
    res.send({
        code: 200,
        data,
        msg: msg || 'success',
        total
    } as ResponseData<T>)
}
//图片返回
const successImg = (res: Response, data: Buffer) => {
    // 返回给前端
    res.writeHead(200, {'Content-Type': 'image/png'});
    /* res:响应 data:响应数据 msg:响应信息 */
    res.end(data)
}

// 服务器错误
const error = (res: Response, msg: string | unknown) => {
    /* res:响应 msg:响应信息 */
    res.send({
        code: 500,
        msg: msg || 'error'
    } as ErrorR)
}

//未找到返回
const notFound = (res: Response, msg: string | unknown) => {
    /* res:响应 msg:响应信息 */
    res.send({
        code: 404,
        msg: msg || 'not found'
    } as ErrorR)
}

//错误的请求
const badRequest = (res: Response, msg: string | unknown) => {
    /* res:响应 msg:响应信息 */
    res.send({
        code: 400,
        msg: msg || 'bad request'
    } as ErrorR)
}

//未授权
const unauthorized = (res: Response, msg: string | unknown) => {
    /* res:响应 msg:响应信息 */
    res.send({
        code: 401,
        msg: msg || 'unauthorized'
    } as ErrorR)
}


export const errorHandle = {
    success,
    successImg,
    error,
    notFound,
    badRequest,
    unauthorized
}

// 一些错误代码提示中文版
export const errorNameAll = {
    400: '错误请求',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '请求错误,未找到该资源',
    405: '请求方法未允许',
    408: '请求超时',
    500: '服务器端出错',
    501: '网络未实现',
    502: '网络错误',
    503: '服务不可用',
    504: '网络超时',
    505: 'http版本不支持该请求',
};
