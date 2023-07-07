import mysql from "mysql";
import {tokenClass} from "../utils/common";

import User from "../../typings/User";
import {ErrorR} from "../../typings/PostReturn";

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'lzy_admin'
})

connection.connect((err) => {
    if (err) {
        console.log('数据库连接失败')
    } else {
        console.log('数据库连接成功')
    }
})
type SqlTodo = {
    type: SqlType,
    text: string,
    errmsg?: string,
    hasVerify?: boolean,
    header?: string
}

type SqlType = 'select' | 'insert' | 'update' | 'delete' | 'alter'

//接收到前端发来的sql语句
const handleSqlTodo = (options: SqlTodo): Promise<any> => {
    const {type, text, hasVerify, header, errmsg} = options
    return new Promise((resolve, reject) => {
        //检测当前的text是否是查询语句
        const isCompliant: boolean = checkText(text, type)
        if (isCompliant) return reject(`当前${type}语句不合规范`)
        //验证token
        tokenClass.verifyToken(header || '', hasVerify).then(res => {
            //连接数据库
            connection.query(text, (err, result) => {
                if (err) {
                    console.log(`当前查询语句为：` + text);
                    reject(`${type}失败`)
                }
                if (result.length === 0) {
                    reject(errmsg || '当前查询结果为空')
                }
                resolve(result)
            })
        }).catch(err => {
            const reason: string = `
                1.没有传入token值给查询方法且没有跳过认证token,默认需要验证token,需要去配置hasVerify:true
                2.要么就是token验证失败，账号不存在
            `
            reject("token验证失败 提示：" + reason)
        })
    }).catch((err: Error) => console.log(err))
}

export default handleSqlTodo

// 检查语句是否为当前的函数规定语句
const checkText = (text: string, type: string): boolean => {
    //text 转换为小写
    text = text.toLowerCase()
    return !text.includes(type)
}
