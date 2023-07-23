import jwt from "jsonwebtoken"
import sqlHandlesTodo from "./mysql";
import {ErrorR, ResponseData} from "../../typings/PostReturn";
import fs from "fs"
import * as https from "https";
import path from "node:path";
import dayjs from "dayjs";


interface MapObject {
    [key: string]: any;
}

//将对象转换成数组
const mapGather = (value: MapObject): MapObject[] => {
    return Object.keys(value).map((key: any) => {
        return {
            [key]: value[key]
        }
    }) || []
}

//token密钥集合
const secret = 'I_LOVE_JING|tpyeScript'

// 定义 Token 类
class TokenClass {
    // 生成 Token
    static generateToken = (val: { username: string, uname: string }): string => jwt.sign(val, secret);

    // 解析 Token
    static decodeToken = (token: string): any => {
        if (!token) return "token is null";
        token = token.replace('Bearer ', '');
        return jwt.verify(token, secret);
    };

    // 验证 Token 是否有效
    static verifyToken = async (token: string, hasVerify?: boolean): Promise<boolean | any> => {
        if (hasVerify === true) return true; // 不需要验证 token 的接口
        if (!token) throw new Error('Token not provided'); // 没有提供 token

        try {
            token = token.replace('Bearer ', '');
            const decodedToken: any = jwt.verify(token, secret);

            const text: string = `SELECT uid FROM USERLIST WHERE username=? AND uname=?`;
            const values: string[] = [decodedToken.username, decodedToken.uname];
            const result = await sqlHandlesTodo({type: 'select', text, values, hasVerify: true});

            if (result.length > 0) {
                return result[0];
            } else {
                throw new Error('User not found');
            }
        } catch (err) {
            throw new Error('Invalid token');
        }
    };
}


// 数据截取
const sliceData = <T>(data: T[], pages: number, limit: number) => {
    //计算数据总数
    const total = data.length
    //计算当前页数
    const page = Number(pages)
    //计算当前页数的起始位置
    const start = (page - 1) * Number(limit)
    //计算当前页数的结束位置
    const end = page * Number(limit)
    //截取当前页数的数据
    data = data.slice(start, end)

    return {data, total}
}


const randomUnique = (min: number, max: number, random: number): number => {
    /* 获取随机数 并且不和上一次的随机数一样 获取最小值和最大值之间的随机数 */
    let num: number = Math.floor(Math.random() * (max - min + 1) + min)
    // 如果数字与随机数相同，请重试
    if (num == random) {
        return randomUnique(min, max, num)
    }
    // 否则返回数字
    return num
}

//图片代理
const imgProxy = (url: string) => {
    // 将网络图片转换成base64
    return new Promise((resolve, reject) => {
        https.get(url, (res: any) => {
            let chunks: any = []
            res.on('data', (chunk: any) => {
                chunks.push(chunk)
            })
            res.on('end', () => {
                let data: Buffer = Buffer.concat(chunks)
                let base64Img: string = data.toString('base64')
                const img: string = 'data:image/jpeg;base64,' + base64Img
                // 将base64转为图片
                const base64Data: string = img.replace(/^data:image\/\w+;base64,/, "");
                const dataBuffer: Buffer = Buffer.from(base64Data, 'base64');
                resolve(dataBuffer)
            })
        })
    })
}

/*
* 代码是一个读取文件、去除重复字符后再写入文件的操作。
* 它会读取指定文件的内容，将内容转换为数组，去除重复字符，
* 然后再将去重后的内容写回到原文件中。
* */
const processFileContent = () => {
    try {
        const filePath = path.resolve(__dirname, '../../utilsPublic/font.txt');
        //打包想要路径
        // const filePath = path.resolve('./public/font/font.txt')
        const text = fs.readFileSync(filePath, "utf-8");
        //去重处理
        const arr = text.split("");
        const newArr = [...new Set(arr)];
        const newStr = newArr.join("");
        //将文件内容更新
        fs.writeFileSync(filePath, newStr);

        console.log("文件内容去重成功");
        // 结束进程

    } catch (error) {
        console.error("文件内容去重失败:", error);
    }
    process.exit(0);
};

//将字符串中所有的单引号转成双引号
const replaceSingleQuotes = (str: string | any[]) => {
    if (typeof str === 'string') return str.replace(/'/g, '"')
    return str.map((item: any) => {
        return item.replace(/'/g, '"')
    })
}

//判断传入的参数是否是英文和数字组成的字符串
function toValidEnglishNumber(val: string | any[]): boolean {
    const reg = /^[a-zA-Z0-9]{3,16}$/; // 匹配由英文字母和数字组成，且长度为3到16位的字符串
    if (typeof val === 'string') return reg.test(val)
    return val.every((item: string) => {
        return reg.test(item)
    })
}

//获取当前时间的时间戳
const getCurrentUnixTime = () => {
    return dayjs().unix();
}

export {
    mapGather,
    TokenClass,
    sliceData,
    randomUnique,
    imgProxy,
    processFileContent,
    replaceSingleQuotes,
    toValidEnglishNumber,
    getCurrentUnixTime
}
