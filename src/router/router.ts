import { Router } from "express";
const router = Router()
import { get, post } from "./apiConfig";

//添加路由
[get, post].forEach((method, index) => {
  for (const item of method) {
    const keys = Object.keys(item)[0]
    /* keys是路由路径，item[keys]是路由方法 */
    router[index == 0 ? "get" : "post"](keys, item[keys])
    /* router.get("keys","function") */
  }
});

export default router
