import express, { Application, json, Request, Response } from "express";
import { ErrorR } from "./typings/PostReturn";
import router from "./src/router/router";
import fs from "fs";
import path from "path";

const app: Application = express()

app.use(json())



app.all("*", (req: Request, res: Response, next) => {
  // 设置跨域
  res.header("Access-Control-Allow-Origin", "*")
  // 设置请求头
  res.header("Access-Control-Allow-Headers", "*")
  // 设置请求方式
  res.header("Access-Control-Allow-methods", "GET,POST")
  //验证发送过来的数据是否为json格式,如果不是则将其转换成字符串
  if (req.headers['content-type'] === 'application/x-www-form-urlencoded;charset=UTF-8') {
    req.body = JSON.parse(req.body.para)
  }
  if (!req.body && typeof req.body === 'string') {
    return res.send(<ErrorR>{ code: 204, msg: '发送的参数错误' })
  }
  //放行配置
  const allowUrl = ['/login', '/register', '/public', '/']
  //使用正则匹配 来判断是否放行
  const isAllow = allowUrl.some((item: string) => {
    const reg = item === "/" ? new RegExp(`^${item}$`) : new RegExp(`^${item}`)
    return reg.test(req.url)
  })
  //判断是否登录 并且不是放行的路由
  // console.log(req.headers.authorization, !isAllow);
  // if (isAllow || req.headers.authorization) {
  //   next()
  // }
  // return res.send(<ErrorR>{ code: 401, msg: '请先登录' })
  next()
})

//路由
app.use('/', router)

app.use('/public', express.static('public'));//将文件设置成静态

app.listen(8089, () => {
  console.log("server is running at http://localhost:8089")
})
