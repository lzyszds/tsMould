import multer, { Options } from "multer";
import mime from "mime";
import { Request, Response } from "express";
import path from "path";
import { ResponseData } from "../../typings/PostReturn";
import { ErrorR } from "../../typings/PostReturn";


//允许存储的文件类型
const allowImgType = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
]


var storage_path = path.join(__dirname, '../../public/img/updateImg/headUpdate')

//文件存储位置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storage_path)
  },
  filename: function (req, file, cb) {
    if (allowImgType.includes(file.mimetype)) {
      const imgtype = mime.getExtension(file.mimetype)
      const suffix = Date.now() + '.' + imgtype
      cb(null, file.fieldname + suffix)
    } else {
      const err = new Error('当前文件暂不支持上传,暂时只支持jpg.jpeg,png,gif,bmp,webp,svg,icon等图片。')
      cb(err, file.fieldname)
    }
  }
})

/* 
  multer文档地址
  https://github.com/expressjs/multer/blob/master/doc/README-zh-cn.md
*/
let limits: Options['limits'] = {
  fileSize: 1024 * 1024 * 2, //1024字节=1kb  1024kb=1MB 
  files: 1,//一次上传一张
}


const upload = (req: Request, res: Response, limit?: Options['limits']) => {
  // 合并两个对象
  limits = Object.assign(limits, limit)
  const multerUp = multer({ storage, limits, }).single('headImg')

  multerUp(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.send({ code: 500, msg: '文件大小超出2MB,请重新选择！' } as ErrorR)
    } else if (err) {
      console.log(`lzy  err:`, err)
      return res.send({ code: 500, msg: err } as ErrorR)
    }
    const path: string = req.file.path.replace(/\\/g, '/').split("public")[1]
    const head = "http://" + req.headers.host

    return res.send({ code: 200, msg: '上传成功', data: head + "/public" + path } as ResponseData<string>)
  })
}


const uploadArticleImg = (req: Request, res: Response, limit?: Options['limits']) => {
  // 合并两个对象
  limits = Object.assign(limits, limit)
  const ArticleUp = multer({ storage, limits, }).single('upload-image')

  ArticleUp(req, res, function (err) {
    storage_path = req.headers.host

    if (err instanceof multer.MulterError) {
      return res.send({ code: 500, message: '文件大小超出10MB,请重新选择！1' })
    } else if (err) {
      return res.send({ code: 500, message: err })
    }
    const path = req.file.path.replace(/\\/g, '/')
    return res.send({ code: 200, message: path })
  })
}
export {
  upload,
  uploadArticleImg
}
