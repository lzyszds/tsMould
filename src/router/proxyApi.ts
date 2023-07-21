import {mapGather, randomUnique} from "../utils/common";
import {Request, Response} from "express";
import {errorHandle} from "../utils/error";
import axios from "axios";
import {ApiConfig,ProxyType} from "../../typings/ApiCongfigType";
import {headers, parps} from "../utils/config_Github";

const {success, error} = errorHandle

const proxy:ProxyType  = {
    "get": mapGather({
        //网易疫情数据api
        // "/proxy/WYwuhan": (req: Request, res: Response) => {
        //     const url: string = 'https://c.m.163.com/ug/api/wuhan/app/data/list-total'
        //     try {
        //         fetch(url).then(res => res.json()).then(data => {
        //             success(res, data)
        //         })
        //     } catch (e) {
        //         error(res, e)
        //     }
        // },
        //网易云音乐api
        // "/proxy/WYmusic": (req: Request, res: Response) => {
        //     const url: string = 'http://localhost:3000/'
        //     try {
        //         fetch(url).then(res => res.json()).then(data => {
        //             success(res, data)
        //         })
        //     } catch (e) {
        //         error(res, e)
        //     }
        // },
        // 诗词天气预报
        //天气预报以及ip地址
        '/jinrishici/info': async (req: Request, res: Response) => {
            //查询语句
            const url: string = "https://v2.jinrishici.com/info"

            const headers: any = {
                "Cookie": "X-User-Token=6zImt+uqp/1XS0CJBkw25piggo2ysiiu",
                'User-Agent': req.get('User-Agent'), // 可选：将用户代理信息传递给第三方接口
            }
            axios.get(url, {headers}).then(response => {
                res.json(response.data);
            });
        },
        //随机诗词
        '/jinrishici/sentencei': async (req: Request, res: Response) => {
            //查询语句
            const url: string = "https://v2.jinrishici.com/sentence"
            const headers: any = {
                "Cookie": "X-User-Token=6zImt+uqp/1XS0CJBkw25piggo2ysiiu"
            }

            axios.get(url, {headers}).then(response => {
                res.json(response.data);
            });
        },
    }),
    "post": mapGather({
        //github api
        "/github": async (req: Request, res: Response) => {
            const url: string = "https://api.github.com/graphql"
            try {
                axios.post(url,parps ,{headers}).then(response => {
                    success(res, response.data.data)
                });
            }catch (e) {
                error(res, e)
            }
        },
    })
}
export default proxy