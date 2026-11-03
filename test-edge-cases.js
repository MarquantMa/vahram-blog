/**
 * Vahram's Blog - Exhaustive Edge Cases & Robustness Test Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build, loadAllPosts } = require('./build');

console.log('🧪 Testing Exhaustive Edge Cases for Vahram\'s Blog...\n');

const testPostsDir = path.join(__dirname, 'content/posts');

// Edge Case 1: Post with ONLY English content (no delimiters)
const onlyEnFile = path.join(testPostsDir, '2026-11-10-only-english-post.md');
fs.writeFileSync(onlyEnFile, `---
title: "English Only Draft"
date: "2026-11-10"
category: "Notes"
summary: "Drafting in English first."
---
This is a post written solely in English without any Chinese translation yet.
It has a [link](https://apple.com) and a table:

| Parameter | Value |
| --------- | ----- |
| Edge      | Cloudflare |
| Speed     | Sub-50ms   |
`, 'utf8');

// Edge Case 2: Paired files mode with NATURAL frontmatter (title in both, neither overwriting)
const pairedEnFile = path.join(testPostsDir, '2026-11-11-paired-article.en.md');
const pairedZhFile = path.join(testPostsDir, '2026-11-11-paired-article.zh.md');

fs.writeFileSync(pairedEnFile, `---
title: "Paired File English Version"
date: "2026-11-11"
category: "Architecture"
summary: "Separate EN file."
---
English text in paired file.
`, 'utf8');

fs.writeFileSync(pairedZhFile, `---
title: "配对文件中文版本"
category: "工程架构"
summary: "独立的中文配对文件。"
---
中文独立配对文件正文内容。
`, 'utf8');

// Edge Case 3: Paired files with hyphen convention (*-en.md and *-zh.md)
const hyphenEnFile = path.join(testPostsDir, '2026-11-12-hyphen-style-en.md');
const hyphenZhFile = path.join(testPostsDir, '2026-11-12-hyphen-style-zh.md');

fs.writeFileSync(hyphenEnFile, `---
title: "Hyphen Paired English"
date: "2026-11-12"
---
Hyphen style English text.
`, 'utf8');

fs.writeFileSync(hyphenZhFile, `---
title: "连字符配对中文"
---
连字符样式中文正文。
`, 'utf8');

// Edge Case 4: Delimiters with spaces and variations (<!-- lang: en --> and <!-- cn -->)
const delimSpaceFile = path.join(testPostsDir, '2026-11-13-delim-spaces.md');
fs.writeFileSync(delimSpaceFile, `---
title: "Delim With Spaces"
title_zh: "带空格的分隔符"
date: "2026-11-13"
---

<!-- lang: en -->
English paragraph with spaced comment.

<!-- cn -->
带空格分隔符的中文段落。
`, 'utf8');

// Edge Case 5: Markdown heading delimiters (## English and ## 中文)
const headingDelimFile = path.join(testPostsDir, '2026-11-14-heading-delims.md');
fs.writeFileSync(headingDelimFile, `---
title: "Heading Delimited Post"
title_zh: "标题分隔文章"
date: "2026-11-14"
---

## English
Content under English heading.

![System Diagram](https://example.com/sys.png "System Architecture Overview")

## 中文
中文标题下的内容。
`, 'utf8');

// Edge Case 6: Nested folder post with local image
const nestedPostDir = path.join(testPostsDir, '2026-11-15-nested-folder-post');
fs.mkdirSync(nestedPostDir, { recursive: true });
const nestedIndexFile = path.join(nestedPostDir, 'index.md');
fs.writeFileSync(nestedIndexFile, `---
title: "Nested Folder Story"
title_zh: "嵌套目录文章"
date: "2026-11-15"
---

<!-- lang:en -->
Nested post in folder with local diagram ![Architecture](./diagram.png "Local Flow").

<!-- lang:zh -->
文件夹中的嵌套文章与本地图表。
`, 'utf8');

const nestedImgFile = path.join(nestedPostDir, 'diagram.png');
fs.writeFileSync(nestedImgFile, 'FAKE_PNG_BINARY_CONTENT');

try {
  // Run build with all edge cases
  build();
  const posts = loadAllPosts();

  // 1. Verify Edge Case 1: Monolingual English with graceful fallback
  const onlyEnPost = posts.find((p) => p.slug === 'only-english-post');
  assert.ok(onlyEnPost, 'Should find only-english-post');
  assert.ok(onlyEnPost.htmlEn.includes('solely in English'), 'EN content should be rendered');
  assert.ok(onlyEnPost.htmlZh.includes('本文暂未提供中文翻译'), 'ZH content should display graceful fallback banner');

  // 2. Verify Edge Case 2: Paired files with natural frontmatter (NO title overwrite bug)
  const pairedPost = posts.find((p) => p.slug === 'paired-article');
  assert.ok(pairedPost, 'Should find paired-article merged by base slug');
  assert.strictEqual(pairedPost.title, 'Paired File English Version', 'EN title must not be overwritten by ZH title');
  assert.strictEqual(pairedPost.title_zh, '配对文件中文版本', 'ZH title must be preserved from ZH file');
  assert.strictEqual(pairedPost.category, 'Architecture', 'EN category must be preserved');
  assert.strictEqual(pairedPost.category_zh, '工程架构', 'ZH category must be preserved');
  assert.ok(pairedPost.htmlEn.includes('English text in paired file'));
  assert.ok(pairedPost.htmlZh.includes('中文独立配对文件正文内容'));
  console.log('  ✅ PASS: Edge Case 2 (Paired files frontmatter isolation: no metadata overwrite)');

  // 3. Verify Edge Case 3: Hyphen style paired files
  const hyphenPost = posts.find((p) => p.slug === 'hyphen-style');
  assert.ok(hyphenPost, 'Should find hyphen-style post merged');
  assert.strictEqual(hyphenPost.title, 'Hyphen Paired English');
  assert.strictEqual(hyphenPost.title_zh, '连字符配对中文');
  assert.ok(hyphenPost.htmlEn.includes('Hyphen style English text'));
  assert.ok(hyphenPost.htmlZh.includes('连字符样式中文正文'));
  console.log('  ✅ PASS: Edge Case 3 (Hyphen style *-en.md and *-zh.md merged)');

  // 4. Verify Edge Case 4: Delimiters with spaces and <!-- cn -->
  const delimSpacePost = posts.find((p) => p.slug === 'delim-spaces');
  assert.ok(delimSpacePost, 'Should find delim-spaces post');
  assert.ok(delimSpacePost.htmlEn.includes('English paragraph with spaced comment'));
  assert.ok(delimSpacePost.htmlZh.includes('带空格分隔符的中文段落'));
  assert.ok(!delimSpacePost.htmlEn.includes('带空格分隔符'), 'EN must not swallow ZH text');
  console.log('  ✅ PASS: Edge Case 4 (Spaced comments <!-- lang: en --> & <!-- cn --> split properly)');

  // 5. Verify Edge Case 5: Markdown heading delimiters & Apple figure generation
  const headingPost = posts.find((p) => p.slug === 'heading-delims');
  assert.ok(headingPost, 'Should find heading-delims post');
  assert.ok(headingPost.htmlEn.includes('Content under English heading'));
  assert.ok(headingPost.htmlZh.includes('中文标题下的内容'));
  assert.ok(headingPost.htmlEn.includes('class="article-inline-figure"'), 'Should render Apple figure wrapper');
  assert.ok(headingPost.htmlEn.includes('System Architecture Overview'), 'Should render figure caption');
  console.log('  ✅ PASS: Edge Case 5 (Markdown headings ## English / ## 中文 & Apple figures)');

  // 6. Verify Edge Case 6: Nested folder post and asset copying
  const nestedPost = posts.find((p) => p.slug === 'nested-folder-post');
  assert.ok(nestedPost, 'Should find nested-folder-post');
  assert.strictEqual(nestedPost.title, 'Nested Folder Story');
  const copiedImgDist = path.join(__dirname, 'dist/posts/nested-folder-post/diagram.png');
  assert.ok(fs.existsSync(copiedImgDist), 'Local image diagram.png must be copied to dist/posts/nested-folder-post/');
  console.log('  ✅ PASS: Edge Case 6 (Subdirectory posts & local image asset copying)');

  // 7. Verify pre-rendered HTML has table styles & dual containers
  const onlyEnHtml = fs.readFileSync(path.join(__dirname, 'dist/posts/only-english-post/index.html'), 'utf8');
  assert.ok(onlyEnHtml.includes('<table>'), 'Should contain table HTML');
  assert.ok(onlyEnHtml.includes('id="post-content-en"'));
  assert.ok(onlyEnHtml.includes('id="post-content-zh"'));

  console.log('\n🎉 ALL 7 ADVANCED EDGE CASES PASSED WITH 100% SUCCESS!');
} finally {
  // Clean up temporary test files
  if (fs.existsSync(onlyEnFile)) fs.unlinkSync(onlyEnFile);
  if (fs.existsSync(pairedEnFile)) fs.unlinkSync(pairedEnFile);
  if (fs.existsSync(pairedZhFile)) fs.unlinkSync(pairedZhFile);
  if (fs.existsSync(hyphenEnFile)) fs.unlinkSync(hyphenEnFile);
  if (fs.existsSync(hyphenZhFile)) fs.unlinkSync(hyphenZhFile);
  if (fs.existsSync(delimSpaceFile)) fs.unlinkSync(delimSpaceFile);
  if (fs.existsSync(headingDelimFile)) fs.unlinkSync(headingDelimFile);
  if (fs.existsSync(nestedPostDir)) fs.rmSync(nestedPostDir, { recursive: true, force: true });

  // Rebuild clean dist
  build();
}
