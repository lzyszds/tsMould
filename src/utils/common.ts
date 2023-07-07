import {Request, Response} from "express";
import jwt from "jsonwebtoken"
import handleSqlTodo from "./mysql";
import {ErrorR, ResponseData} from "../../typings/PostReturn";

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
const tokenClass = {
    //生成token
    token: (val: { username: string, uname: string }) => jwt.sign(val, secret),
    //解析token
    decodeToken: (token: string): any => {
        if (token) return jwt.verify(token, secret)
        return "token is null"
    },

    /*
      当前代码的功能 是验证token是否有效
      hasVerify:是否需要验证token
      token:需要验证的token
    */
    verifyToken: (token: string, hasVerify?: boolean,): Promise<boolean | string> => {
        return new Promise((resolve, reject) => {
            if (hasVerify === true) resolve(true) //不需要验证token的接口
            if (!token) reject(false) //没有token
            token = token.replace('Bearer ', '') //截取token
            //返回解析token的结果
            const proxy: any = jwt.verify(token, secret) || {}
            const text = `select uid from USERLIST where username='${proxy.username}' and uname='${proxy.uname}' `
            handleSqlTodo({type: 'select', text, hasVerify: true})
                .then((result: any) => {
                    if (result.length > 0) {
                        resolve(result[0])
                    } else {
                        reject({code: 400, msg: 'user not found'})
                    }
                })
                .catch((err: ErrorR) => {
                    reject(err)
                })
        })
    }
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


export {
    mapGather,
    tokenClass,
    sliceData,
    randomUnique
}
