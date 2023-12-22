import {mapGather} from "../utils/common";
import {Request, Response} from "express";
import {errorHandle} from "../utils/error";
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
            const ip = req.ip
            res.send(`Client IP Address: ${ip}`);
        },
        //github api
        "/github":
            async (req: Request, res: Response) => {
                try {
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