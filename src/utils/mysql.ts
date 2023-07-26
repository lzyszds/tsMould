import mysql from "mysql";
import {TokenClass} from "./common";

const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'lzy_admin'
})

connection.connect((err) => {
    if (err) {
        console.log('数据库连接失败', err)
    } else {
        console.log('数据库连接成功')
    }
})
/*
    type: 对sql操作的类型;
    text: sql语句;
    hasVerify：是否不需要验证true为不需要.默认需要验证;
    token：用户token 与hasVerify对立，两者必有一样存在，否则报错;
    errmsg: 数据为空时错误提示;
*/
export type SqlTodo = {
    type: SqlType,
    text: string,
    values?: any[], //sql语句中的values值 占位符替换避免sql注入
    errmsg?: string,
    hasVerify?: boolean,
    token?: string
}

type SqlType = 'select' | 'insert' | 'update' | 'delete' | 'alter'

//接收到前端发来的sql语句
const sqlHandlesTodo = (options: SqlTodo): Promise<any> => {
    const {type, text, values, hasVerify, token, errmsg} = options
    return new Promise((resolve, reject) => {
        //检测当前的text是否是查询语句
        const isCompliant: boolean = checkText(text, type)
        if (isCompliant) return reject(`当前${type}语句不合规范`)
        //验证token
        TokenClass.verifyToken(token || '', hasVerify).then(res => {
            //连接数据库
            connection.query(text, values, (err, result) => {
                if (err) {
                    console.log(`当前查询语句为：` + text + `错误信息为：` + err);
                    return reject(err)
                }

                if (result.length === 0) {
                    resolve(errmsg || [])
                }
                resolve(result)
            })
        }).catch(err => {
            const reason: string = `
                    1.没有传入token值给查询方法且没有跳过认证token, 默认需要验证token, 需要去配置hasVerify:true
                    2.要么就是token验证失败，账号不存在`
            reject({msg: "token验证失败 提示：" + reason, err})
        })
    }).catch((err: Error) => console.log(err))
}

export default sqlHandlesTodo

// 检查语句是否为当前的函数规定语句
const checkText = (text: string, type: string): boolean => {
    //text 转换为小写
    text = text.toLowerCase()
    return !text.includes(type)
}
