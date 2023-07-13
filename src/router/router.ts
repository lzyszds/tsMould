import {Router} from "express";

const router = Router()
import post from "./postApiList";
import get from "./getApiList";
import {ApiConfig} from "../../typings/ApiCongfigType";

//共有接口默认路径 get请求
const OvertDefaultPath: string = '/overtApis';
//私有接口默认路径 post请求
const PrivateDefaultPath: string = '/privateApis';

//添加路由
[get, post].forEach((method: ApiConfig[], index: number): void => {
    const isGet: boolean = index == 0
    for (const item of method) {
        //获取对象的key
        let keys: string = Object.keys(item)[0]
        //拼接路径 如果是get则使用get的路径 如果是post则使用post的路径
        let key: string = (isGet ? OvertDefaultPath : PrivateDefaultPath) + keys
        //如果是根路径 则直接使用根路径
        if (keys === "/") key = "/"

        /* keys是路由路径，item[keys]是路由方法 */
        router[isGet ? "get" : "post"](key, item[keys])
    }
});

export default router
