node.js + ts + express 的后台管理系统 只提供接口，不提供页面

## 项目结构

```

├── src
│   ├── router
│   │   ├── getApiList.ts
│   │   ├── postApiList.ts
│   │   ├── router.ts
│   ├── utils
│   │   ├── common.ts
│   │   ├── error.ts
│   │   ├── mysql.ts
│   │   ├── upload.ts
├── typings
│   ├── ApiCongfigType.ts
│   ├── PostReturn.ts
│   ├── User.ts
├── app.ts
├── README.md
├── package.json
├── tsconfig.json
├── yarn.lock

```

## 项目运行

```
yarn install
yarn server
```

## 项目说明

### 错误码表格

| 错误码 | 说明    |
|-----|-------|
| 200 | 成功    |
| 400 | 参数错误  |
| 401 | 未登录   |
| 403 | 无权限   |
| 404 | 未找到   |
| 500 | 服务器错误 |





