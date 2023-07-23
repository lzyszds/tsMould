import axios from "axios";
import {headers, parps} from "./config_Github";
import fs from "node:fs"
import path from "node:path"
export default ()=>{
    //node定时任务
    const schedule = require('node-schedule');
    //每天凌晨1点执行
    /*
         * * * * *: 每分钟执行一次
         30 * * * *: 每小时的第30分钟执行一次
         0 /2 * * *: 每2小时执行一次
         0 2 * * *: 每天的第2小时执行一次
         0 9 * * *: 每天早上9点执行一次
         0 0 * * 1: 每周一的午夜执行一次
    */
    schedule.scheduleJob('* * * * *', async function(){
       try {
           // 创建目录
           const jsonDir = path.resolve(__dirname, '../../public/json');
           //打包路径
           // const jsonDir = path.resolve(__dirname, './public/json');
           if (!fs.existsSync(jsonDir)) {
               fs.mkdirSync(jsonDir, { recursive: true });
           }

           const url:string = "https://api.github.com/graphql";
           const response = await axios.post(url, parps, { headers });

           const filePath = path.resolve(jsonDir, 'getGithubInfo.json');
           fs.writeFileSync(filePath, JSON.stringify(response.data.data));

           // 获取当前时间
           const date = new Date();
           console.log("github数据获取成功", date);
       } catch (e) {
           console.error("github数据获取失败", e);
       }
    })
}