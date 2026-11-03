/**
 * Vahram's Blog - New Post Helper Script
 * Usage: npm run new-post -- "My Post Title" "中文文章标题"
 */

const fs = require('fs');
const path = require('path');

const titleEn = process.argv[2] || "New Article on Technology and Craft";
const titleZh = process.argv[3] || "关于科技与工程艺术的新思考";

const today = new Date().toISOString().substring(0, 10);
const slug = titleEn
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const filename = `${today}-${slug}.md`;
const targetPath = path.join(__dirname, '../content/posts', filename);

if (fs.existsSync(targetPath)) {
  console.error(`❌ File already exists: ${filename}`);
  process.exit(1);
}

const content = `---
title: "${titleEn}"
title_zh: "${titleZh}"
date: "${today}"
category: "Engineering"
category_zh: "工程架构"
author: "Vahram"
readTime: "4 min read"
readTime_zh: "4 分钟阅读"
coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1600&q=80"
summary: "A brief summary of ${titleEn}."
summary_zh: "关于《${titleZh}》的核心摘要与简介。"
dateline: "CUPERTINO, CALIFORNIA — ${today}"
dateline_zh: "加利福尼亚州库比蒂诺 — ${today}"
featured: false
tags: ["Tech", "Reflections"]
---

<!-- lang:en -->
### Cupertino, California — ${today}
Write your English article here...

<!-- lang:zh -->
### 加利福尼亚州库比蒂诺 — ${today}
在这里编写中文翻译内容...
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log(`✅ Created new bilingual blog post: content/posts/${filename}`);
console.log(`✍️ You can now edit this file in your editor or commit and push directly to GitHub!`);
