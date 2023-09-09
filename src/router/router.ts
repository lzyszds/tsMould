import {Router} from "express";
import post from "./postApiList";
import get from "./getApiList";
import proxy from "./proxyApi";

import {ApiConfig} from "../../typings/ApiCongfigType";

const router = Router()

const DEFAULT_PATH: any = {
    get: '/overtApis',//共有接口默认路径 get请求
    post: '/privateApis',//私有接口默认路径 post请求
    proxyGet: '/proxyApis',//代理接口默认路径 get请求
    proxyPost: '/proxyApis',//代理接口默认路径 post请求
};

//添加路由
[get, post, proxy.get, proxy.post].forEach((method: ApiConfig[], index: number): void => {
    let requestMethod: string = ['get', 'post', 'proxyGet', "proxyPost"][index]
    const isGet: boolean = requestMethod === 'get' || requestMethod === 'proxyGet'
    for (const item of method) {
        //获取对象的key
        let keys: string = Object.keys(item)[0]
        //拼接路径 如果是get则使用get的路径 如果是post则使用post的路径
        let key: string = DEFAULT_PATH[requestMethod] + keys
        //如果是根路径 则直接使用根路径
        if (keys === "/") key = "/"
        /* keys是路由路径，item[keys]是路由方法 */
        router[isGet ? "get" : "post"](key, item[keys])
    }
});

export default router
