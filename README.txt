# 个人网站 · 数字花园

用 Astro + Tailwind CSS v4 搭建的个人网站：博客 / 摄影与视频展示 / 学习生活记录。
纯静态构建，零外部 CDN 依赖（字体、脚本全部本地打包），适合国内访客访问。

## 本地开发

  npm install      # 安装依赖
  npm run dev      # 启动开发服务器 http://localhost:4321
  npm run build    # 构建静态站点到 dist/
  npm run preview  # 本地预览构建结果

## 目录结构

  src/
    content/blog/       # 博客文章（Markdown，加文件即发布）
    components/         # 导航、页脚、粒子背景等组件
    layouts/Layout.astro# 全局布局（含滚动进度条、卡片倾斜、光标光晕）
    pages/              # 页面：/ 首页、/blog、/gallery、/life
    styles/global.css   # 全局样式与动画
  public/
    images/gallery/     # 摄影照片（直接替换为你的作品）

## 怎么写一篇新博客

在 src/content/blog/ 里新建 .md 文件：

  ---
  title: 文章标题
  description: 一句话摘要
  pubDate: 2026-10-01
  tags: ['随笔', '摄影']
  cover: /images/gallery/mountain.jpg   # 可选封面
  ---

  正文支持标准 Markdown（标题、列表、引用、代码块、表格）。

## 怎么换照片 / 加视频

- 照片：替换 public/images/gallery/ 下的图片，并在 src/pages/gallery.astro
  的 photos 数组里更新文件名、标题、分类。
- 视频：视频不建议放仓库（体积大），推荐上传到 Cloudflare R2（存储便宜、
  流量免费），拿到公开链接后，把 gallery.astro 中的视频卡片换成：

  <video src="https://你的R2地址/xxx.mp4" controls class="w-full rounded-2xl"></video>

## 部署到 Cloudflare Pages（免费）

1. 把本项目推送到 GitHub / GitLab 仓库
2. 打开 https://dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git
3. 选择仓库，构建配置（一般会自动识别 Astro）：
   - 构建命令：npm run build
   - 输出目录：dist
   - 环境变量：NODE_VERSION = 22
4. 点 Save and Deploy，之后每次 git push 自动重新部署
5. 绑定域名：Pages 项目 → Custom domains → 添加你的域名，
   按提示在域名服务商处加一条 CNAME 记录即可（免费自动 HTTPS）

也可以用命令行直接部署：npx wrangler pages deploy dist --project-name=personal-web

## 常用自定义入口

- 站点名称 / 导航：src/components/Navbar.astro
- 页脚信息：src/components/Footer.astro
- 首页打字机文案、统计数字：src/pages/index.astro 顶部变量
- 时间线事件：src/pages/life.astro 的 events 数组
- 主题色 / 动画速度：src/styles/global.css
- 网站域名（生成 sitemap 用）：astro.config.mjs 里的 site 字段
