/* 定义分页(模糊)查询参数的接口*/
export interface ParamsQuery {
    pages: string;
    limit: string;
    search?: string;
}

export interface Article {
    aid: string
    author: string
    comNumber: string,
    content: string,
    coverContent: string,
    coverImg: string,
    createTime: string,
    main: string,
    modified: string,
    title: string,
    wtype: string,
}

export interface TagType {
    code?: string,
    data?: [
        {
            isUse: string,
            name: string,
            tId: number
        }
    ]
}

export interface Props {
    type: string,
    data?: Article,
    tableheight: number,
}

export interface Storagetype {
    text: string,
    html: string,
}

export interface Informationtypes {
    storage: Storagetype,
    text: any,
    html: any,
    title: string,
    cover: string,
}

/*定义评论对象的接口*/
export interface Comment {
    comId: number;
    content: string;
    article_id: number;
    reply_id: number;
    ground_id: number;
    email: string;
    user_name: string;
    user_ip: string;
    time: number;
    head_img: string;
    replyPeople?: string; // 回复的用户名，仅用于在处理数据时添加
    reply?: Comment[]; // 子评论，仅用于在处理数据时添加
}

// 定义文章类型对象的接口
export interface ArticleType {
    id: number;
    name: string;
    // 其他文章类型属性...
}


