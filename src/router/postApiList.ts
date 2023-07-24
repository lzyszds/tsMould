import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {mapGather, TokenClass, replaceSingleQuotes, toValidEnglishNumber, getCurrentUnixTime} from "../utils/common";
import {errorHandle} from "../utils/error";
import {upload, uploadArticleImg} from "../utils/upload";
import sqlHandlesTodo, {SqlTodo} from "../utils/mysql";
import dayjs from "dayjs";
import {ResponseData, ErrorR, ErrorResponse} from "../../typings/PostReturn";
import User from "../../typings/User";
import axios from "axios";
import {ApiConfig} from "../../typings/ApiCongfigType";
import {parps, headers} from "../utils/config_Github";

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
            const text = `select * from USERLIST where username = ? and password = ?`;
            const values = [username, password];
            const result: User[] = await sqlHandlesTodo({
                type: 'select',
                text,
                values,
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
            const values = [name, username, password, power, date, date, headImg, true, perSign];
            const text = `insert into USERLIST(uname, username, password, power, createDate, lastLoginDate, headImg, isUse, perSign) values(?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            await sqlHandlesTodo({type: 'insert', text, values, token});
            success(res, null, '添加成功');
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

            // sql声明
            const text = `UPDATE USERLIST SET uname = ?, username = ?, password = ?, power = ?, lastLoginDate = ?, isUse = ?, perSign = ? WHERE uid = ?`;

            // 调用修改方法
            const values = [name, username, password, power, lastLoginDate, isUse, perSign, uid];
            await sqlHandlesTodo({type: 'update', text, values, token});
            success(res, null, '修改成功');
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

            // sql声明
            const text = `DELETE FROM USERLIST WHERE uid = ?`;

            // 调用删除方法
            const values = [id];
            await sqlHandlesTodo({type: 'delete', text, values, token});
            success(res, null, '删除成功');
        } catch (err) {
            error(res, err);
        }
    },
    //上传用户头像
    '/uploadHead': (req: Request, res: Response) => {
        upload(req, res)
    },
    // 修改文章内容
    '/updateArticle': async (req: Request, res: Response) => {
        try {
            // 获取前端传入的参数
            const {authorization: token} = req.headers;
            const {main, content, title, coverContent, coverImg, modified, wtype, aid} = req.body;
            // 将参数中的 \\' 替换为单引号 '
            const sanitizedMain = main.replace(/\\'/g, "'");
            const sanitizedContent = content.replace(/\\'/g, "'");

            // 使用参数化查询，防止 SQL 注入
            const sqlTxt: string = `UPDATE articlelist SET
            title = ?,
            coverContent = ?,
            content = ?,
            main = ?, 
            coverImg = ?,
            modified = ?,
            wtype = ?
            WHERE aid = ?`;

            // 获取参数值数组，按照顺序对应上面的问号
            const values = [title, coverContent, sanitizedContent, sanitizedMain, coverImg, modified, wtype, aid];

            // 调用修改方法
            await sqlHandlesTodo({type: 'update', text: sqlTxt, values, token});

            success(res, null, '修改成功');
        } catch (err) {
            error(res, err);
        }
    },
    //上传文章封面或者内容图片
    '/uploadArticleImg': (req: Request, res: Response) => {
        uploadArticleImg(req, res)
    },
    //发布文章
    '/addArticle': async (req: Request, res: Response) => {
        try {
            const token = req.headers.authorization;
            let {author, title, content, main, coverImg, wtype} = req.body;
            wtype = JSON.stringify(wtype)
            console.log(wtype)
            const nowDate: number = getCurrentUnixTime();

            await sqlHandlesTodo({
                type: 'insert',
                text: `INSERT INTO articlelist (author, createTime, title, content, modified, main, coverImg, wtype) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                values: [author, nowDate, title, content, nowDate, main, coverImg, wtype],
                token,
                errmsg: '发布失败'
            });

            success(res, null, '发布成功');
        } catch (err) {
            error(res, err);
        }
    },
    //发布评论
    '/addComment': async (req: Request, res: Response) => {
        try {
            // 遍历文件夹下的所有图片
            const imgs = fs.readdirSync(path.join(__dirname, '../../public/img/comments'));

            // 获取前端传入的参数
            const {content, aid, replyId, groundId, email, name, userIp, imgIndex} = req.body;
            const img: string = `http://${req.get("Host")}/public/img/comments/${imgs[imgIndex]}`;
            const nowDate: number = getCurrentUnixTime();

            const sqlTxt = `
            INSERT INTO wcomment(content, article_id, reply_id, ground_id, email, user_name, user_ip, time, head_img)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
            const values = [content, aid, replyId, groundId, email, name, userIp, nowDate, img];

            await sqlHandlesTodo({type: 'insert', text: sqlTxt, values, hasVerify: true});

            const text: string = `UPDATE articlelist SET comNumber = comNumber + 1 WHERE aid = ?`;
            await sqlHandlesTodo({type: 'update', text, values: [aid], hasVerify: true});

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

            const text = `DELETE FROM wcomment WHERE comId = ?`;
            const values = [comId];

            await sqlHandlesTodo({type: 'delete', text, values, token});

            const updateText: string = `UPDATE articlelist SET comNumber = comNumber - 1 WHERE aid = ?`;
            await sqlHandlesTodo({type: 'update', text: updateText, values: [aid], hasVerify: true});

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

            // 执行查询
            const response = await sqlHandlesTodo({
                type: 'insert',
                text: `INSERT INTO articletype (name) VALUES (?)`,
                values: [name],
                hasVerify: true
            });

            success(res, response, '添加成功');
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
