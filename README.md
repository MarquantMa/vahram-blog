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

## 本地运行与构建

```bash
npm install
npm run dev    # 本地实时预览
npm run build  # 生成静态页面至 dist/
npm test       # 运行自动化验证
```
