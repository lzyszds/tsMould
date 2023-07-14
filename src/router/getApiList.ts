import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {mapGather, tokenClass, sliceData, randomUnique, imgProxy} from "../utils/common";
import {errorHandle} from "../utils/error";
import sqlHandlesTodo from "../utils/mysql";
import {ApiConfig, ParamsMuster} from "../../typings/ApiCongfigType";


const {success, successImg, error, notFound, badRequest, unauthorized} = errorHandle
//路径默认配置值

let randomName: number = 1

/* 配置所有路由接口 */
const get: ApiConfig[] = mapGather({
    //服务首页
    "/": function (req: Request, res: Response) {
        return res.send('hello world')
    },
    //随机获取一张头像图片 从静态 pubilc/img/updateImg文件夹中随机获取一张图片
    "/getRandHeadImg": function (req: Request, res: Response) {
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
    "/getUserList": async function (req: Request, res: Response) {
        const token = req.headers.authorization
        //如果没有token 则返回未授权
        if (token === undefined) return unauthorized(res, '未授权,请登录')
        //限制每次返回多少条数据
        let {pages, limit, search}: ParamsMuster = req.query
        search = search ? search : ''
        //查询语句
        const sqlTxt = `select * from userlist where uname like '%${search}%'
        order by uid limit ${(Number(pages) - 1) * Number(limit)},${limit}`
        //查询总条数
        const total = await sqlHandlesTodo({
            type: 'select',
            text: `select count(*) from userlist where uname like '%${search}%'`,
            token
        })
        //执行查询
        sqlHandlesTodo({type: 'select', text: sqlTxt, token})
            .then(item => success(res, item, '查询成功', total[0]['count(*)']))
            .catch(err => error(res, err))

    },
    //获取用户详情
    '/getUserInfo': (req: Request, res: Response) => {
        //获取请求头中的token
        const token = req.headers.authorization
        //如果没有token 则返回未授权
        if (token === undefined) return unauthorized(res, '未授权,请登录')
        //解析token
        const {username, uname} = tokenClass.decodeToken(token)
        //查询语句
        const text: string = `select uid,uname,username,power,createDate,lastLoginDate,perSign,headImg,isUse from
                            USERLIST where username='${username}' and uname='${uname}' `
        //执行查询
        sqlHandlesTodo({type: 'select', text, token})
            .then(item => success(res, item[0], '查询成功')
            )
            .catch(err => error(res, err))
    },
    //查询文章列表
    '/articleList': async (req: Request, res: Response) => {
        //获取页数和每页条数
        const {pages, limit, search}: ParamsMuster = req.query
        //查询语句
        const sqlTxt = `select * from articlelist where title like '%${search??''}%' 
        order by aid limit ${(Number(pages) - 1) * Number(limit)},${limit}`
        //查询总条数
        const total = await sqlHandlesTodo({
            type: 'select',
            text: `select count(*) from articlelist where title like '%${search??''}%'`,
            hasVerify: true
        })
        //执行查询
        sqlHandlesTodo({type: 'select', text: sqlTxt, hasVerify: true})
            .then(item => success(res, item, '查询成功', total[0]['count(*)']))
            .catch(err => error(res, err))

    },
    //获取文章分类可选项
    '/articleType': async (req: Request, res: Response) => {
        //查询语句
        const sqlTxt = `select * from articletype`
        //执行查询
        sqlHandlesTodo({type: 'select', text: sqlTxt, hasVerify: true})
            .then(item => success(res, item, '查询成功'))
            .catch(err => error(res, err))
    },
    // 随机文章图库
    '/getRandArticleImg': function (req: Request, res: Response) {
        // 获取文件夹 pubilc/img/coverRomImg中的所有图片文件(名字)
        let imgs = fs.readdirSync(path.join(__dirname, '../../public/img/coverRomImg'))
        //随机数
        let random = randomUnique(1, imgs.length - 1, 0)
        //获取随机图片
        const img = imgs[random]
        //设置返回头为图片格式
        res.writeHead(200, {'Content-Type': 'image/jpeg'})
        //返回图片
        fs.createReadStream(path.join(__dirname, '../../public/img/coverRomImg/' + img)).pipe(res)

    },
    //获取评论列表
    '/getComments': async (req: Request, res: Response) => {
        const sqlTxt: string = ` select * from wcomment `
        sqlHandlesTodo({type: 'select', text: sqlTxt, hasVerify: true}).then(item => {
            success(res, item, '查询成功')
        })
        //     .then(item => success(res, item, '查询成功', total[0]['count(*)']))
        //     .catch(err => error(res, err))
        // //获取页数和每页条数
        // const {pages, limit, search} = req.query
        // //查询语句
        // const sqlTxt = `select * from wcomment where content like '%${search??''}%'
        // order by cid limit ${(Number(pages) - 1) * Number(limit)},${limit}`
        // //查询总条数
        // const total = await sqlHandlesTodo({
        //     type: 'select',
        //     text: `select count(*) from wcomment where content like '%${search??''}%'`,
        //     hasVerify: true
        // })
        // //执行查询
        // sqlHandlesTodo({type: 'select', text: sqlTxt, hasVerify: true})
        //     .then(item => success(res, item, '查询成功', total[0]['count(*)']))
        //     .catch(err => error(res, err))
    }
})


export default get
