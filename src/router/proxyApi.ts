import {mapGather} from "../utils/common";
import {Request, Response} from "express";
import {errorHandle} from "../utils/error";
import axios from "axios";
import {ProxyType} from "../../typings/ApiCongfigType";
import path from "node:path";
import fs from "node:fs";

const {success, error} = errorHandle

const proxy: ProxyType = {
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
            axios.get(url, {
                "headers": {
                    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
                    "cache-control": "no-cache",
                    "pragma": "no-cache",
                    "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "document",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-site": "none",
                    "sec-fetch-user": "?1",
                    "upgrade-insecure-requests": "1",
                    "cookie": "X-User-Token=lYw6OgAbhFstAF7hZzSKWJIZN613qwEE"
                },
            }).then(response => {
                res.json(response.data);
            }).catch(e => {
                res.json(e)
            });

        },
        //随机诗词
        '/jinrishici/sentence':
            async (req: Request, res: Response) => {
                //查询语句
                const url: string = "https://v2.jinrishici.com/sentence"
                const headers: any = {
                    "Cookie": "X-User-Token=6zImt+uqp/1XS0CJBkw25piggo2ysiiu"
                }

                axios.get(url, {headers}).then(response => {
                    res.json(response.data);
                }).catch(e => {
                    res.json(e)
                });
            },
        //github api
        "/github":
            async (req: Request, res: Response) => {
                try {
                    console.log(process)
                    const filePath = path.resolve(__dirname, '../../public/json/getGithubInfo.json');
                    //打包想要路径
                    // const filePath = path.resolve(__dirname, './public/json/getGithubInfo.json');
                    // console.log(filePath)
                    const data = fs.readFileSync(filePath);
                    success(res, JSON.parse(data.toString()))
                } catch (e) {
                    error(res, e)
                }
            },
    }),
    "post":
        mapGather({})
}
export default proxy