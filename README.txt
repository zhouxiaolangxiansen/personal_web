# 个人网站 · 数字花园

用 Astro + Tailwind CSS v4 搭建的个人网站：博客 / 摄影与视频展示 / 学习生活记录。
纯静态构建，零外部 CDN 依赖，适合国内访客访问。

- 线上地址：https://zhoudaniu.party （www.zhoudaniu.party 301 跳转主域）
- 素材存储：Cloudflare R2，自定义域名 https://assets.zhoudaniu.party

## 本地开发

  npm install      # 安装依赖（国内先切镜像：npm config set registry https://registry.npmmirror.com）
  npm run dev      # 开发服务器 http://localhost:4321
  npm run build    # 构建静态站点到 dist/
  npm run preview  # 本地预览构建结果

## 日常更新流程（只写 md 文件）

所有内容都在 src/content/ 下，加文件即发布，不用碰任何代码：

### 写博客 → src/content/blog/ 新建 .md

  ---
  title: 文章标题
  description: 一句话摘要
  pubDate: 2026-10-01
  tags: ['随笔', '摄影']
  cover: https://assets.zhoudaniu.party/photos/xxx.jpg   # 可选封面，本地/R2 地址均可
  ---

  正文支持标准 Markdown，插图直接写 ![描述](https://assets.zhoudaniu.party/photos/xxx.jpg)

### 加照片 → src/content/photos/ 新建 .md（一个文件 = 一张照片）

  ---
  title: 川西 · 日照金山
  category: 风景          # 分类自动聚合生成筛选按钮，随便起名
  src: https://assets.zhoudaniu.party/photos/mountain.jpg
  order: 1                # 数字越小排越前（可选，默认 99）
  ---

### 加视频 → src/content/videos/ 新建 .md（一个文件 = 一个视频）

  ---
  title: 延时摄影 · 城市夜色
  src: https://assets.zhoudaniu.party/videos/city.mp4   # 视频地址（R2）
  cover: https://assets.zhoudaniu.party/photos/city.jpg # 封面（可选）
  description: 一段说明文字（可选）
  order: 1
  ---

  说明：没有 src 只有 cover 时显示"封面 + 播放按钮"卡片；
  两者都没有时显示虚线占位卡片（待上传状态）。

### 发布

  git add . && git commit -m "更新内容" && git push
  Cloudflare Pages 1~3 分钟后自动构建上线。

## R2 素材上传

控制台拖拽上传，或命令行：

  npx wrangler r2 object put 桶名/photos/mountain.jpg --file=./mountain.jpg

上传后公开地址即：https://assets.zhoudaniu.party/photos/mountain.jpg
建议目录：photos/（图片）、videos/（视频）。视频不要放进 git 仓库。

## 目录结构

  src/
    content/blog/        # 博客文章（Markdown）
    content/photos/      # 照片元数据（一个 md = 一张照片）
    content/videos/      # 视频元数据（一个 md = 一个视频）
    components/          # 导航、页脚、粒子背景等组件
    layouts/Layout.astro # 全局布局（滚动进度条、卡片倾斜、光标光晕）
    pages/               # 页面：/ 首页、/blog、/gallery、/life
    styles/global.css    # 全局样式与动画
  public/
    images/gallery/      # 本地示例照片（可逐步迁到 R2 后删除）

## 常用自定义入口

- 站点名称 / 导航：src/components/Navbar.astro
- 页脚信息：src/components/Footer.astro
- 首页打字机文案、统计数字：src/pages/index.astro 顶部变量
- 时间线事件：src/pages/life.astro 的 events 数组
- 主题色 / 动画速度：src/styles/global.css
- 域名配置：astro.config.mjs 的 site 字段（当前为 https://zhoudaniu.party）

## 部署（已完成，仅供参考）

项目已连接 GitHub 仓库自动部署到 Cloudflare Pages：
构建命令 npm run build，输出目录 dist，环境变量 NODE_VERSION=22。
