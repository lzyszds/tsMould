import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {mapGather, tokenClass, sliceData, randomUnique} from "../utils/common";
import {errorHandle} from "../utils/error";
import {upload} from "../utils/upload";
import handleSqlTodo from "../utils/mysql";
import dayjs from "dayjs";
import {ResponseData, ErrorR} from "../../typings/PostReturn";
import User from "../../typings/User";
import {ApiConfig} from "../../typings/ApiCongfigType";

const {success, error, notFound, badRequest, unauthorized} = errorHandle

let randomName: number = 1

/* 配置所有路由接口 */
const get: ApiConfig[] = mapGather({
    //服务首页
    "/": function (req: Request, res: Response) {
        return res.send('hello world')
    },
    //随机获取一张头像图片 从静态 pubilc/img/updateImg文件夹中随机获取一张图片
    "/overtApis/getRandHeadImg": function (req: Request, res: Response) {
        // 获取文件夹 pubilc/img/updateImg中的所有文件
        const files = fs.readdirSync(path.join(__dirname, '../../public/img/updateImg'))
        // 随机获取一张 但是不和上一次的随机数一样
        let random = randomUnique(1, files.length - 1, randomName)
        const img = files[random]
        //记录当前返回的图片
        randomName = random
        //返回图片
        return success(res, '/img/updateImg/' + img, '获取成功')
        // res.send({code: 200, data: '/img/updateImg/' + img, msg: '获取成功'} as ResponseData<string>)
    },

    //查询用户列表
    "/overtApis/getUserList": async function (req: Request, res: Response) {
        const authorization = req.headers.authorization
        //如果没有token 则返回未授权
        if (authorization === undefined) return unauthorized(res, '未授权,请登录')
        //限制每次返回多少条数据
        let {pages, limit, search} = req.query
        search = search ? search : ''
        //查询语句
        const sqlTxt = `select * from userlist where uname like '%${search}%'
        order by uid desc limit ${(Number(pages) - 1) * Number(limit)},${Number(pages) * Number(limit)}`
        //查询总条数
        const total = await handleSqlTodo({
            type: 'select',
            text: `select count(*) from userlist where uname like '%${search}%'`,
            header:authorization
        })
        //执行查询
        handleSqlTodo({type: 'select', text: sqlTxt, header: authorization})
            .then(item => success(res, item, '查询成功', total[0]['count(*)']))
            .catch(err => error(res, err))

    },
    //获取用户详情
    '/overtApis/getUserInfo': (req: Request, res: Response) => {
        //获取请求头中的token
        const authorization = req.headers.authorization
        //如果没有token 则返回未授权
        if (authorization === undefined) return unauthorized(res, '未授权,请登录')
        //解析token
        const {username, uname} = tokenClass.decodeToken(authorization)
        //查询语句
        const text = `select uid,uname,username,power,createDate,lastLoginDate,perSign,headImg,isUse from
                            USERLIST where username='${username}' and uname='${uname}' `
        //执行查询
        handleSqlTodo({type: 'select', text, header: authorization})
            .then(item => success(res, item[0], '查询成功')
            )
            .catch(err => error(res, err))
    },
    //查询文章列表
    '/overtApis/articleList': async (req: Request, res: Response) => {
        //获取页数和每页条数
        const {pages, limit, search} = req.query
        //查询语句
        const sqlTxt = `select * from articlelist where title like '%${search??''}%' 
        order by aid desc limit ${(Number(pages) - 1) * Number(limit)},${Number(pages) * Number(limit)}`
        console.log(sqlTxt)
        //查询总条数
        const total = await handleSqlTodo({
            type: 'select',
            text: `select count(*) from articlelist where title like '%${search??''}%'`,
            hasVerify: true
        })
        //执行查询
        handleSqlTodo({type: 'select', text: sqlTxt, hasVerify: true})
            .then(item => success(res, item, '查询成功', total[0]['count(*)']))
            .catch(err => error(res, err))

    },
})

const post: ApiConfig[] = mapGather({
    //登录
    "/overtApis/login": function (req: Request, res: Response) {
        const {username, password} = req.body;
        const text = `select * from USERLIST where username='${username}' and password='${password}'`
        handleSqlTodo({type: 'select', text, hasVerify: true, errmsg: '账号或者密码错误'}).then((result: User[]) => {
            const tokenLine: string = tokenClass.token({
                username: result[0].username,
                uname: result[0].uname
            })
            success(res, tokenLine, '登录成功')
        })
            .catch(err => error(res, err))
    },
    //新增用户账号
    '/overtApis/addUserLzy': (req: Request, res: Response) => {
        let {name, username, password, power, headImg, perSign} = req.body
        const header = req.headers.authorization
        //当前时间
        const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
        //设置属性
        const values = [name, username, password, power, date, date, headImg, true, perSign];
        const text = `insert into USERLIST(uname,username,password,power,createDate,lastLoginDate,headImg,isUse,perSign) values(${values.map(res => "'" + res + "'").join()})`
        handleSqlTodo({type: 'insert', text, header})
            .then((result) => {
                success(res, result, '添加成功')
            })
            .catch(err => {
                error(res, err)
            })
    },
    //修改用户账号
    '/overtApis/updateUserLzy': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const header = req.headers.authorization
        const para = req.body
        para.lastLoginDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
        // sql声明
        let text = `UPDATE USERLIST SET uname='${para.name}',username='${para.username}',password='${para.password}',power='${para.power}',lastLoginDate='${para.lastLoginDate}',isUse='${para.isUse}',perSign='${para.perSign}' WHERE uid=${para.uid}`
        // 调用修改方法
        handleSqlTodo({type: 'update', text, header})
            .then(item => success(res, item, '修改成功'))
            .catch(err => error(res, err))
    },
    //删除用户账号
    '/overtApis/deleteUserLzy': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const {id} = req.body
        const header = req.headers.authorization
        // sql声明
        let text = `DELETE FROM USERLIST WHERE uid=${id};`
        // 调用删除方法

        handleSqlTodo({type: 'delete', text, header})
            .then(item => {
                success(res, item, '删除成功')
            }).catch(err => error(res, err))
    },
    //上传用户头像
    '/overtApis/uploadHead': (req: Request, res: Response) => {
        upload(req, res)
    },
})

export {get, post}
