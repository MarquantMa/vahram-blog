/**
 * Vahram's Blog - Automated Test Suite
 * Verifies build pipeline, bilingual splitting, Apple Newsroom components, and Cloudflare Pages compatibility.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build, loadAllPosts } = require('./build');

console.log('🧪 Starting test suite for Vahram\'s Blog...\n');

let totalTests = 0;
let passedTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// 1. Post Loading & Frontmatter Tests
it('should load all sample blog posts from content/posts/', () => {
  const posts = loadAllPosts();
  assert.ok(posts.length >= 4, `Expected at least 4 posts, found ${posts.length}`);
  
  posts.forEach((post) => {
    assert.ok(post.slug, 'Post must have a slug');
    assert.ok(post.title, `Post ${post.slug} must have an English title`);
    assert.ok(post.title_zh, `Post ${post.slug} must have a Chinese title`);
    assert.ok(post.date, `Post ${post.slug} must have a date`);
    assert.ok(post.category, `Post ${post.slug} must have a category`);
    assert.ok(post.category_zh, `Post ${post.slug} must have a Chinese category`);
    assert.ok(post.summary, `Post ${post.slug} must have an English summary`);
    assert.ok(post.summary_zh, `Post ${post.slug} must have a Chinese summary`);
  });
});

it('should correctly parse bilingual content for every post', () => {
  const posts = loadAllPosts();
  posts.forEach((post) => {
    assert.ok(post.htmlEn && post.htmlEn.length > 50, `Post ${post.slug} must have non-empty htmlEn`);
    assert.ok(post.htmlZh && post.htmlZh.length > 50, `Post ${post.slug} must have non-empty htmlZh`);
  });
});

// 2. Build Pipeline Tests
it('should execute build() without errors', () => {
  build();
  assert.ok(fs.existsSync(path.join(__dirname, 'dist')));
});

it('should generate dist/index.html with Apple Newsroom structure', () => {
  const indexPath = path.join(__dirname, 'dist/index.html');
  assert.ok(fs.existsSync(indexPath));
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('Vahram'), 'Must include brand Vahram');
  assert.ok(html.includes('site-header'), 'Must include Apple header');
  assert.ok(html.includes('lang-switcher-pill'), 'Must include language switcher pill');
  assert.ok(html.includes('hero-story-card'), 'Must include hero featured card');
  assert.ok(html.includes('stories-grid'), 'Must include stories grid');
  assert.ok(html.includes('search-modal-backdrop'), 'Must include search modal');
});

it('should generate pre-rendered pages for every post with dual language containers', () => {
  const posts = loadAllPosts();
  posts.forEach((post) => {
    const postHtmlPath = path.join(__dirname, 'dist/posts', post.slug, 'index.html');
    assert.ok(fs.existsSync(postHtmlPath), `Missing generated post page for ${post.slug}`);

    const html = fs.readFileSync(postHtmlPath, 'utf8');
    assert.ok(html.includes('id="post-content-en"'), `Post ${post.slug} missing #post-content-en`);
    assert.ok(html.includes('id="post-content-zh"'), `Post ${post.slug} missing #post-content-zh`);
    assert.ok(html.includes('article-lang-bar'), `Post ${post.slug} missing one-click language bar`);
    assert.ok(html.includes('data-lang-btn="en"'), `Post ${post.slug} missing EN switch button`);
    assert.ok(html.includes('data-lang-btn="zh"'), `Post ${post.slug} missing ZH switch button`);
    assert.ok(html.includes('post-title'), `Post ${post.slug} missing #post-title`);
  });
});

it('should render macOS styled code blocks with traffic light controls', () => {
  const postHtmlPath = path.join(__dirname, 'dist/posts/introducing-vahram-blog/index.html');
  const html = fs.readFileSync(postHtmlPath, 'utf8');
  assert.ok(html.includes('class="code-block"'), 'Must include .code-block');
  assert.ok(html.includes('class="code-dot red"'), 'Must include red dot');
  assert.ok(html.includes('class="copy-code-btn"'), 'Must include copy code button');
});

it('should generate valid search API index in dist/api/posts.json', () => {
  const searchJsonPath = path.join(__dirname, 'dist/api/posts.json');
  assert.ok(fs.existsSync(searchJsonPath));
  const data = JSON.parse(fs.readFileSync(searchJsonPath, 'utf8'));
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 4);
  data.forEach((item) => {
    assert.ok(item.slug);
    assert.ok(item.title);
    assert.ok(item.title_zh);
  });
});

it('should generate RSS 2.0 and Sitemap XML feeds', () => {
  const rssPath = path.join(__dirname, 'dist/rss.xml');
  const sitemapPath = path.join(__dirname, 'dist/sitemap.xml');
  assert.ok(fs.existsSync(rssPath), 'Missing rss.xml');
  assert.ok(fs.existsSync(sitemapPath), 'Missing sitemap.xml');

  const rssContent = fs.readFileSync(rssPath, 'utf8');
  assert.ok(rssContent.includes('<rss version="2.0"'), 'Invalid RSS header');
  assert.ok(rssContent.includes('<item>'), 'RSS should contain items');

  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemapContent.includes('<urlset'), 'Invalid Sitemap header');
  assert.ok(sitemapContent.includes('<loc>https://vahram.pages.dev/'), 'Sitemap missing root URL');
});

it('should generate Cloudflare Pages configuration files (_headers, _redirects, wrangler.toml)', () => {
  assert.ok(fs.existsSync(path.join(__dirname, 'dist/_headers')), 'Missing dist/_headers');
  assert.ok(fs.existsSync(path.join(__dirname, 'dist/_redirects')), 'Missing dist/_redirects');
  assert.ok(fs.existsSync(path.join(__dirname, 'wrangler.toml')), 'Missing root wrangler.toml');

  const wranglerContent = fs.readFileSync(path.join(__dirname, 'wrangler.toml'), 'utf8');
  assert.ok(wranglerContent.includes('name = "vahram"'), 'wrangler.toml must have name = "vahram"');
  assert.ok(wranglerContent.includes('pages_build_output_dir = "dist"'), 'wrangler.toml must output to dist');
});

it('should verify client-side script (app.js) contains one-click switcher logic', () => {
  const jsPath = path.join(__dirname, 'dist/assets/js/app.js');
  assert.ok(fs.existsSync(jsPath));
  const js = fs.readFileSync(jsPath, 'utf8');
  assert.ok(js.includes('switchLanguage'), 'app.js must contain switchLanguage');
  assert.ok(js.includes('vahram_lang'), 'app.js must persist language to localStorage');
  assert.ok(js.includes('vahram_theme'), 'app.js must persist theme to localStorage');
  assert.ok(js.includes('search-modal-backdrop'), 'app.js must handle Spotlight search modal');
});

// Summary
console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed.`);
if (passedTests === totalTests) {
  console.log('🎉 All blog functionality and verification checks PASSED successfully!\n');
} else {
  console.error('❌ Some tests failed.');
  process.exit(1);
}
