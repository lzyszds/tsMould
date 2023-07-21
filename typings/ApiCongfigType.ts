interface ApiConfig {
    /*
      key: api 地址
      value: 回调函数 需要传入 req, res 类型HttpResult
     */
    [key: string]: (arg: HttpResult) => void;
}

interface HttpResult {
    req: Request,
    res: Response
}

interface ParamsMuster {
    pages?: number,
    limit?: number,
    search?: string
}

interface ProxyType {
    get: ApiConfig[],
    post: ApiConfig[]
}

export {
    ApiConfig,
    HttpResult,
    ParamsMuster,
    ProxyType
}
