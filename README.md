# Vahram 的 blog

> **Apple Newsroom 极简风格中英双语个人博客**  
> 线上地址：[https://vahram.pages.dev](https://vahram.pages.dev)

---

## 核心设计

- **Apple Newsroom 极简排版**：无任何冗余按钮与干扰组件，严格按照发布时间顺序（最新在前）展示全部文章。
- **三个纯粹分类筛选**：仅提供 `Personal`、`Tech`、`Entrepreneurship` 三个筛选器（再次点击已选筛选器即可恢复查看全部时间流文章）。
- **一键中英双语切换**：顶部导航栏内置 `[ English | 中文 ]` 分段胶囊，零刷新切换标题、日期与正文，并自动保持阅读滚动位置。
- **GitHub 直接上传发布**：在 `content/posts/` 下新建 Markdown 文件并提交即可发布。

---

## 发布新文章模板

在 GitHub 仓库的 `content/posts/` 目录下新建 `YYYY-MM-DD-slug.md`：

```markdown
---
title: "English Title"
title_zh: "中文标题"
date: "2026-11-03"
category: "Tech" # Personal | Tech | Entrepreneurship
---

<!-- lang:en -->
English content here...

<!-- lang:zh -->
中文翻译正文...
```

---

## 🖼️ 如何上传带有图片的文章？

完全支持 Markdown 自带本地图片，支持以下 3 种极简方式：

### 方式 1：集中图片目录（推荐，最省心）
把图片放进 `content/posts/images/` 目录（例如 `content/posts/images/chip.png`），在 Markdown 里直接写：
```markdown
![芯片架构图](images/chip.png)
```
或者指定封面图：
```markdown
coverImage: "images/chip.png"
```

### 方式 2：每篇文章独立文件夹（适合包含多张图的长文）
在 `content/posts/` 下新建一个文章专属文件夹：
```text
content/posts/my-new-post/
├── index.md        # 文章内容
├── diagram.png     # 配图 1
└── photo.jpg       # 配图 2
```
在 `index.md` 里直接引用同级图片：
```markdown
![流程图](./diagram.png)
```

### 方式 3：在 GitHub 网页编辑时直接拖拽/粘贴图片
在 GitHub 网页端新建或编辑 `.md` 文件时，直接把本地图片**拖拽进编辑框**或按 `Cmd + V` 粘贴，GitHub 会自动生成并托管该图片链接（如 `![image](https://...)`），开箱即用！

---

## 本地命令行发文（一行命令全自动发布）

项目已为您配置好了 **Git 自动联动钩子** 和 **一键发布脚本**，您完全不需要去网页上点来点去：

### 方式 A：纯 Git 习惯（您只要像平时一样 `git push`）
在项目目录下：
```bash
git add -A
git commit -m "发布新文章"
git push
```
> ⚡ **全自动发生**：Git 内置的 `pre-push` 钩子会在推送代码的同时，**自动完成静态编译并直推 Cloudflare Pages**，全球 CDN 3 秒内同步更新！

---

### 方式 B：超省事一条命令搞定（自动编译 + 部署 + 提交 + 推送）
```bash
npm run deploy "发布我的新文章"
```
> 一键全自动完成：静态编译 ➔ 部署到 `vahram.pages.dev` ➔ `git commit` ➔ `git push` 到 GitHub。

---

## 本地运行与构建

```bash
npm install
npm run dev    # 本地实时预览
npm run build  # 生成静态页面至 dist/
npm test       # 运行自动化验证
```
