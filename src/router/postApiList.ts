import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {getCurrentUnixTime, mapGather, TokenClass, toValidEnglishNumber} from "../utils/common";
import {errorHandle} from "../utils/error";
import {upload, uploadArticleImg} from "../utils/upload";
import sqlHandlesTodo from "../utils/mysql";
import dayjs from "dayjs";
import User from "../../typings/User";
import axios from "axios";
import {ApiConfig} from "../../typings/ApiCongfigType";
import {headers, parps} from "../utils/config_Github";

const {success, successImg, error, notFound, badRequest, unauthorized} = errorHandle
//路径默认配置值

/* 配置所有路由接口 */
const post: ApiConfig[] = mapGather({
    //github api
    "/proxy/github": async (req: Request, res: Response) => {
        const url: string = "https://api.github.com/graphql";
        try {
            const response = await axios.post(url, parps, {headers});
            success(res, response.data.data);
        } catch (e) {
            error(res, e);
        }
    },
    //登录
    "/login": async (req: Request, res: Response) => {
        try {
            const {username, password} = req.body;
            const result: User[] = await sqlHandlesTodo({
                type: 'select',
                text: `select * from userlist where username = ? and password = ?`,
                values: [username, password],
                hasVerify: true,
                errmsg: '账号或者密码错误'
            });

            const tokenLine: string = TokenClass.generateToken({
                username: result[0].username,
                uname: result[0].uname
            });

            success(res, tokenLine, '登录成功');
        } catch (err) {
            error(res, err);
        }
    },


    //新增用户账号
    '/addUserLzy': async (req: Request, res: Response) => {
        try {
            let {name, username, password, power, headImg, perSign} = req.body;

            // 判断name、username、password是否含有特殊字符
            const verify = toValidEnglishNumber([name, username, password]);
            if (verify) return badRequest(res, '不能输入含有特殊的字符');
            // token
            const token = req.headers.authorization;
            // 当前时间
            const date = dayjs().format('YYYY-MM-DD HH:mm:ss');

            // 设置属性
            await sqlHandlesTodo({
                type: 'insert',
                text: `insert into userlist(uname, username, password, power, createDate, 
                       lastLoginDate, headImg, isUse, perSign) values(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values: [name, username, password, power, date, date, headImg, true, perSign],
                token
            });
            success(res, '添加成功');
        } catch (err) {
            error(res, err);
        }
    },
    //修改用户账号
    '/updateUserLzy': async (req: Request, res: Response) => {
        try {
            // 获取前端传入的参数
            const token = req.headers.authorization;
            let {uid, name, username, password, power, isUse, perSign} = req.body;
            const lastLoginDate = dayjs().format('YYYY-MM-DD HH:mm:ss');

            // 判断name、username、password是否含有特殊字符
            const verify = toValidEnglishNumber([name, username, password]);
            if (verify) return badRequest(res, '不能输入含有特殊的字符');
            const sqlres: {} = {
                uname: name,
                username,
                password,
                power,
                lastLoginDate,
                isUse,
                perSign
            }

            // 调用修改方法
            await sqlHandlesTodo({
                type: 'update',
                text: `UPDATE userlist SET ? WHERE uid = ?`,
                values: [sqlres, uid],
                token
            });
            success(res, '修改成功');
        } catch (err) {
            error(res, err);
        }
    },
    //删除用户账号
    '/deleteUserLzy': async (req: Request, res: Response) => {
        try {
            // 获取前端传入的参数
            const {id} = req.body;
            const token = req.headers.authorization;

            await sqlHandlesTodo({
                type: 'delete',
                text: `DELETE FROM userlist WHERE uid = ?`,
                values: [id],
                token
            });
            success(res, '删除成功');
        } catch (err) {
            error(res, err);
        }
    },
    //上传用户头像
    '/uploadHead': (req: Request, res: Response) => {
        upload(req, res)
    },
    //发布文章
    '/addArticle': async (req: Request, res: Response) => {
        try {
            //获取token
            const {authorization: token} = req.headers;
            let {author, title, content, main, coverImg, wtype, coverContent} = req.body;
            const nowDate: number = getCurrentUnixTime();

            await sqlHandlesTodo({
                type: 'insert',
                text: `INSERT INTO articlelist (author, createTime, title, content, modified,
                       main, coverImg,comNumber, wtype,coverContent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values: [author, nowDate, title, content, nowDate, main, coverImg, 0, wtype, coverContent],
                token,
                errmsg: '发布失败'
            });

            success(res, '发布成功');
        } catch (err) {
            error(res, err);
        }
    },
    // 修改文章内容
    '/updateArticle': async (req: Request, res: Response) => {
        try {
            //获取token
            const {authorization: token} = req.headers;
            // 获取前端传入的参数
            const {main, content, title, coverContent, coverImg, comNumber, modified, wtype, aid} = req.body;
            const sqlres: object = {
                title: title,
                coverContent: coverContent,
                // 将参数中的 \\' 替换为单引号 '
                content: content.replace(/\\'/g, "'"),
                main: main.replace(/\\'/g, "'"),
                coverImg: coverImg,
                comNumber: comNumber,
                modified: modified,
                wtype: wtype,
            }
            // 调用修改方法
            await sqlHandlesTodo({
                type: 'update',
                // 使用参数化查询，防止 SQL 注入
                text: `UPDATE articlelist SET ? WHERE aid = ?`,
                values: [sqlres, aid],
                token
            });

            success(res, '修改成功');
        } catch (err) {
            error(res, err);
        }
    },
    //删除文章
    '/deleteArticle': async (req: Request, res: Response) => {
        const token = req.headers.authorization;
        const {id} = req.body;
        try {
            //检查当前用户是否有权限
            const userPower = await TokenClass.powerToken(token);
            const power = userPower[0].power;
            if (power === 'admin') {
                await sqlHandlesTodo({
                    type: 'delete',
                    text: `DELETE FROM articlelist WHERE aid = ?`,
                    values: [id],
                    token
                });
                success(res, '删除成功');
            } else {
                error(res, '您没有权限删除文章');
            }
        } catch (e) {
            error(res, e);
        }

    },
    //上传文章封面或者内容图片
    '/uploadArticleImg': (req: Request, res: Response) => {
        uploadArticleImg(req, res)
    },

    //发布评论
    '/addComment': async (req: Request, res: Response) => {
        try {
            // 遍历文件夹下的所有图片
            const imgs = fs.readdirSync(path.join(__dirname, '../../public/img/comments'));

            // 获取前端传入的参数
            const {content, aid, replyId, groundId, email, name, userIp, imgIndex} = req.body;
            //头像地址
            const img: string = `http://${req.get("Host")}/public/img/comments/${imgs[imgIndex]}`;
            const nowDate: number = getCurrentUnixTime();
            // 添加评论进数据库
            await sqlHandlesTodo({
                type: 'insert',
                text: `INSERT INTO wcomment(content, article_id, reply_id, ground_id, email,
                      user_name, user_ip, time, head_img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values: [content, aid, replyId, groundId, email, name, userIp, nowDate, img],
                hasVerify: true
            });
            //评论成功后，文章评论数加1
            await sqlHandlesTodo({
                type: 'update',
                text: `UPDATE articlelist SET comNumber = comNumber + 1 WHERE aid = ?`,
                values: [aid],
                hasVerify: true
            });

            success(res, '评论成功');
        } catch (err) {
            error(res, err);
        }
    },
    //删除评论
    '/deleteComment': async (req: Request, res: Response) => {
        try {
            // 获取前端传入的参数
            const {comId, aid} = req.body;
            const token = req.headers.authorization;
            // 删除数据库中的评论
            await sqlHandlesTodo({
                type: 'delete',
                text: `DELETE FROM wcomment WHERE comId = ?`,
                values: [comId],
                token
            });
            //评论成功后，文章评论数减1
            await sqlHandlesTodo({
                type: 'update',
                text: `UPDATE articlelist SET comNumber = comNumber - 1 WHERE aid = ?`,
                values: [aid],
                hasVerify: true
            });

            success(res, '删除成功');
        } catch (err) {
            error(res, err);
        }
    },
    //添加文章分类
    '/addArticleType': async (req: Request, res: Response) => {
        try {
            // 从请求体中获取文章分类名称
            const {name} = req.body as { name: string };

            // 执行添加文章分类的 SQL 语句
            await sqlHandlesTodo({
                type: 'insert',
                text: `INSERT INTO articletype (name) VALUES (?)`,
                values: [name],
                hasVerify: true
            });
            success(res, '添加成功');
        } catch (err: any) {
            // 判断是否是重复添加
            if (err.code === 'ER_DUP_ENTRY') {
                const errorRes: string = '该分类已存在'
                error(res, errorRes);
            } else {
                const errorRes: string = 'Internal Server Error'
                error(res, errorRes);
            }
        }
    },
})

export default post
