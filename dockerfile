# 使用 Node.js 镜像作为基础镜像
FROM node:14

# 添加一个随机时间戳作为标签
ARG CACHEBUST=$(date'+%Y%m%d%H%M%S')

# 复制源代码到容器中
COPY . ./app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 设置工作目录
WORKDIR /app


# 安装项目依赖
RUN npm install

# 构建 TypeScript 项目
RUN npm run tsc

# 暴露应用程序的端口
EXPOSE 8089

# 标签中包含时间戳，确保每次构建都是新的
LABEL build.date=$CACHEBUST

# 运行应用程序
CMD ["npm", "start"]
