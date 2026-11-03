/**
 * Vahram 的 blog — Static Site Generator
 * Clean Apple Newsroom chronological bilingual blog for Cloudflare Pages (vahram.pages.dev)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { Marked } = require('marked');
const hljs = require('highlight.js');

const CONFIG = {
  siteName: 'Vahram 的 blog',
  siteUrl: 'https://vahram.pages.dev',
  author: 'Vahram',
  allowedCategories: ['Personal', 'Tech', 'Entrepreneurship'],
  sourceDir: path.join(__dirname, 'content/posts'),
  distDir: path.join(__dirname, 'dist'),
  publicDir: path.join(__dirname, 'public'),
  stylesDir: path.join(__dirname, 'src/styles'),
  scriptsDir: path.join(__dirname, 'src/scripts')
};

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Configure Marked with clean Apple-style code blocks, links, and figures
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
        highlighted = escapeHtml(text);
      }

      return `<div class="code-block"><pre><code class="hljs ${validLang}">${highlighted}</code></pre></div>`;
    },
    link({ href, title, text }) {
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${href}"${targetAttr}${titleAttr}>${text}</a>`;
    },
    image({ href, title, text }) {
      let resolvedHref = href;
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('data:')) {
        // If image refers to images/ (e.g. images/foo.png or ./images/foo.png or ../images/foo.png), normalize to /images/foo.png
        if (/^(\.\/|\.\.\/)?images\//i.test(href)) {
          resolvedHref = '/' + href.replace(/^(\.\/|\.\.\/)?/i, '');
        }
      }

      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      const altAttr = text ? ` alt="${escapeHtml(text)}"` : '';
      const captionText = title || text;
      const captionHtml = captionText ? `<figcaption class="figure-caption">${escapeHtml(captionText)}</figcaption>` : '';
      return `
<figure class="article-inline-figure">
  <img src="${resolvedHref}"${altAttr}${titleAttr} loading="lazy">
  ${captionHtml}
</figure>`;
    }
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateEn(dateStr) {
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = MONTHS_EN[monthIdx] || match[2];
  return `${monthName} ${day}, ${year}`;
}

function formatDateZh(dateStr) {
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return `${year}年${month}月${day}日`;
}

function stripMarkdownToPlainText(md) {
  if (!md) return '';
  return md
    .replace(/^>\s*\*.*?(?:translation|暂未提供中文翻译).*?\*\s*$/gim, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>\-*+]\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(plainText, maxLen, isZh = false) {
  if (!plainText) return '';
  if (plainText.length <= maxLen) return plainText;
  if (isZh) {
    return plainText.slice(0, maxLen).replace(/[，。、；：！？\s]+$/, '') + '…';
  }
  const sliced = plainText.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > maxLen * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return cut.replace(/[,.;:!?\s]+$/, '') + '…';
}

function normalizeCategory(cat) {
  if (!cat) return 'Tech';
  const trimmed = String(cat).trim();
  const matched = CONFIG.allowedCategories.find(
    (allowed) => allowed.toLowerCase() === trimmed.toLowerCase()
  );
  return matched || trimmed;
}

// Split bilingual content in a single markdown file
function splitBilingualMarkdown(rawContent) {
  const enTagMatch = rawContent.match(/<(?:section|div)[^>]*\blang=["'](?:en|en-US|en-GB)["'][^>]*>([\s\S]*?)<\/(?:section|div)>/i);
  const zhTagMatch = rawContent.match(/<(?:section|div)[^>]*\blang=["'](?:zh|zh-CN|zh-Hans|zh-TW)["'][^>]*>([\s\S]*?)<\/(?:section|div)>/i);
  if (enTagMatch || zhTagMatch) {
    let rawEn = enTagMatch ? enTagMatch[1].trim() : '';
    let rawZh = zhTagMatch ? zhTagMatch[1].trim() : '';
    if (!rawEn && rawZh) rawEn = `> *English translation is currently in preparation. Displaying original Chinese text.*\n\n` + rawZh;
    if (rawEn && !rawZh) rawZh = `> *本文暂未提供中文翻译，已自动展示英文原文。*\n\n` + rawEn;
    return { rawEn, rawZh };
  }

  const enDelim = /(?:<!--\s*(?:lang\s*:\s*)?(?:en|english)\s*-->|^#{1,3}\s+(?:\[?(?:en|english)\]?|English\s*(?:Version)?|英文版?)\s*$|^(?:===|---|\[)\s*(?:en|english)\s*(?:===|---|\])\s*$)/im;
  const zhDelim = /(?:<!--\s*(?:lang\s*:\s*)?(?:zh|chinese|cn|zh-cn|zh-hans|中文)\s*-->|^#{1,3}\s+(?:\[?(?:zh|cn|chinese)\]?|Chinese\s*(?:Version)?|中文版?|简体中文)\s*$|^(?:===|---|\[)\s*(?:zh|chinese|cn|中文)\s*(?:===|---|\])\s*$)/im;

  const enPos = rawContent.search(enDelim);
  const zhPos = rawContent.search(zhDelim);

  let rawEn = '';
  let rawZh = '';

  if (enPos !== -1 && zhPos !== -1) {
    if (enPos < zhPos) {
      const afterEn = rawContent.slice(enPos).replace(enDelim, '');
      const zhIndexInAfterEn = afterEn.search(zhDelim);
      rawEn = afterEn.slice(0, zhIndexInAfterEn).trim();
      rawZh = afterEn.slice(zhIndexInAfterEn).replace(zhDelim, '').trim();
    } else {
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
    rawEn = rawContent.trim();
    rawZh = `> *本文暂未提供中文翻译，已自动展示英文原文。*\n\n` + rawEn;
  }

  return { rawEn, rawZh };
}

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

    const normalisedRel = relPath.replace(/\\/g, '/');
    const pathParts = normalisedRel.split('/');
    const filenameBase = pathParts[pathParts.length - 1].replace(/\.(md|markdown)$/i, '');

    const dateMatch = filenameBase.match(/^(\d{4}-\d{2}-\d{2})-/);
    let cleanSlug = filenameBase.replace(/^\d{4}-\d{2}-\d{2}-/, '');

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
      const parentDir = pathParts[pathParts.length - 2].toLowerCase();
      if (['zh', 'cn', 'zh-cn', 'chinese'].includes(parentDir)) {
        isPairedZh = true;
      } else if (['en', 'english'].includes(parentDir)) {
        isPairedEn = true;
      } else if (cleanSlug === 'index' || cleanSlug === 'post') {
        cleanSlug = pathParts[pathParts.length - 2].replace(/^\d{4}-\d{2}-\d{2}-/, '');
      }
    }

    if (!postsMap.has(cleanSlug)) {
      postsMap.set(cleanSlug, {
        slug: cleanSlug,
        filenameDate: dateMatch ? dateMatch[1] : null,
        commonFm: {},
        fmEn: {},
        fmZh: {},
        rawEn: '',
        rawZh: ''
      });
    }

    const postObj = postsMap.get(cleanSlug);

    ['date', 'coverImage'].forEach((key) => {
      if (frontmatter[key] !== undefined && postObj.commonFm[key] === undefined) {
        postObj.commonFm[key] = frontmatter[key];
      }
    });

    if (isPairedZh) {
      postObj.fmZh.title_zh = frontmatter.title_zh || frontmatter.title;
      postObj.fmZh.summary_zh = frontmatter.summary_zh || frontmatter.summary || frontmatter.description_zh || frontmatter.description;
      postObj.fmZh.category_zh = frontmatter.category_zh || frontmatter.category;
      postObj.rawZh = rawContent.trim();
    } else if (isPairedEn) {
      postObj.fmEn.title = frontmatter.title;
      postObj.fmEn.summary = frontmatter.summary || frontmatter.description;
      postObj.fmEn.category = frontmatter.category;
      postObj.rawEn = rawContent.trim();
    } else {
      if (frontmatter.title) postObj.fmEn.title = frontmatter.title;
      if (frontmatter.title_zh) postObj.fmZh.title_zh = frontmatter.title_zh;
      if (frontmatter.summary) postObj.fmEn.summary = frontmatter.summary;
      if (frontmatter.summary_zh) postObj.fmZh.summary_zh = frontmatter.summary_zh;
      if (frontmatter.description && !postObj.fmEn.summary) postObj.fmEn.summary = frontmatter.description;
      if (frontmatter.description_zh && !postObj.fmZh.summary_zh) postObj.fmZh.summary_zh = frontmatter.description_zh;
      if (frontmatter.category) postObj.fmEn.category = frontmatter.category;
      if (frontmatter.category_zh) postObj.fmZh.category_zh = frontmatter.category_zh;

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

    const rawDate = common.date
      ? (common.date instanceof Date ? common.date.toISOString().substring(0, 10) : String(common.date).substring(0, 10))
      : (entry.filenameDate || new Date().toISOString().substring(0, 10));

    const category = normalizeCategory(fmEn.category || fmZh.category_zh || 'Tech');
    const category_zh = fmZh.category_zh || category;

    const autoExcerptEn = makeExcerpt(stripMarkdownToPlainText(entry.rawEn), 210, false);
    const autoExcerptZh = makeExcerpt(stripMarkdownToPlainText(entry.rawZh), 115, true);

    const summary = fmEn.summary || autoExcerptEn || '';
    const summary_zh = fmZh.summary_zh || autoExcerptZh || summary;
    const explicitDeckEn = fmEn.summary || '';
    const explicitDeckZh = fmZh.summary_zh || '';

    let coverImage = common.coverImage ? String(common.coverImage).trim() : '';
    if (coverImage && !coverImage.startsWith('http://') && !coverImage.startsWith('https://') && !coverImage.startsWith('data:')) {
      if (/^(\.\/|\.\.\/)?images\//i.test(coverImage)) {
        coverImage = '/' + coverImage.replace(/^(\.\/|\.\.\/)?/i, '');
      } else if (!coverImage.startsWith('/')) {
        const cleanName = coverImage.replace(/^\.\//, '');
        coverImage = `/posts/${entry.slug}/${cleanName}`;
      }
    }

    const htmlEn = marked.parse(entry.rawEn || '');
    const htmlZh = marked.parse(entry.rawZh || '');

    posts.push({
      slug: entry.slug,
      title,
      title_zh,
      date: rawDate,
      dateEn: formatDateEn(rawDate),
      dateZh: formatDateZh(rawDate),
      category,
      category_zh,
      summary,
      summary_zh,
      explicitDeckEn,
      explicitDeckZh,
      coverImage,
      htmlEn,
      htmlZh
    });
  });

  // Strict chronological order (newest first)
  posts.sort((a, b) => {
    const diff = new Date(b.date) - new Date(a.date);
    if (diff !== 0) return diff;
    return b.slug.localeCompare(a.slug);
  });

  return posts;
}

function renderHeader() {
  return `
<header class="site-header">
  <div class="nav-container">
    <a href="/" class="brand-logo">${escapeHtml(CONFIG.siteName)}</a>
    <div class="lang-switcher-pill" role="group" aria-label="Language">
      <button class="lang-btn active" data-lang-btn="en" type="button">English</button>
      <button class="lang-btn" data-lang-btn="zh" type="button">中文</button>
    </div>
  </div>
</header>`;
}

function renderFooter() {
  return `
<footer class="site-footer">
  <div class="footer-container">
    <span>Copyright &copy; ${new Date().getFullYear()} ${escapeHtml(CONFIG.author)}.</span>
  </div>
</footer>`;
}

function buildIndexPage(posts) {
  const filters = CONFIG.allowedCategories;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(CONFIG.siteName)}</title>
  <meta name="description" content="${escapeHtml(CONFIG.siteName)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(CONFIG.siteName)}" href="/rss.xml">
</head>
<body class="page-feed">
  ${renderHeader()}

  <main class="main-content">
    <div class="filter-bar" role="toolbar" aria-label="Filter by topic">
      ${filters
        .map(
          (cat) => `<button class="chip-btn" type="button" data-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
        )
        .join('\n      ')}
    </div>

    <div class="posts-timeline" id="posts-timeline">
      ${posts
        .map(
          (post) => `
      <article class="story-card" data-category="${escapeHtml(post.category)}">
        <a href="/posts/${post.slug}/" class="story-card-link">
          ${
            post.coverImage
              ? `<div class="story-image-wrapper">
            <img class="story-image" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" loading="lazy">
          </div>`
              : ''
          }
          <div class="story-content">
            <div class="story-meta">
              <span class="eyebrow">${escapeHtml(post.category)}</span>
              <span class="meta-dot" aria-hidden="true">&middot;</span>
              <time class="story-date" datetime="${escapeHtml(post.date)}" data-en="${escapeHtml(post.dateEn)}" data-zh="${escapeHtml(post.dateZh)}">${escapeHtml(post.dateEn)}</time>
            </div>
            <h2 class="story-title" data-en="${escapeHtml(post.title)}" data-zh="${escapeHtml(post.title_zh)}">${escapeHtml(post.title)}</h2>
            <p class="story-excerpt" data-en="${escapeHtml(post.summary)}" data-zh="${escapeHtml(post.summary_zh)}">${escapeHtml(post.summary)}</p>
          </div>
        </a>
      </article>`
        )
        .join('')}
    </div>

    <div class="empty-filter-state" id="empty-filter-state" style="display: none;">
      <p data-en="No articles in this category yet." data-zh="该分类下暂无文章。">No articles in this category yet.</p>
    </div>
  </main>

  ${renderFooter()}
  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'index.html'), html, 'utf8');
}

function buildPostPage(post) {
  const postDir = path.join(CONFIG.distDir, 'posts', post.slug);
  fs.mkdirSync(postDir, { recursive: true });

  const hasExplicitDeck = Boolean(post.explicitDeckEn || post.explicitDeckZh);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — ${escapeHtml(CONFIG.siteName)}</title>
  <meta name="description" content="${escapeHtml(post.summary)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(CONFIG.siteName)}" href="/rss.xml">
</head>
<body class="page-article">
  ${renderHeader()}

  <main class="article-page">
    <article class="article-container">
      <header class="article-header">
        <div class="article-meta">
          <span class="eyebrow">${escapeHtml(post.category)}</span>
          <time class="article-date" id="post-date" datetime="${escapeHtml(post.date)}" data-en="${escapeHtml(post.dateEn)}" data-zh="${escapeHtml(post.dateZh)}">${escapeHtml(post.dateEn)}</time>
        </div>
        <h1 class="article-headline" id="post-title" data-en="${escapeHtml(post.title)}" data-zh="${escapeHtml(post.title_zh)}">${escapeHtml(post.title)}</h1>
        ${
          hasExplicitDeck
            ? `<p class="article-deck" id="post-deck" data-en="${escapeHtml(post.explicitDeckEn || post.explicitDeckZh)}" data-zh="${escapeHtml(post.explicitDeckZh || post.explicitDeckEn)}">${escapeHtml(post.explicitDeckEn || post.explicitDeckZh)}</p>`
            : ''
        }
      </header>

      ${
        post.coverImage
          ? `<figure class="article-cover-figure">
        <img class="article-cover-img" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">
      </figure>`
          : ''
      }

      <div id="post-content-en" class="article-body">
        ${post.htmlEn}
      </div>

      <div id="post-content-zh" class="article-body" style="display: none;">
        ${post.htmlZh}
      </div>

      <nav class="article-back-nav" aria-label="Back to archive">
        <a href="/" class="article-back-link">
          <span aria-hidden="true">&larr;</span>
          <span data-en="All Posts" data-zh="全部文章">All Posts</span>
        </a>
      </nav>
    </article>
  </main>

  ${renderFooter()}
  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
}

function build404Page() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — ${escapeHtml(CONFIG.siteName)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body class="page-article">
  ${renderHeader()}

  <main class="article-page" style="text-align: center; padding: 120px 24px;">
    <h1 class="article-headline" style="margin-bottom: 16px;" data-en="Page not found." data-zh="未找到页面。">Page not found.</h1>
    <p style="color: var(--text-secondary); margin-bottom: 28px;"><a href="/" style="color: var(--apple-blue);" data-en="Return to Vahram 的 blog" data-zh="返回 Vahram 的 blog">Return to Vahram 的 blog</a></p>
  </main>

  ${renderFooter()}
  <script src="/assets/js/app.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(CONFIG.distDir, '404.html'), html, 'utf8');
}

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
      <category>${escapeHtml(post.category)}</category>
      <description><![CDATA[${post.summary}]]></description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(CONFIG.siteName)}</title>
    <link>${CONFIG.siteUrl}</link>
    <description>${escapeHtml(CONFIG.siteName)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${CONFIG.siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'rss.xml'), xml, 'utf8');
}

function buildSitemap(posts) {
  const urls = [
    `${CONFIG.siteUrl}/`,
    ...posts.map((p) => `${CONFIG.siteUrl}/posts/${p.slug}/`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(CONFIG.distDir, 'sitemap.xml'), xml, 'utf8');
}

function copyStaticAssets() {
  const cssDestDir = path.join(CONFIG.distDir, 'assets/css');
  fs.mkdirSync(cssDestDir, { recursive: true });
  fs.copyFileSync(path.join(CONFIG.stylesDir, 'main.css'), path.join(cssDestDir, 'main.css'));

  const jsDestDir = path.join(CONFIG.distDir, 'assets/js');
  fs.mkdirSync(jsDestDir, { recursive: true });
  fs.copyFileSync(path.join(CONFIG.scriptsDir, 'app.js'), path.join(jsDestDir, 'app.js'));

  const imagesDestDir = path.join(CONFIG.distDir, 'images');
  fs.mkdirSync(imagesDestDir, { recursive: true });

  if (fs.existsSync(CONFIG.publicDir)) {
    copyRecursive(CONFIG.publicDir, CONFIG.distDir);
  }

  if (fs.existsSync(CONFIG.sourceDir)) {
    const mediaFiles = getFilesRecursively(CONFIG.sourceDir);
    const postSlugs = [];
    try {
      const posts = loadAllPosts();
      postSlugs.push(...posts.map(p => p.slug));
    } catch (e) {
      // ignore
    }

    mediaFiles.forEach(({ fullPath, relPath, name }) => {
      if (/\.(md|markdown)$/i.test(name) || name === 'TEMPLATE.md') return;
      const cleanRelPath = relPath.replace(/^\d{4}-\d{2}-\d{2}-/, '');

      // 1. Copy to dist/posts/<relPath>
      const destPostPath = path.join(CONFIG.distDir, 'posts', relPath);
      fs.mkdirSync(path.dirname(destPostPath), { recursive: true });
      fs.copyFileSync(fullPath, destPostPath);

      // 2. Copy to dist/posts/<cleanRelPath>
      if (cleanRelPath !== relPath) {
        const destCleanPostPath = path.join(CONFIG.distDir, 'posts', cleanRelPath);
        fs.mkdirSync(path.dirname(destCleanPostPath), { recursive: true });
        fs.copyFileSync(fullPath, destCleanPostPath);
      }

      // 3. Copy to root dist/<cleanRelPath>
      const destRootPath = path.join(CONFIG.distDir, cleanRelPath);
      fs.mkdirSync(path.dirname(destRootPath), { recursive: true });
      fs.copyFileSync(fullPath, destRootPath);

      // 4. If image is inside images/ (e.g. content/posts/images/pic.png), ensure dist/images/pic.png exists
      if (/^images[\\/]/i.test(relPath)) {
        const imgSubPath = relPath.replace(/^images[\\/]/i, '');
        const targetImgPath = path.join(imagesDestDir, imgSubPath);
        fs.mkdirSync(path.dirname(targetImgPath), { recursive: true });
        fs.copyFileSync(fullPath, targetImgPath);
      }

      // 5. If image was placed directly at content/posts/ (e.g. content/posts/pic.png)
      // copy to dist/images/pic.png and to every post's folder so relative references ./pic.png work
      if (!relPath.includes('/') && !relPath.includes('\\')) {
        const rootImgTarget = path.join(imagesDestDir, relPath);
        fs.copyFileSync(fullPath, rootImgTarget);

        postSlugs.forEach(slug => {
          const postImgTarget = path.join(CONFIG.distDir, 'posts', slug, relPath);
          fs.mkdirSync(path.dirname(postImgTarget), { recursive: true });
          fs.copyFileSync(fullPath, postImgTarget);
        });
      }
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

function build() {
  console.log('Building Vahram 的 blog...');
  const startTime = Date.now();

  fs.rmSync(CONFIG.distDir, { recursive: true, force: true });
  fs.mkdirSync(CONFIG.distDir, { recursive: true });

  const posts = loadAllPosts();
  console.log(`Loaded ${posts.length} bilingual post(s).`);

  buildIndexPage(posts);
  posts.forEach((post) => buildPostPage(post));
  build404Page();

  buildRssFeed(posts);
  buildSitemap(posts);

  copyStaticAssets();

  const elapsed = Date.now() - startTime;
  console.log(`Build completed in ${elapsed}ms -> ${CONFIG.distDir}`);
}

if (require.main === module) {
  build();
}

module.exports = { build, loadAllPosts };
