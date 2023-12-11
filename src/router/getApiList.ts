import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {mapGather, randomUnique, TokenClass} from "../utils/common";
import {errorHandle} from "../utils/error";
import sqlHandlesTodo, {SqlTodo} from "../utils/mysql";

import {ApiConfig, ParamsMuster} from "../../typings/ApiCongfigType";
import {Article, ArticleType, Comment} from "../../typings/GetApiTypes";
import User from "../../typings/User";


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
    "/getUserList": async (req: Request, res: Response) => {
        try {
            const token = req.headers.authorization;

            // 如果没有token 则返回未授权
            if (!token) return unauthorized(res, '未授权,请登录');

            // 获取页数、每页条数和搜索关键词
            let {pages, limit, search}: ParamsMuster = req.query;
            search = search || '';
            pages = pages ?? 1;
            limit = limit ?? 10;
            // 获取符合搜索条件的记录总数
            const total = await sqlHandlesTodo({
                type: 'select',
                text: 'SELECT COUNT(*) as total FROM userlist WHERE uname LIKE ?',
                values: [`%${search}%`],
                token
            } as SqlTodo);

            // 获取分页的用户列表
            const offset = (Number(pages) - 1) * Number(limit);
            const userList: User = await sqlHandlesTodo({
                type: 'select',
                text: 'SELECT * FROM userlist WHERE uname LIKE ? ORDER BY uid LIMIT ?, ?',
                values: [`%${search}%`, offset, Number(limit)],
                token
            } as SqlTodo);

            // 成功响应，返回用户列表及总记录数
            success(res, userList, '查询成功', total[0].total);
        } catch (err) {
            // 错误处理，返回错误响应
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },
    //获取用户详情
    '/getUserInfo': async (req: Request, res: Response) => {
        try {
            // 获取请求头中的token
            const token = req.headers.authorization;

            // 如果没有token 则返回未授权
            if (!token) return unauthorized(res, '未授权,请登录');
            // 解析token
            const {username, uname} = TokenClass.decodeToken(token);

            // 查询用户信息 返回用户信息
            const userInfo: User[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT uid, uname, username, power, createDate, lastLoginDate, perSign, headImg, isUse
                      FROM userlist WHERE username=? AND uname=? LIMIT 1`,
                values: [username, uname],
                token
            });
            // 成功响应，返回用户信息
            success(res, userInfo[0], '查询成功');
        } catch (err) {
            // 错误处理，返回错误响应
            const msg: string = 'internal Server error';
            error(res, msg);
        }
    },
    //查询文章列表
    '/articleList': async (req: Request, res: Response) => {
        try {
            // 从请求参数中解构出文章查询参数
            let {pages, limit, search}: ParamsMuster = req.query;
            search = search || '';
            pages = pages ?? 1;
            limit = limit ?? 10;
            // 查询文章总条数
            const totalResult: any[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT COUNT(*) AS totalCount FROM articlelist WHERE title LIKE ? OR content LIKE ? OR author LIKE ?`,
                values: [`%${search}%`, `%${search}%`, `%${search}%`],
                hasVerify: true
            });
            // 总条数赋值，如果没有查询到结果，则默认为0
            const totalCount: number = totalResult[0]?.totalCount ?? 0;

            // 执行查询文章列表
            const articleList: Article[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT * FROM articlelist WHERE title LIKE ? ORDER BY aid DESC LIMIT ?, ?`,
                values: [`%${search}%`, (Number(pages) - 1) * Number(limit), Number(limit)],
                hasVerify: true
            });

            success(res, articleList, '查询成功', totalCount);
        } catch (err) {
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },
    //获取文章详情
    '/articleInfo': async (req: Request, res: Response) => {
        try {
            // 从请求的查询参数中获取文章id
            const {aid} = req.query as { aid: string };

            // 查询语句
            const text: string = `SELECT * FROM articlelist WHERE aid = ?`;
            const values: any[] = [Number(aid)];

            // 执行查询
            const articleList: Article[] = await sqlHandlesTodo({type: 'select', text, values, hasVerify: true});

            // 返回查询结果
            if (articleList.length > 0) {
                success(res, articleList[0], '查询成功');
            } else {
                error(res, {code: 404, msg: '文章不存在'});
            }
        } catch (err) {
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },
    //获取文章评论
    '/articleComment': async (req: Request, res: Response) => {
        try {
            // 从请求的查询参数中获取文章id
            const {aid} = req.query as { aid: string };

            // 查询语句
            const text: string = `SELECT * FROM wcomment WHERE article_id = ?`;
            const values: string[] = [aid];

            // 执行查询
            const data: Comment[] = await sqlHandlesTodo({type: 'select', text, values, hasVerify: true});

            // 处理二级评论数据，将二级评论放到对应的一级评论的reply属性中
            const levelOne: Comment[] = data.filter((item) => item.reply_id === 0);
            const levelTwo: Comment[] = data.filter((item) => item.reply_id !== 0);
            levelOne.forEach((element) => {
                const replyArray: Comment[] = levelTwo.filter((item) => item.ground_id === element.comId);
                if (replyArray.length > 0) {
                    element.reply = replyArray;
                    element.replyPeople = replyArray[0].user_name;
                }
            });

            success(res, levelOne, '查询成功');
        } catch (err) {
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },
    //获取全部评论
    '/getAllComment': async (req: Request, res: Response) => {
        try {
            let {pages, limit, search}: ParamsMuster = req.query;
            search = search || '';
            pages = pages ?? 1;
            limit = limit ?? 10;
            // 查询评论总条数
            const totalResult: { totalCount: number }[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT COUNT(*) AS totalCount FROM wcomment WHERE content LIKE ?`,
                values: [`%${search}%`],
                hasVerify: true
            });
            // 总条数赋值，如果没有查询到结果，则默认为0
            const totalCount: number = totalResult[0].totalCount ?? 0;
            // 执行查询
            const comments: Comment[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT * FROM wcomment WHERE content LIKE ? ORDER BY comId DESC LIMIT ?, ?`,
                values: [`%${search}%`, (Number(pages) - 1) * Number(limit), Number(limit)],
                hasVerify: true
            });
            success(res, comments, '查询成功', totalCount);
        } catch (err) {
            const msg: string = 'Internal Server Error';
            error(res, msg);
        }
    },
    //获取文章分类可选项
    '/articleType': async (req: Request, res: Response) => {
        try {
            // 执行查询
            const articleTypes: ArticleType[] = await sqlHandlesTodo({
                type: 'select',
                text: `SELECT * FROM articletype`,
                hasVerify: true
            });

            success(res, articleTypes, '查询成功');
        } catch (err) {
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },

    // 随机文章图库
    '/getRandArticleImg': (req: Request, res: Response) => {
        try {
            // 获取文件夹 public/img/coverRomImg 中的所有图片文件(名字)
            const imgDir = path.join(__dirname, '../../public/img/coverRomImg');
            const imgs = fs.readdirSync(imgDir);

            // 随机数
            const random = randomUnique(0, imgs.length - 1, 0);
            // 获取随机图片
            const img = imgs[random];

            // 设置返回头为图片格式
            res.writeHead(200, {'Content-Type': 'image/jpeg'});

            // 返回图片
            const imgPath = path.join(imgDir, img);
            fs.createReadStream(imgPath).pipe(res);
        } catch (err) {
            const msg: String = 'internal Server error';
            error(res, msg);
        }
    },

})


export default get
