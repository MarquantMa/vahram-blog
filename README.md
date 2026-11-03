#  Vahram 的 blog (Vahram's Blog)

> **Apple Newsroom 风格中英双语个人博客**  
> 托管于 Cloudflare Pages 边缘网络：[vahram.pages.dev](https://vahram.pages.dev)  
> 支持在 GitHub 网页端直接撰写上传富文本 / Markdown，中英文版本**一键无刷新瞬时切换**。

---

## 🌟 核心特性

- 🎨 **Apple Newsroom 纯正设计语言**
  - 苹果官方 San Francisco 字体家族阶梯、舒展的大写眉标（Eyebrow）与紧凑字距标题。
  - 毛玻璃顶栏（Translucent Frosted Glass，`backdrop-filter: blur(20px)`）。
  - 焦点精选巨幕卡片（Featured Hero Story）、多列响应式新闻卡片、新闻学传统发生地线（Dateline）。
  - 仿 macOS 窗口红黄绿三色圆点代码块，支持语法高亮与一键复制代码。
  - 苹果经典明眸暗黑模式（Light / Dark Theme）随系统偏好平滑切换。

- ⚡ **一键双语极速切换 (Instant Bilingual Switching)**
  - 每篇文章同时具备英文版（English）与中文版（中文），在文章顶部及悬浮导航栏提供苹果分段胶囊控制按钮 `[ 🇬🇧 English | 🇨🇳 中文 ]`。
  - **点击一键即切**：无需刷新页面，不丢失阅读进度，标题、摘要、日期地线及全篇正文毫秒级切换。
  - 状态持久化：自动同步浏览器 URL 参数（如 `?lang=zh`，便于单语分享），并依托 `localStorage` 记忆全站阅读偏好。

- ✍️ **直接在 GitHub 网页端上传与撰写富文本**
  - 无需打开终端或运行复杂指令，随时在浏览器访问 GitHub 仓库的 `content/posts/` 目录。
  - 直接新建 `.md` 文件，利用 GitHub 内置的富文本 / Markdown 编辑器撰写英文并粘贴中文译文。
  - 点击保存提交（Commit），Cloudflare Pages 自动秒级重新构建并发布上线！

- 🚀 **Cloudflare Pages 全球边缘托管 (vahram.pages.dev)**
  - 采用超轻量高性能静态编译器，全站构建耗时 < 100ms。
  - 页面输出为纯静态 HTML/CSS/JS，全球 300+ 边缘节点毫秒级首字节响应 (TTFB)。
  - 内置 RSS 2.0 订阅源 (`/rss.xml`)、XML 站点地图 (`/sitemap.xml`) 与 ⌘K Spotlight 极速搜索。

---

## 📝 如何直接在 GitHub 上撰写与上传新文章？

这是为您量身打造的最简发布工作流：

### 第一步：在 GitHub 网页端新建文章
1. 打开您的 GitHub 博客仓库页面。
2. 进入目录：`content/posts/`。
3. 点击右上角的 **「Add file」 -> 「Create new file」**。
4. 输入文件名，建议格式：`YYYY-MM-DD-文章英文标题.md`（例如 `2026-11-05-my-new-thoughts.md`）。

### 第二步：复制双语模板
直接从 `content/posts/TEMPLATE.md` 复制以下结构并填入您的内容：

```markdown
---
title: "Your English Article Title"
title_zh: "您的中文文章标题"
date: "2026-11-05"
category: "Engineering"
category_zh: "工程架构"
author: "Vahram"
readTime: "4 min read"
readTime_zh: "4 分钟阅读"
coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80"
summary: "A concise English summary for the Apple Newsroom card."
summary_zh: "用于 Apple Newsroom 风格卡片展示的中文简述。"
dateline: "CUPERTINO, CALIFORNIA — November 5, 2026"
dateline_zh: "加利福尼亚州库比蒂诺 — 2026年11月5日"
featured: false
tags: ["Tech", "Design"]
---

<!-- lang:en -->
### Cupertino, California — November 5, 2026
Here is your English content. Supports all Markdown and rich text formatting:
- **Bold**, *Italics*, [Links](https://vahram.pages.dev)
- Code blocks with syntax highlighting
- Images and quotes

<!-- lang:zh -->
### 加利福尼亚州库比蒂诺 — 2026年11月5日
在这里输入您自己翻译的中文版本。所有富文本格式一应俱全。
```

> 💡 **小贴士**：
> - 可以在 GitHub 编辑器中点击 **「Preview」** 实时预览排版效果。
> - 如果需要上传图片，可直接将本地图片拖拽粘贴到 GitHub 编辑器中，GitHub 会自动生成图片外链。
> - 若某篇文章暂时来不及翻译中文，中文部分可留空，系统会自动展示英文原文并附带温和提示。

### 第三步：点击提交，自动上线！
点击页面右上角绿色的 **「Commit changes...」** 按钮。
Cloudflare Pages 会立即捕获该次提交并在 15 秒内自动更新 **`https://vahram.pages.dev`**！

---

## 💻 本地开发与运行指令

若希望在本地电脑上进行写作、预览或定制样式：

```bash
# 1. 安装依赖（基于极速镜像源，仅需 2 秒）
npm install

# 2. 启动本地开发与实时热更新服务器
npm run dev
# 浏览器打开 http://localhost:3000/ 即可实时预览，修改 content/posts/ 自动秒级重新编译！

# 3. 执行静态构建（生成 dist/ 目录）
npm run build

# 4. 运行全站自动化验证测试
npm run test

# 5. （可选）通过命令行一键生成新文章草稿
npm run new-post -- "Exploring Next Generation Interfaces" "探索下一代人机交互界面"
```

---

## 📁 项目目录结构

```
vahram-blog/
├── content/
│   └── posts/                                  # 存放所有博客文章（GitHub 网页端在此增改）
│       ├── TEMPLATE.md                         # 官方双语模板
│       ├── 2026-11-01-welcome-to-vahram-blog.md
│       ├── 2026-11-02-designing-apple-newsroom-style.md
│       ├── 2026-11-03-ambient-intelligence-agents.md
│       └── 2026-11-04-craft-of-software-engineering.md
├── public/                                     # 静态公共资源（图标、Cloudflare 规则）
│   ├── favicon.svg                             # 专属矢量 Favicon
│   ├── _headers                                # Cloudflare Pages 安全与缓存响应头
│   └── _redirects                              # Cloudflare 路由重定向规则
├── src/
│   ├── styles/
│   │   └── main.css                            # Apple Newsroom 经典排版与视觉样式表
│   └── scripts/
│       └── app.js                              # 一键中英双语切换、⌘K Spotlight 搜索、深色模式
├── build.js                                    # 超轻量静态网站生成器 (SSG)
├── dev-server.js                               # 本地开发预览服务器（带文件热重载）
├── test-build.js                               # 自动化端到端测试套件
├── wrangler.toml                               # Cloudflare Pages 配置文件（绑定 vahram）
├── CLOUDFLARE_DEPLOYMENT.md                    # 详尽的 Cloudflare Pages 部署说明书
└── package.json
```

---

## 🌐 Cloudflare Pages 部署指南

详见项目根目录下的 [CLOUDFLARE_DEPLOYMENT.md](file:///Users/marquant/.gemini/antigravity/scratch/vahram-blog/CLOUDFLARE_DEPLOYMENT.md)。

简明三步配置：
1. **GitHub 推送**：将代码仓库推送到 GitHub。
2. **Cloudflare 绑定**：在 Cloudflare 仪表盘选择 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. **设置参数**：
   - Project Name: `vahram` （即可生成 `vahram.pages.dev`）
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 点击 **Save and Deploy**，即可在 **https://vahram.pages.dev** 正式上线。
