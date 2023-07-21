import {Request, Response} from "express";
import fs from "fs";
import path from "path";
import {mapGather, tokenClass} from "../utils/common";
import {errorHandle} from "../utils/error";
import {upload, uploadArticleImg} from "../utils/upload";
import sqlHandlesTodo from "../utils/mysql";
import dayjs from "dayjs";
import {ResponseData, ErrorR} from "../../typings/PostReturn";
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
        const url: string = "https://api.github.com/graphql"
        try {
            axios.post(url,parps ,{headers}).then(response => {
                success(res, response.data.data)
            });
        }catch (e) {
            error(res, e)
        }
    },
    //登录
    "/login": function (req: Request, res: Response) {
        const {username, password} = req.body;
        const text = `select * from USERLIST where username='${username}' and password='${password}'`
        sqlHandlesTodo({type: 'select', text, hasVerify: true, errmsg: '账号或者密码错误'}).then((result: User[]) => {
            const tokenLine: string = tokenClass.token({
                username: result[0].username,
                uname: result[0].uname
            })
            success(res, tokenLine, '登录成功')
        })
            .catch(err => error(res, err))
    },
    //新增用户账号
    '/addUserLzy': (req: Request, res: Response) => {
        let {name, username, password, power, headImg, perSign} = req.body
        const token = req.headers.authorization
        //当前时间
        const date = dayjs().format('YYYY-MM-DD HH:mm:ss')
        //设置属性
        const values = [name, username, password, power, date, date, headImg, true, perSign];
        const text = `insert into USERLIST(uname,username,password,power,createDate,lastLoginDate,headImg,isUse,perSign) values(${values.map(res => "'" + res + "'").join()})`
        sqlHandlesTodo({type: 'insert', text, token})
            .then((result) => {
                success(res, result, '添加成功')
            })
            .catch(err => {
                error(res, err)
            })
    },
    //修改用户账号
    '/updateUserLzy': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const token = req.headers.authorization
        const para = req.body
        para.lastLoginDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
        // sql声明
        let text = `UPDATE USERLIST SET uname='${para.name}',username='${para.username}',password='${para.password}',power='${para.power}',lastLoginDate='${para.lastLoginDate}',isUse='${para.isUse}',perSign='${para.perSign}' WHERE uid=${para.uid}`
        // 调用修改方法
        sqlHandlesTodo({type: 'update', text, token})
            .then(item => success(res, item, '修改成功'))
            .catch(err => error(res, err))
    },
    //删除用户账号
    '/deleteUserLzy': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const {id} = req.body
        const token = req.headers.authorization
        // sql声明
        let text = `DELETE FROM USERLIST WHERE uid=${id};`
        // 调用删除方法

        sqlHandlesTodo({type: 'delete', text, token})
            .then(item => {
                success(res, item, '删除成功')
            }).catch(err => error(res, err))
    },
    //上传用户头像
    '/uploadHead': (req: Request, res: Response) => {
        upload(req, res)
    },
    //修改文章内容
    '/updateArticle': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const token = req.headers.authorization
        const para = req.body
        para.main = para.main.replaceAll(/\\'/g, "'").replaceAll(/\'/g, "\'")
        para.content = para.content.replaceAll(/\\'/g, "'").replaceAll(/\'/g, "\\'")
        const sqlTxt = `UPDATE articlelist SET
                title='${para.title}',
                coverContent='${para.coverContent}',
                content='${para.content}',main='${para.main}', 
                coverImg='${para.coverImg}',
                modified='${para.modified}', wtype='${para.wtype}'
                WHERE aid='${para.aid}' `

        // 调用修改方法
        sqlHandlesTodo({type: 'update', text: sqlTxt, token})
            .then(item => success(res, item, '修改成功'))
            .catch(err => error(res, err))
    },
    //上传文章封面或者内容图片
    '/uploadArticleImg': (req: Request, res: Response) => {
        uploadArticleImg(req, res)
    },
    //发布评论
    '/addComment': (req: Request, res: Response) => {

        //遍历文件夹下的所有图片
        const imgs = fs.readdirSync(path.join(__dirname, '../../public/img/comments'))
        //获取前端传入的参数
        const {content, aid, replyId, groundId, email, name, userIp, imgIndex} = req.body
        //获取当前图片的服务地址
        const img: string = `http://${req.get("Host")}/public/img/comments/${imgs[imgIndex]}`
        //当前时间 时间戳
        const nowDate: number = dayjs().unix();
        const sqlTxt: string = `
            insert into wcomment(content, article_id, reply_id,ground_id, email, user_name,user_ip,time,head_img)
            values('${content}', '${aid}', '${replyId}','${groundId}', '${email}', '${name}', '${userIp}','${nowDate}','${img}')
          `
        sqlHandlesTodo({type: 'insert', text: sqlTxt, hasVerify: true})
            .then(item => {
                const text: string = `update articlelist set comNumber=comNumber+1 where aid=${aid}`
                sqlHandlesTodo({type: 'update', text, hasVerify: true}).then(resq => {
                    success(res, '评论成功')
                })
            })
            .catch(err => error(res, err))
    },
    //删除评论
    '/deleteComment': (req: Request, res: Response) => {
        // 获取前端传入的参数
        const {comId, aid} = req.body
        const token = req.headers.authorization
        // sql声明
        let text = `DELETE FROM wcomment WHERE comId=${comId};`
        // 调用删除方法
        sqlHandlesTodo({type: 'delete', text, token})
            .then(item => {
                const text: string = `update articlelist set comNumber=comNumber-1 where aid=${aid}`
                sqlHandlesTodo({type: 'update', text, hasVerify: true}).then(resq => {
                    success(res, '删除成功')
                })
            }).catch(err => error(res, err))
    },


})

export default post
