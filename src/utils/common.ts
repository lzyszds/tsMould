import jwt from "jsonwebtoken";
import sqlHandlesTodo from "./mysql";
import fs from "fs";
import * as https from "https";
import path from "node:path";
import dayjs from "dayjs";

/**
 * 通用键值对象接口
 */
interface MapObject {
    [key: string]: any;
}

/**
 * 将对象转换成键值数组
 * @param value 需要转换的对象
 * @returns 转换后的键值数组
 */
const mapGather = (value: MapObject): MapObject[] => {
    return Object.keys(value).map((key: any) => {
        return {
            [key]: value[key],
        };
    }) || [];
};

/**
 * Token 类
 */
class TokenClass {
    private static readonly secret: string = 'I_LOVE_JING|tpyeScript';

    /**
     * 生成 Token
     * @param val 包含用户名和用户昵称的对象
     * @returns 生成的 Token 字符串
     */
    static generateToken = (val: { username: string, uname: string }): string => jwt.sign(val, TokenClass.secret);

    /**
     * 解析 Token
     * @param token Token 字符串
     * @returns 解析后的 Token 对象
     */
    static decodeToken = (token: string): any => {
        if (!token) return "token is null";
        token = token.replace('Bearer ', '');
        return jwt.verify(token, TokenClass.secret);
    };

    /**
     * 验证 Token 是否有效
     * @param token Token 字符串
     * @param hasVerify 是否需要验证 Token
     * @returns 如果 Token 有效，返回 true；否则返回错误信息
     */
    static verifyToken = async (token: string, hasVerify?: boolean): Promise<boolean | any> => {
        if (hasVerify === true) return true; // 不需要验证 Token 的接口
        if (!token) throw new Error('Token not provided'); // 没有提供 Token

        try {
            token = token.replace('Bearer ', '');
            const decodedToken: any = jwt.verify(token, TokenClass.secret);

            const text: string = `SELECT uid FROM userlist WHERE username=? AND uname=?`;
            const values: string[] = [decodedToken.username, decodedToken.uname];
            const result = await sqlHandlesTodo({type: 'select', text, values, hasVerify: true});

            if (result.length > 0) {
                return true;
            } else {
                throw new Error('User not found');
            }
        } catch (err) {
            throw new Error('Invalid token');
        }
    };
    static powerToken = async (token: string): Promise<boolean | any> => {
        try {
            token = token.replace('Bearer ', '');
            const decodedToken: any = jwt.verify(token, TokenClass.secret);
            const text: string = `SELECT power FROM userlist WHERE username=? AND uname=?`;
            const values: string[] = [decodedToken.username, decodedToken.uname];
            const result = await sqlHandlesTodo({type: 'select', text, values, hasVerify: true});
            if (result.length > 0) {
                return result;
            } else {
                return new Error('User not found');
            }
        } catch (e) {
            console.log(e)
        }
    }
}

/**
 * 数据截取函数
 * @param data 原始数据数组
 * @param pages 当前页数
 * @param limit 每页条数
 * @returns 截取后的数据数组和数据总数
 */
const sliceData = <T>(data: T[], pages: number, limit: number): { data: T[], total: number } => {
    // 计算数据总数
    const total = data.length;
    // 计算当前页数
    const page = Number(pages);
    // 计算当前页数的起始位置
    const start = (page - 1) * Number(limit);
    // 计算当前页数的结束位置
    const end = page * Number(limit);
    // 截取当前页数的数据
    data = data.slice(start, end);

    return {data, total};
};

/**
 * 生成在指定范围内不重复的随机数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @param random 上一次的随机数
 * @returns 不重复的随机数
 */
const randomUnique = (min: number, max: number, random: number): number => {
    /* 获取随机数并且不和上一次的随机数一样获取最小值和最大值之间的随机数 */
    let num: number = Math.floor(Math.random() * (max - min + 1) + min);
    // 如果数字与随机数相同，请重试
    if (num == random) {
        return randomUnique(min, max, num);
    }
    // 否则返回数字
    return num;
};

/**
 * 图片代理函数
 * @param url 图片 URL
 * @returns 图片的 base64 编码字符串
 */
const imgProxy = async (url: string): Promise<string> => {
    // 将网络图片转换成 base64
    return new Promise((resolve, reject) => {
        https.get(url, (res: any) => {
            let chunks: any = [];
            res.on('data', (chunk: any) => {
                chunks.push(chunk);
            });
            res.on('end', () => {
                let data: Buffer = Buffer.concat(chunks);
                let base64Img: string = data.toString('base64');
                const img: string = 'data:image/jpeg;base64,' + base64Img;
                resolve(img);
            });
        });
    });
};

/**
 * 处理文件内容，去除重复字符后再写入文件
 */
const processFileContent = (): void => {
    try {
        const filePath = path.resolve(__dirname, '../../utilsPublic/font.txt');
        const text = fs.readFileSync(filePath, "utf-8");
        // 去重处理
        const arr = text.split("");
        const newArr = [...new Set(arr)];
        const newStr = newArr.join("");
        // 将文件内容更新
        fs.writeFileSync(filePath, newStr);

        console.log("文件内容去重成功");
        // 结束进程
        process.exit(0);
    } catch (error) {
        console.error("文件内容去重失败:", error);
    }
};

/**
 * 将字符串中所有的单引号转换成双引号
 * @param str 需要转换的字符串或字符串数组
 * @returns 转换后的字符串或字符串数组
 */
const replaceSingleQuotes = (str: string | string[]): string | string[] => {
    if (typeof str === 'string') return str.replace(/'/g, '"');
    return str.map((item: string) => {
        return item.replace(/'/g, '"');
    });
};

/**
 * 判断传入的参数是否是英文和数字组成的字符串
 * @param val 需要判断的字符串或字符串数组
 * @returns 如果所有参数都是由英文字母和数字组成的，返回 true；否则返回 false
 */
function toValidEnglishNumber(val: string | string[]): boolean {
    const reg = /^[a-zA-Z0-9]{3,16}$/; // 匹配由英文字母和数字组成，且长度为3到16位的字符串
    if (typeof val === 'string') return reg.test(val);
    return val.every((item: string) => {
        return reg.test(item);
    });
}

/**
 * 获取当前时间的时间戳
 * @returns 当前时间的时间戳
 */
const getCurrentUnixTime = (): number => {
    return dayjs().unix();
};

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
};