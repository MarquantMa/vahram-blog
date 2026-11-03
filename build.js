/**
 * Vahram's Blog - Static Site Generator
 * Generates Apple Newsroom style static website ready for Cloudflare Pages (vahram.pages.dev)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Marked } = require('marked');
const hljs = require('highlight.js');

// Configuration
const CONFIG = {
  siteName: "Vahram 的 blog",
  siteNameEn: "Vahram's Blog",
  siteUrl: "https://vahram.pages.dev",
  author: "Vahram",
  authorBioEn: "Software engineer, systems architect, and writer focusing on ambient intelligence, elegant software design, and edge computing.",
  authorBioZh: "软件工程师、系统架构师与写作者。专注环境智能、优雅软件设计与边缘计算。",
  sourceDir: path.join(__dirname, 'content/posts'),
  distDir: path.join(__dirname, 'dist'),
  publicDir: path.join(__dirname, 'public'),
  stylesDir: path.join(__dirname, 'src/styles'),
  scriptsDir: path.join(__dirname, 'src/scripts')
};

// Configure Marked with macOS-styled code blocks and Highlight.js
const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      let highlighted = text;
      try {
        highlighted = hljs.highlight(text, { language: validLang }).value;
      } catch (e) {
        highlighted = text;
      }

      return `
<div class="code-block">
  <div class="code-header">
    <div class="code-dots">
      <span class="code-dot red"></span>
      <span class="code-dot yellow"></span>
      <span class="code-dot green"></span>
    </div>
    <div class="code-meta">
      <span class="code-lang">${validLang}</span>
      <button class="copy-code-btn" type="button" aria-label="Copy code">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        <span>Copy</span>
      </button>
    </div>
  </div>
  <pre><code class="hljs ${validLang}">${highlighted}</code></pre>
</div>`;
    },
    link({ href, title, text }) {
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${href}"${targetAttr}${titleAttr}>${text}</a>`;
    },
    image({ href, title, text }) {
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const altAttr = text ? ` alt="${escapeHtml(text)}"` : '';
      const captionText = title || text;
      const captionHtml = captionText ? `<figcaption class="figure-caption">${escapeHtml(captionText)}</figcaption>` : '';
      return `
<figure class="article-inline-figure">
  <img src="${href}"${altAttr}${titleAttr} loading="lazy">
  ${captionHtml}
</figure>`;
    }
  }
});

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Split bilingual content in a single markdown file
function splitBilingualMarkdown(rawContent) {
  // 1. Check HTML section/div tags
  const enTagMatch = rawContent.match(/<(?:section|div)[^>]*\blang=["'](?:en|en-US|en-GB)["'][^>]*>([\s\S]*?)<\/(?:section|div)>/i);
  const zhTagMatch = rawContent.match(/<(?:section|div)[^>]*\blang=["'](?:zh|zh-CN|zh-Hans|zh-TW)["'][^>]*>([\s\S]*?)<\/(?:section|div)>/i);
  if (enTagMatch || zhTagMatch) {
    let rawEn = enTagMatch ? enTagMatch[1].trim() : '';
    let rawZh = zhTagMatch ? zhTagMatch[1].trim() : '';
    if (!rawEn && rawZh) rawEn = `> *English translation is currently in preparation. Displaying original Chinese text.*\n\n` + rawZh;
    if (rawEn && !rawZh) rawZh = `> *本文暂未提供中文翻译，已自动展示英文原文。*\n\n` + rawEn;
    return { rawEn, rawZh };
  }

  // 2. Delimiter markers regexes (supports HTML comments, markdown headings, dividers)
  const enDelim = /(?:<!--\s*(?:lang\s*:\s*)?(?:en|english)\s*-->|^#{1,3}\s+(?:\[?(?:en|english)\]?|English\s*(?:Version)?|英文版?)\s*$|^(?:===|---|\[)\s*(?:en|english)\s*(?:===|---|\])\s*$)/im;
  const zhDelim = /(?:<!--\s*(?:lang\s*:\s*)?(?:zh|chinese|cn|zh-cn|zh-hans|中文)\s*-->|^#{1,3}\s+(?:\[?(?:zh|cn|chinese)\]?|Chinese\s*(?:Version)?|中文版?|简体中文)\s*$|^(?:===|---|\[)\s*(?:zh|chinese|cn|中文)\s*(?:===|---|\])\s*$)/im;

  const enPos = rawContent.search(enDelim);
  const zhPos = rawContent.search(zhDelim);

  let rawEn = '';
  let rawZh = '';

  if (enPos !== -1 && zhPos !== -1) {
    if (enPos < zhPos) {
      // EN first, then ZH
      const afterEn = rawContent.slice(enPos).replace(enDelim, '');
      const zhIndexInAfterEn = afterEn.search(zhDelim);
      rawEn = afterEn.slice(0, zhIndexInAfterEn).trim();
      rawZh = afterEn.slice(zhIndexInAfterEn).replace(zhDelim, '').trim();
    } else {
      // ZH first, then EN
      const afterZh = rawContent.slice(zhPos).replace(zhDelim, '');
      const enIndexInAfterZh = afterZh.search(enDelim);
      rawZh = afterZh.slice(0, enIndexInAfterZh).trim();
      rawEn = afterZh.slice(enIndexInAfterZh).replace(enDelim, '').trim();
    }
  } else if (enPos !== -1) {
    rawEn = rawContent.slice(enPos).replace(enDelim, '').trim();
    rawZh = `> *本文暂未提供中文翻译，已自动展示英文原文。*\n\n` + rawEn;
  } else if (zhPos !== -1) {
    rawZh = rawContent.slice(zhPos).replace(zhDelim, '').trim();
    rawEn = `> *English translation is currently in preparation. Displaying original Chinese text.*\n\n` + rawZh;
  } else {
    // No comment delimiters are found, treat entire content as English, fallback for Chinese with notice
    rawEn = rawContent.trim();
    rawZh = `> *本文暂未提供中文翻译，已自动展示英文原文。*\n\n` + rawEn;
  }

  return { rawEn, rawZh };
}

// Recursively find all files in a directory
function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      results.push({ fullPath, relPath, name: entry.name });
    }
  }
  return results;
}

// Parse posts from content/posts/
function loadAllPosts() {
  if (!fs.existsSync(CONFIG.sourceDir)) {
    return [];
  }

  const allFiles = getFilesRecursively(CONFIG.sourceDir);
  const postsMap = new Map();

  allFiles.forEach(({ fullPath, relPath, name }) => {
    if (!/\.(md|markdown)$/i.test(name) || name === 'TEMPLATE.md') return;

    let fileContent = '';
    try {
      fileContent = fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      console.warn(`Warning: Could not read ${fullPath}:`, err.message);
      return;
    }

    const { data: frontmatter, content: rawContent } = matter(fileContent);

    // Slug generation from filename and path
    // Normalise separators
    const normalisedRel = relPath.replace(/\\/g, '/');
    const pathParts = normalisedRel.split('/');
    let filenameBase = pathParts[pathParts.length - 1].replace(/\.(md|markdown)$/i, '');

    // Strip leading date YYYY-MM-DD-
    let cleanSlug = filenameBase.replace(/^\d{4}-\d{2}-\d{2}-/, '');

    // Check if paired format e.g. my-post.en.md, my-post-zh.md, my-post_cn.md
    const zhSuffixRegex = /(?:[\.\-_](?:zh|cn|zh-cn|zh-hans|zh-tw)|_cn|-cn|\.cn|\.zh|-zh|_zh)$/i;
    const enSuffixRegex = /(?:[\.\-_](?:en|english)|_en|-en|\.en)$/i;

    let isPairedEn = false;
    let isPairedZh = false;

    if (zhSuffixRegex.test(cleanSlug)) {
      isPairedZh = true;
      cleanSlug = cleanSlug.replace(zhSuffixRegex, '');
    } else if (enSuffixRegex.test(cleanSlug)) {
      isPairedEn = true;
      cleanSlug = cleanSlug.replace(enSuffixRegex, '');
    } else if (pathParts.length > 1) {
      // Check parent directory e.g. en/my-post.md or zh/my-post.md
      const parentDir = pathParts[pathParts.length - 2].toLowerCase();
      if (['zh', 'cn', 'zh-cn', 'chinese'].includes(parentDir)) {
        isPairedZh = true;
      } else if (['en', 'english'].includes(parentDir)) {
        isPairedEn = true;
      } else if (cleanSlug === 'index' || cleanSlug === 'post') {
        // Nested folder post: content/posts/my-cool-post/index.md
        cleanSlug = pathParts[pathParts.length - 2].replace(/^\d{4}-\d{2}-\d{2}-/, '');
      }
    }

    if (!postsMap.has(cleanSlug)) {
      postsMap.set(cleanSlug, {
        slug: cleanSlug,
        commonFm: {},
        fmEn: {},
        fmZh: {},
        rawEn: '',
        rawZh: ''
      });
    }

    const postObj = postsMap.get(cleanSlug);

    // Common frontmatter fields (shared between paired files)
    ['date', 'featured', 'coverImage', 'author', 'tags'].forEach((key) => {
      if (frontmatter[key] !== undefined && postObj.commonFm[key] === undefined) {
        postObj.commonFm[key] = frontmatter[key];
      }
    });

    if (isPairedZh) {
      postObj.fmZh.title_zh = frontmatter.title_zh || frontmatter.title;
      postObj.fmZh.summary_zh = frontmatter.summary_zh || frontmatter.summary || frontmatter.description_zh || frontmatter.description;
      postObj.fmZh.category_zh = frontmatter.category_zh || frontmatter.category;
      postObj.fmZh.dateline_zh = frontmatter.dateline_zh || frontmatter.dateline;
      postObj.fmZh.readTime_zh = frontmatter.readTime_zh || frontmatter.readTime;
      postObj.rawZh = rawContent.trim();
    } else if (isPairedEn) {
      postObj.fmEn.title = frontmatter.title;
      postObj.fmEn.summary = frontmatter.summary || frontmatter.description;
      postObj.fmEn.category = frontmatter.category;
      postObj.fmEn.dateline = frontmatter.dateline;
      postObj.fmEn.readTime = frontmatter.readTime;
      postObj.rawEn = rawContent.trim();
    } else {
      // Single file with delimiters
      if (frontmatter.title) postObj.fmEn.title = frontmatter.title;
      if (frontmatter.title_zh) postObj.fmZh.title_zh = frontmatter.title_zh;
      if (frontmatter.summary) postObj.fmEn.summary = frontmatter.summary;
      if (frontmatter.summary_zh) postObj.fmZh.summary_zh = frontmatter.summary_zh;
      if (frontmatter.description && !postObj.fmEn.summary) postObj.fmEn.summary = frontmatter.description;
      if (frontmatter.description_zh && !postObj.fmZh.summary_zh) postObj.fmZh.summary_zh = frontmatter.description_zh;
      if (frontmatter.category) postObj.fmEn.category = frontmatter.category;
      if (frontmatter.category_zh) postObj.fmZh.category_zh = frontmatter.category_zh;
      if (frontmatter.dateline) postObj.fmEn.dateline = frontmatter.dateline;
      if (frontmatter.dateline_zh) postObj.fmZh.dateline_zh = frontmatter.dateline_zh;
      if (frontmatter.readTime) postObj.fmEn.readTime = frontmatter.readTime;
      if (frontmatter.readTime_zh) postObj.fmZh.readTime_zh = frontmatter.readTime_zh;

      const split = splitBilingualMarkdown(rawContent);
      postObj.rawEn = split.rawEn;
      postObj.rawZh = split.rawZh;
    }
  });

  const posts = [];
  postsMap.forEach((entry) => {
    const common = entry.commonFm;
    const fmEn = entry.fmEn;
    const fmZh = entry.fmZh;

    const title = fmEn.title || fmZh.title_zh || entry.slug;
    const title_zh = fmZh.title_zh || fmEn.title || title;
    const date = common.date ? String(common.date).substring(0, 10) : new Date().toISOString().substring(0, 10);
    const category = fmEn.category || fmZh.category_zh || 'General';
    const category_zh = fmZh.category_zh || fmEn.category || category;
    const summary = fmEn.summary || fmZh.summary_zh || '';
    const summary_zh = fmZh.summary_zh || fmEn.summary || summary;
    const dateline = fmEn.dateline || fmZh.dateline_zh || `CUPERTINO, CALIFORNIA — ${date}`;
    const dateline_zh = fmZh.dateline_zh || fmEn.dateline || `加利福尼亚州库比蒂诺 — ${date}`;
    const readTime = fmEn.readTime || fmZh.readTime_zh || '4 min read';
    const readTime_zh = fmZh.readTime_zh || fmEn.readTime || '4 分钟阅读';
    const coverImage = common.coverImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=80';
    const featured = Boolean(common.featured);
    const tags = Array.isArray(common.tags) ? common.tags : [];

    // Pre-render HTML for both languages
    const htmlEn = marked.parse(entry.rawEn || '');
    const htmlZh = marked.parse(entry.rawZh || '');

    posts.push({
      slug: entry.slug,
      title,
      title_zh,
      date,
      category,
      category_zh,
      summary,
      summary_zh,
      dateline,
      dateline_zh,
      readTime,
      readTime_zh,
      coverImage,
      featured,
      tags,
      htmlEn,
      htmlZh
    });
  });

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// Common Header (Apple Translucent Frosted Glass Bar)
function renderHeader(activeNav = 'newsroom') {
  return `
<header class="site-header">
  <div class="nav-container">
    <div class="brand-wrapper">
      <a href="/" class="brand-logo" aria-label="Vahram's Blog Home">
        <svg width="18" height="18" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="14" fill="currentColor"/>
          <path d="M22 20 L32 44 L42 20" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Vahram</span>
      </a>
      <span class="brand-badge" data-en="Newsroom" data-zh="动态">Newsroom</span>
    </div>

    <nav aria-label="Primary Navigation">
      <ul class="nav-links">
        <li>
          <a href="/" class="nav-link ${activeNav === 'newsroom' ? 'active' : ''}" data-en="Newsroom" data-zh="博客主页">Newsroom</a>
        </li>
        <li>
          <a href="/about/" class="nav-link ${activeNav === 'about' ? 'active' : ''}" data-en="About Vahram" data-zh="关于 Vahram">About Vahram</a>
        </li>
        <li>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="nav-link" data-en="GitHub" data-zh="GitHub 源码">GitHub</a>
        </li>
        <li>
          <a href="/rss.xml" class="nav-link" title="RSS Feed">RSS</a>
        </li>
      </ul>
    </nav>

    <div class="nav-actions">
      <!-- Search Trigger Button -->
      <button class="icon-btn search-trigger-btn" type="button" aria-label="Search articles (⌘K)" title="Search (⌘K)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>

      <!-- Apple Segmented Language Switcher Pill (一键双语切换) -->
      <div class="lang-switcher-pill" role="group" aria-label="Language Switcher">
        <button class="lang-btn active" data-lang-btn="en" type="button" aria-label="Switch to English">EN</button>
        <button class="lang-btn" data-lang-btn="zh" type="button" aria-label="Switch to Chinese">中文</button>
      </div>

      <!-- Theme Toggle Button -->
      <button class="icon-btn" id="theme-toggle-btn" type="button" aria-label="Toggle Dark/Light Mode" title="Toggle Theme">
        <svg id="theme-icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        <svg id="theme-icon-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      </button>
    </div>
  </div>
</header>
  `;
}

// Common Spotlight Search Modal
function renderSearchModal() {
  return `
<div class="search-modal-backdrop" id="search-modal-backdrop" role="dialog" aria-modal="true" aria-label="Search stories">
  <div class="search-modal">
    <div class="search-input-wrapper">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input type="text" class="search-input" id="search-input" placeholder="Search stories, topics, tags..." data-placeholder-en="Search stories, topics, tags..." data-placeholder-zh="搜索文章标题、技术主题、标签..." autocomplete="off" spellcheck="false">
      <span class="kbd-shortcut">ESC</span>
    </div>
    <ul class="search-results-list" id="search-results">
      <!-- Injected by app.js -->
    </ul>
  </div>
</div>
  `;
}

// Common Footer (Apple Style)
function renderFooter() {
  return `
<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-top-row">
      <div class="footer-badges">
        <span class="footer-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
          <span>Cloudflare Pages Hosted • vahram.pages.dev</span>
        </span>
        <span class="footer-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          <span data-en="Direct GitHub Markdown Uploads" data-zh="支持 GitHub 富文本直接上传">Direct GitHub Markdown Uploads</span>
        </span>
      </div>

      <div class="lang-switcher-pill" role="group" aria-label="Language Switcher">
        <button class="lang-btn active" data-lang-btn="en" type="button">English</button>
        <button class="lang-btn" data-lang-btn="zh" type="button">中文 (简体)</button>
      </div>
    </div>

    <div class="footer-bottom-row">
      <div class="footer-copyright">
        Copyright &copy; ${new Date().getFullYear()} Vahram. <span data-en="All rights reserved." data-zh="保留所有权利。">All rights reserved.</span>
      </div>

      <ul class="footer-links">
        <li><a href="/" class="footer-link" data-en="Newsroom" data-zh="博客主页">Newsroom</a></li>
        <li><a href="/about/" class="footer-link" data-en="About" data-zh="关于本站">About</a></li>
        <li><a href="/rss.xml" class="footer-link">RSS Feed</a></li>
        <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub Repository</a></li>
      </ul>
    </div>
  </div>
</footer>
  `;
}

// Generate Index (Newsroom Homepage)
function buildIndexPage(posts) {
  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const gridPosts = posts.filter((p) => p.slug !== featuredPost.slug);

  const categories = [
    { id: 'all', en: 'All Stories', zh: '全部动态' },
    { id: 'Announcement', en: 'Announcement', zh: '官方动态' },
    { id: 'Artificial Intelligence', en: 'AI & Agents', zh: '人工智能' },
    { id: 'Engineering', en: 'Engineering', zh: '工程架构' },
    { id: 'Design', en: 'Design', zh: '设计哲学' }
  ];

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vahram 的 blog — Apple Newsroom</title>
  <meta name="description" content="Vahram's Blog — Apple Newsroom style bilingual digital garden covering AI, engineering architecture, and software design.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="alternate" type="application/rss+xml" title="Vahram's Blog RSS" href="/rss.xml">
</head>
<body>
  ${renderHeader('newsroom')}

  <!-- Newsroom Subnav & Category Pills -->
  <section class="newsroom-subnav">
    <div class="subnav-container">
      <div class="category-chips">
        ${categories
          .map(
            (c, i) => `
          <button class="chip-btn ${i === 0 ? 'active' : ''}" type="button" onclick="filterCategory('${c.id}', this)">
            <span data-en="${c.en}" data-zh="${c.zh}">${c.en}</span>
          </button>
        `
          )
          .join('')}
      </div>

      <button class="search-trigger-btn" type="button" aria-label="Search stories">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span data-en="Search stories..." data-zh="搜索动态...">Search stories...</span>
        <span class="kbd-shortcut">⌘K</span>
      </button>
    </div>
  </section>

  <!-- Main Newsroom Body -->
  <main class="main-content">
    <!-- Featured Hero Story -->
    ${
      featuredPost
        ? `
    <article class="hero-story-card">
      <div class="hero-image-wrapper">
        <img class="hero-image" src="${featuredPost.coverImage}" alt="${escapeHtml(featuredPost.title)}" loading="eager">
        <div class="hero-badge-overlay" data-en="FEATURED STORY" data-zh="焦点精选">FEATURED STORY</div>
      </div>
      <div class="hero-content">
        <div class="eyebrow" data-en="${escapeHtml(featuredPost.category)}" data-zh="${escapeHtml(featuredPost.category_zh)}">${escapeHtml(featuredPost.category)}</div>
        <a href="/posts/${featuredPost.slug}/">
          <h2 class="hero-title" data-en="${escapeHtml(featuredPost.title)}" data-zh="${escapeHtml(featuredPost.title_zh)}">${escapeHtml(featuredPost.title)}</h2>
        </a>
        <p class="hero-deck" data-en="${escapeHtml(featuredPost.summary)}" data-zh="${escapeHtml(featuredPost.summary_zh)}">${escapeHtml(featuredPost.summary)}</p>
        <div class="meta-row">
          <span>${featuredPost.date}</span>
          <span>•</span>
          <span data-en="${escapeHtml(featuredPost.readTime)}" data-zh="${escapeHtml(featuredPost.readTime_zh)}">${escapeHtml(featuredPost.readTime)}</span>
        </div>
        <div>
          <a href="/posts/${featuredPost.slug}/" class="read-cta">
            <span data-en="Read story" data-zh="阅读全文">Read story</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    </article>
    `
        : ''
    }

    <!-- Latest Stories Section Header -->
    <div class="section-header">
      <h3 class="section-title" data-en="Latest Stories" data-zh="最新发布">Latest Stories</h3>
      <span class="section-count">${posts.length} <span data-en="stories" data-zh="篇文章">stories</span></span>
    </div>

    <!-- Stories Grid -->
    <div class="stories-grid">
      ${gridPosts
        .map(
          (post) => `
        <article class="story-card" data-category="${escapeHtml(post.category)}">
          <a href="/posts/${post.slug}/" class="story-image-wrapper">
            <img class="story-image" src="${post.coverImage}" alt="${escapeHtml(post.title)}" loading="lazy">
          </a>
          <div class="story-content">
            <div class="eyebrow" data-en="${escapeHtml(post.category)}" data-zh="${escapeHtml(post.category_zh)}">${escapeHtml(post.category)}</div>
            <a href="/posts/${post.slug}/">
              <h4 class="story-title" data-en="${escapeHtml(post.title)}" data-zh="${escapeHtml(post.title_zh)}">${escapeHtml(post.title)}</h4>
            </a>
            <p class="story-excerpt" data-en="${escapeHtml(post.summary)}" data-zh="${escapeHtml(post.summary_zh)}">${escapeHtml(post.summary)}</p>
            <div class="story-footer">
              <span>${post.date}</span>
              <span data-en="${escapeHtml(post.readTime)}" data-zh="${escapeHtml(post.readTime_zh)}">${escapeHtml(post.readTime)}</span>
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  </main>

  ${renderSearchModal()}
  ${renderFooter()}

  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), html, 'utf8');
}

// Generate Individual Article Page
function buildPostPage(post, allPosts) {
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const postDir = path.join(CONFIG.distDir, 'posts', post.slug);
  fs.mkdirSync(postDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — Vahram's Blog</title>
  <meta name="description" content="${escapeHtml(post.summary)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="alternate" type="application/rss+xml" title="Vahram's Blog RSS" href="/rss.xml">
</head>
<body>
  <div id="reading-progress"></div>
  ${renderHeader('newsroom')}

  <main class="article-page">
    <a href="/" class="article-back-link">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span data-en="All Stories" data-zh="返回全部动态">All Stories</span>
    </a>

    <header class="article-header">
      <div class="article-eyebrow-row">
        <span class="eyebrow" id="post-category" data-en="${escapeHtml(post.category)}" data-zh="${escapeHtml(post.category_zh)}">${escapeHtml(post.category)}</span>
        <span class="eyebrow" id="post-readtime" data-en="${escapeHtml(post.readTime)}" data-zh="${escapeHtml(post.readTime_zh)}">${escapeHtml(post.readTime)}</span>
      </div>

      <h1 class="article-headline" id="post-title" data-en="${escapeHtml(post.title)}" data-zh="${escapeHtml(post.title_zh)}">${escapeHtml(post.title)}</h1>
      <p class="article-deck" id="post-deck" data-en="${escapeHtml(post.summary)}" data-zh="${escapeHtml(post.summary_zh)}">${escapeHtml(post.summary)}</p>

      <div class="article-byline-bar">
        <div class="byline-author">
          <div class="author-avatar">V</div>
          <div>
            <div class="author-info-name">Vahram</div>
            <div class="author-info-date" id="post-dateline" data-en="${escapeHtml(post.dateline)}" data-zh="${escapeHtml(post.dateline_zh)}">${escapeHtml(post.dateline)}</div>
          </div>
        </div>

        <button class="action-pill-btn" id="copy-article-link-btn" type="button" aria-label="Copy article link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span data-en="Share Link" data-zh="分享链接">Share Link</span>
        </button>
      </div>
    </header>

    <!-- One-Click Sticky/Prominent Language Switcher Pill (一键切) -->
    <div class="article-lang-bar">
      <div class="article-lang-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <span data-en="Reading Language (One-Click Toggle):" data-zh="阅读语言（一键极速切换）：">Reading Language (One-Click Toggle):</span>
      </div>
      <div class="article-lang-pill" role="group" aria-label="Post Language Switcher">
        <button class="article-lang-btn active" data-lang-btn="en" type="button">🇬🇧 English</button>
        <button class="article-lang-btn" data-lang-btn="zh" type="button">🇨🇳 中文</button>
      </div>
    </div>

    <!-- Article Hero Cover Figure -->
    <figure class="article-cover-figure">
      <img class="article-cover-img" src="${post.coverImage}" alt="${escapeHtml(post.title)}">
      <figcaption class="figure-caption" data-en="Vahram's Newsroom — Photography & Creative Architecture" data-zh="Vahram 动态简报 — 摄影与创意架构">Vahram's Newsroom — Photography & Creative Architecture</figcaption>
    </figure>

    <!-- Bilingual Body Containers -->
    <div id="post-content-en" class="article-body">
      ${post.htmlEn}
    </div>

    <div id="post-content-zh" class="article-body" style="display: none;">
      ${post.htmlZh}
    </div>

    <!-- Article Footer Actions -->
    <div class="article-footer-actions">
      <div class="share-group">
        <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(CONFIG.siteUrl + '/posts/' + post.slug + '/')}" target="_blank" rel="noopener noreferrer" class="action-pill-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span>Post on X</span>
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="action-pill-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span data-en="Edit on GitHub" data-zh="在 GitHub 编辑">Edit on GitHub</span>
        </a>
      </div>

      <a href="/" class="action-pill-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span data-en="More Stories" data-zh="阅读更多文章">More Stories</span>
      </a>
    </div>

    <!-- Related Stories -->
    ${
      related.length > 0
        ? `
    <section style="margin-top: 64px;">
      <h3 class="section-title" style="margin-bottom: 24px;" data-en="More from Vahram" data-zh="更多推荐文章">More from Vahram</h3>
      <div class="stories-grid">
        ${related
          .map(
            (p) => `
          <article class="story-card">
            <a href="/posts/${p.slug}/" class="story-image-wrapper">
              <img class="story-image" src="${p.coverImage}" alt="${escapeHtml(p.title)}" loading="lazy">
            </a>
            <div class="story-content">
              <div class="eyebrow" data-en="${escapeHtml(p.category)}" data-zh="${escapeHtml(p.category_zh)}">${escapeHtml(p.category)}</div>
              <a href="/posts/${p.slug}/">
                <h4 class="story-title" data-en="${escapeHtml(p.title)}" data-zh="${escapeHtml(p.title_zh)}">${escapeHtml(p.title)}</h4>
              </a>
              <div class="story-footer">
                <span>${p.date}</span>
                <span data-en="${escapeHtml(p.readTime)}" data-zh="${escapeHtml(p.readTime_zh)}">${escapeHtml(p.readTime)}</span>
              </div>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    </section>
    `
        : ''
    }
  </main>

  ${renderSearchModal()}
  ${renderFooter()}

  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
}

// Generate About Page
function buildAboutPage() {
  const aboutDir = path.join(CONFIG.distDir, 'about');
  fs.mkdirSync(aboutDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Vahram — Apple Newsroom</title>
  <meta name="description" content="About Vahram, software engineer, systems architect, and creator of Vahram's Blog.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="alternate" type="application/rss+xml" title="Vahram's Blog RSS" href="/rss.xml">
</head>
<body>
  ${renderHeader('about')}

  <main class="article-page">
    <header class="article-header" style="text-align: center; margin-bottom: 48px;">
      <div class="author-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 20px;">V</div>
      <h1 class="article-headline" data-en="About Vahram" data-zh="关于 Vahram">About Vahram</h1>
      <p class="article-deck" data-en="Software Engineer • Systems Architect • Writer" data-zh="软件工程师 • 系统架构师 • 写作者">Software Engineer • Systems Architect • Writer</p>
    </header>

    <div class="article-lang-bar">
      <div class="article-lang-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <span data-en="Language Toggle:" data-zh="语言切换：">Language Toggle:</span>
      </div>
      <div class="article-lang-pill">
        <button class="article-lang-btn active" data-lang-btn="en" type="button">🇬🇧 English</button>
        <button class="article-lang-btn" data-lang-btn="zh" type="button">🇨🇳 中文</button>
      </div>
    </div>

    <div id="post-content-en" class="article-body">
      <p>Hello! I am Vahram. I build software systems, explore cognitive autonomous agent architectures, and design digital interfaces that prioritize quiet elegance, speed, and precision.</p>

      <h2>The Architecture Behind This Blog</h2>
      <p>This personal blog was purposefully designed around four core tenets:</p>
      <ul>
        <li><strong>Apple Newsroom Aesthetics</strong>: Clean typography using Apple's San Francisco font stack, clear hierarchy, subtle borders, and immersive card presentations.</li>
        <li><strong>Frictionless One-Click Bilingual Reading</strong>: Every piece is authored with English and Chinese paired side-by-side. Readers can switch between languages instantly without reloading the page or losing their reading position.</li>
        <li><strong>Direct GitHub Markdown Uploads</strong>: New articles can be published directly from the GitHub web interface by committing standard Markdown files with rich text, images, and code snippets into the <code>content/posts/</code> repository folder.</li>
        <li><strong>Edge Deployment with Cloudflare Pages</strong>: All articles are statically compiled into high-performance static HTML and served from Cloudflare's edge network at <code>vahram.pages.dev</code>.</li>
      </ul>

      <blockquote>
        "The details are not the details. They make the design." — Charles Eames
      </blockquote>

      <h2>Connect</h2>
      <p>You can find my open-source projects on <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>, subscribe to updates via our <a href="/rss.xml">RSS Feed</a>, or read our latest articles on the <a href="/">Newsroom homepage</a>.</p>
    </div>

    <div id="post-content-zh" class="article-body" style="display: none;">
      <p>你好！我是 Vahram。我从事系统工程开发、认知自主智能体架构研究，并热衷于设计兼具克制美感、极致响应速度与工程严谨度的数字产品体验。</p>

      <h2>本博客的核心架构</h2>
      <p>这个个人博客在诞生之初便确立了四大核心原则：</p>
      <ul>
        <li><strong>Apple Newsroom 极简设计语言</strong>：采用苹果 San Francisco 字体家族、清晰的视觉层级、精细的边框线条以及沉浸式的卡片排版。</li>
        <li><strong>一键双语无缝切换</strong>：所有博文均采用中英双语双核结构。读者只需轻轻一点，即可在英文与中文之间瞬时切换，无需刷新页面，亦不会丢失阅读进度。</li>
        <li><strong>直接在 GitHub 上传富文本</strong>：撰写新文章时，可直接在 GitHub 网页端将包含图片、公式、代码块的 Markdown 富文本文件提交至 <code>content/posts/</code> 目录，即可触发自动发布。</li>
        <li><strong>基于 Cloudflare Pages 边缘节点分发</strong>：所有页面在构建期静态生成，由 Cloudflare 全球边缘网络 <code>vahram.pages.dev</code> 极速提供访问。</li>
      </ul>

      <blockquote>
        “细节并不是细节本身，它们构成了设计的全部。” — Charles Eames
      </blockquote>

      <h2>与我联络</h2>
      <p>您可以在 <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a> 查看我的开源项目，通过 <a href="/rss.xml">RSS Feed</a> 订阅更新，或在 <a href="/">博客主页</a> 阅读最新动态。</p>
    </div>
  </main>

  ${renderSearchModal()}
  ${renderFooter()}

  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(aboutDir, 'index.html'), html, 'utf8');
}

// Generate 404 Page
function build404Page() {
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found — Vahram's Blog</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
  ${renderHeader('newsroom')}

  <main class="article-page" style="text-align: center; padding: 100px 20px;">
    <div style="font-size: 5rem; font-weight: 800; color: var(--apple-blue); margin-bottom: 20px;">404</div>
    <h1 class="article-headline" data-en="The page you’re looking for can’t be found." data-zh="无法找到您要访问的页面。">The page you’re looking for can’t be found.</h1>
    <p class="article-deck" style="margin-bottom: 36px;" data-en="The story or resource might have been moved, renamed, or is temporarily unavailable." data-zh="您请求的文章或资源可能已被移动、重命名或暂时不可用。">The story or resource might have been moved, renamed, or is temporarily unavailable.</p>
    <a href="/" class="action-pill-btn" style="display: inline-flex; font-size: 1rem; padding: 12px 28px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      <span data-en="Return to Newsroom" data-zh="返回博客主页">Return to Newsroom</span>
    </a>
  </main>

  ${renderSearchModal()}
  ${renderFooter()}

  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.distDir, '404.html'), html, 'utf8');
}

// Generate RSS 2.0 XML
function buildRssFeed(posts) {
  const items = posts
    .map((post) => {
      const link = `${CONFIG.siteUrl}/posts/${post.slug}/`;
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      <description><![CDATA[${post.summary} (中文: ${post.summary_zh})]]></description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${CONFIG.siteNameEn}</title>
    <link>${CONFIG.siteUrl}</link>
    <description>Apple Newsroom style bilingual blog by Vahram</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'rss.xml'), xml, 'utf8');
}

// Generate Sitemap XML
function buildSitemap(posts) {
  const urls = [
    `${CONFIG.siteUrl}/`,
    `${CONFIG.siteUrl}/about/`,
    ...posts.map((p) => `${CONFIG.siteUrl}/posts/${p.slug}/`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml, 'utf8');
}

// Generate Search API Index
function buildSearchIndex(posts) {
  const apiDir = path.join(CONFIG.distDir, 'api');
  fs.mkdirSync(apiDir, { recursive: true });

  const indexData = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    title_zh: p.title_zh,
    date: p.date,
    category: p.category,
    category_zh: p.category_zh,
    summary: p.summary,
    summary_zh: p.summary_zh,
    tags: p.tags
  }));

  fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(indexData, null, 2), 'utf8');
}

// Copy Static Assets
function copyStaticAssets() {
  // CSS
  const cssDestDir = path.join(CONFIG.distDir, 'assets/css');
  fs.mkdirSync(cssDestDir, { recursive: true });
  fs.copyFileSync(path.join(CONFIG.stylesDir, 'main.css'), path.join(cssDestDir, 'main.css'));

  // JS
  const jsDestDir = path.join(CONFIG.distDir, 'assets/js');
  fs.mkdirSync(jsDestDir, { recursive: true });
  fs.copyFileSync(path.join(CONFIG.scriptsDir, 'app.js'), path.join(jsDestDir, 'app.js'));

  // Public files (favicon, _headers, _redirects, etc.)
  if (fs.existsSync(CONFIG.publicDir)) {
    copyRecursive(CONFIG.publicDir, CONFIG.distDir);
  }

  // Copy non-markdown media assets from content/posts/ to dist/posts/ and dist/
  if (fs.existsSync(CONFIG.sourceDir)) {
    const mediaFiles = getFilesRecursively(CONFIG.sourceDir);
    mediaFiles.forEach(({ fullPath, relPath, name }) => {
      if (/\.(md|markdown)$/i.test(name) || name === 'TEMPLATE.md') return;
      const cleanRelPath = relPath.replace(/^\d{4}-\d{2}-\d{2}-/, '');

      // Copy to dist/posts/<relPath>
      const destPostPath = path.join(CONFIG.distDir, 'posts', relPath);
      fs.mkdirSync(path.dirname(destPostPath), { recursive: true });
      fs.copyFileSync(fullPath, destPostPath);

      // Copy to dist/posts/<cleanRelPath> (matches post slug directory)
      if (cleanRelPath !== relPath) {
        const destCleanPostPath = path.join(CONFIG.distDir, 'posts', cleanRelPath);
        fs.mkdirSync(path.dirname(destCleanPostPath), { recursive: true });
        fs.copyFileSync(fullPath, destCleanPostPath);
      }

      const destRootPath = path.join(CONFIG.distDir, cleanRelPath);
      fs.mkdirSync(path.dirname(destRootPath), { recursive: true });
      fs.copyFileSync(fullPath, destRootPath);
    });
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((child) => {
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Main Build Runner
function build() {
  console.log('🚀 Building Vahram\'s Blog (Apple Newsroom Style)...');
  const startTime = Date.now();

  // Clean / prepare dist directory
  fs.mkdirSync(CONFIG.distDir, { recursive: true });

  // 1. Load and parse posts
  const posts = loadAllPosts();
  console.log(`📄 Loaded ${posts.length} bilingual posts.`);

  // 2. Generate Pages
  buildIndexPage(posts);
  posts.forEach((post) => buildPostPage(post, posts));
  buildAboutPage();
  build404Page();

  // 3. Generate Feeds & Search Index
  buildRssFeed(posts);
  buildSitemap(posts);
  buildSearchIndex(posts);

  // 4. Copy Assets
  copyStaticAssets();

  const elapsed = Date.now() - startTime;
  console.log(`✅ Build completed in ${elapsed}ms -> output in ${CONFIG.distDir}`);
}

// Run if called directly
if (require.main === module) {
  build();
}

module.exports = { build, loadAllPosts };
