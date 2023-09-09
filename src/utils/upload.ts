import multer, {Options} from "multer";
import mime from "mime";
import {Request, Response} from "express";
import path from "node:path";
import {errorHandle} from "./error";
import crypto from "crypto";

const {success, error} = errorHandle


// 允许存储的文件类型
const allowImgType = [
    'image/jpg',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
];

// 文件存储位置
const storage_path = path.join(__dirname, '../../public/img/articleImages');

// 文件存储配置
const storage = multer.diskStorage({
    destination: function (req: Request, file, cb) {
        cb(null, storage_path);
    },
    filename: function (req: Request, file, cb) {
        if (allowImgType.includes(file.mimetype)) {
            console.log(file.stream)
            const nameMd5 = crypto.createHash('md5')
            nameMd5.update(JSON.stringify(file.stream))
            const dogerstName = nameMd5.digest('hex')
            console.log(dogerstName)
            const imgtype = mime.getExtension(file.mimetype);
            const suffix = dogerstName + '.' + imgtype;
            cb(null, file.fieldname + suffix);
        } else {
            const err = new Error('当前文件暂不支持上传,暂时只支持jpg.jpeg,png,gif,bmp,webp,svg,icon等图片。');
            cb(err, file.fieldname);
        }
    }
});

// multer限制配置
let limits: Options['limits'] = {
    fileSize: 1024 * 1024 * 2, // 1024字节=1kb, 1024kb=1MB
    files: 1, // 一次上传一张
};

/**
 * 上传图片的公共处理函数
 * @param req 请求对象
 * @param res 响应对象
 * @param limit 限制配置
 * @param fieldname 文件字段名，默认为'headImg'
 */
const upload = (req: Request, res: Response, limit?: Options['limits'], fieldname: string = 'headImg') => {
    // 合并配置
    limits = Object.assign(limits, limit);
    const multerUp = multer({storage, limits,}).single(fieldname);

    multerUp(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return error(res, err.message + '文件大小超出2MB，请重新选择！')
        } else if (err) {
            return error(res, err)
        }
        const imgPath: string = req.file.path.replace(/\\/g, '/');
        const host = 'http://' + req.headers.host;
        const publicPath = '/public';
        const relativePath = imgPath.split(publicPath)[1];
        return success(res, host + publicPath + relativePath, '上传成功')
    });
};

/**
 * 上传文章图片的处理函数
 * @param req 请求对象
 * @param res 响应对象
 * @param limit 限制配置
 * @param fieldname 文件字段名，默认为'upload-image'
 */
const uploadArticleImg = (req: Request, res: Response, limit?: Options['limits'], fieldname: string = 'upload-image') => {
    // 合并配置
    const limitsMerged = Object.assign({}, limits, limit);
    const ArticleUp = multer({storage, limits: limitsMerged}).single(fieldname);

    ArticleUp(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return error(res, err + '文件大小超出10MB，请重新选择！')
        } else if (err) {
            return error(res, err)
        }

        // 构造图片URL
        const imgPath: string = req.file.path.replace(/\\/g, '/');
        const host = 'http://' + req.headers.host;
        const publicPath = '/public';
        const relativePath = imgPath.split(publicPath)[1];
        const imgUrl = host + publicPath + relativePath;

        // 返回数据
        // const responseData: ResponseData<string> = {code: 200, msg: '上传成功', data: imgUrl};
        // return res.send(responseData);
        return success(res, imgUrl, "上传成功")
    });
};

export {upload, uploadArticleImg};