/**
 * Vahram 的 blog — Automated Test Suite
 * Verifies chronological ordering, exact 3 filters (Personal, Tech, Entrepreneurship),
 * one-click EN/ZH bilingual switching, zero UI clutter, and Cloudflare Pages output.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build, loadAllPosts } = require('./build');

console.log('🧪 Starting test suite for Vahram 的 blog...\n');

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

it('should load published posts and exclude removed AI sample articles', () => {
  const posts = loadAllPosts();
  assert.ok(posts.length >= 1, `Expected at least 1 post, found ${posts.length}`);

  const slugs = posts.map((p) => p.slug);
  assert.ok(slugs.includes('openais-700-math-essays'), 'Must include openais-700-math-essays');
  assert.ok(!slugs.includes('introducing-vahram-blog'), 'Old AI post must be removed');
  assert.ok(!slugs.includes('designing-for-ambient-intelligence'), 'Old AI post must be removed');
  assert.ok(!slugs.includes('the-craft-of-software-engineering'), 'Old AI post must be removed');
  assert.ok(!slugs.includes('typography-and-digital-spaces'), 'Old AI post must be removed');

  posts.forEach((post) => {
    assert.ok(post.slug, 'Post must have a slug');
    assert.ok(post.title, `Post ${post.slug} must have an English title`);
    assert.ok(post.title_zh, `Post ${post.slug} must have a Chinese title`);
    assert.ok(post.date, `Post ${post.slug} must have a date`);
    assert.ok(post.category, `Post ${post.slug} must have a category`);
  });
});

it('should sort posts strictly in reverse chronological order', () => {
  const posts = loadAllPosts();
  for (let i = 1; i < posts.length; i++) {
    assert.ok(
      new Date(posts[i - 1].date) >= new Date(posts[i].date),
      `Posts out of chronological order: ${posts[i - 1].date} before ${posts[i].date}`
    );
  }
});

it('should correctly parse bilingual content for every post', () => {
  const posts = loadAllPosts();
  posts.forEach((post) => {
    assert.ok(post.htmlEn && post.htmlEn.length > 50, `Post ${post.slug} must have non-empty htmlEn`);
    assert.ok(post.htmlZh && post.htmlZh.length > 50, `Post ${post.slug} must have non-empty htmlZh`);
  });
});

it('should execute clean build() without errors and remove stale artifacts', () => {
  build();
  assert.ok(fs.existsSync(path.join(__dirname, 'dist')));
  assert.ok(!fs.existsSync(path.join(__dirname, 'dist/about')), 'About page must not exist');
  assert.ok(!fs.existsSync(path.join(__dirname, 'dist/api')), 'Search API bloat must not exist');
});

it('should generate dist/index.html with ONLY the 3 allowed filters and zero clutter', () => {
  const indexPath = path.join(__dirname, 'dist/index.html');
  assert.ok(fs.existsSync(indexPath));
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(html.includes('Vahram 的 blog'), 'Must include brand Vahram 的 blog');
  assert.ok(html.includes('lang-switcher-pill'), 'Must include language switcher pill');
  assert.ok(html.includes('posts-timeline'), 'Must include chronological posts timeline');

  const filterMatches = [...html.matchAll(/data-filter="([^"]+)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(
    filterMatches,
    ['Personal', 'Tech', 'Entrepreneurship'],
    `Expected exact 3 filters Personal, Tech, Entrepreneurship, got: ${filterMatches.join(', ')}`
  );

  assert.ok(!html.includes('search-modal'), 'Search modal must be removed');
  assert.ok(!html.includes('theme-toggle-btn'), 'Theme toggle button must be removed');
  assert.ok(!html.includes('hero-story-card'), 'Featured hero override must be removed');
});

it('should generate pre-rendered pages for every post with dual language containers and zero clutter', () => {
  const posts = loadAllPosts();
  posts.forEach((post) => {
    const postHtmlPath = path.join(__dirname, 'dist/posts', post.slug, 'index.html');
    assert.ok(fs.existsSync(postHtmlPath), `Missing generated post page for ${post.slug}`);

    const html = fs.readFileSync(postHtmlPath, 'utf8');
    assert.ok(html.includes('id="post-content-en"'), `Post ${post.slug} missing #post-content-en`);
    assert.ok(html.includes('id="post-content-zh"'), `Post ${post.slug} missing #post-content-zh`);
    assert.ok(html.includes('data-lang-btn="en"'), `Post ${post.slug} missing EN switch button`);
    assert.ok(html.includes('data-lang-btn="zh"'), `Post ${post.slug} missing ZH switch button`);
    assert.ok(html.includes('id="post-title"'), `Post ${post.slug} missing #post-title`);
    assert.ok(!html.includes('copy-article-link-btn'), 'Share link button must be removed');
    assert.ok(!html.includes('Post on X'), 'Social share clutter must be removed');
    assert.ok(!html.includes('Edit on GitHub'), 'Edit on GitHub button must be removed');
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
  assert.ok(!sitemapContent.includes('/about/'), 'Sitemap must not include removed /about/ route');
});

it('should generate Cloudflare Pages configuration files (_headers, _redirects, wrangler.toml)', () => {
  assert.ok(fs.existsSync(path.join(__dirname, 'dist/_headers')), 'Missing dist/_headers');
  assert.ok(fs.existsSync(path.join(__dirname, 'dist/_redirects')), 'Missing dist/_redirects');
  assert.ok(fs.existsSync(path.join(__dirname, 'wrangler.toml')), 'Missing root wrangler.toml');

  const wranglerContent = fs.readFileSync(path.join(__dirname, 'wrangler.toml'), 'utf8');
  assert.ok(wranglerContent.includes('name = "vahram"'), 'wrangler.toml must have name = "vahram"');
  assert.ok(
    wranglerContent.includes('assets') || wranglerContent.includes('pages_build_output_dir'),
    'wrangler.toml must output to dist'
  );
});

it('should verify client-side script (app.js) contains one-click switcher and 3-filter toggle logic', () => {
  const jsPath = path.join(__dirname, 'dist/assets/js/app.js');
  assert.ok(fs.existsSync(jsPath));
  const js = fs.readFileSync(jsPath, 'utf8');
  assert.ok(js.includes('switchLanguage'), 'app.js must contain switchLanguage');
  assert.ok(js.includes('vahram_lang'), 'app.js must persist language to localStorage');
  assert.ok(js.includes('applyFilter'), 'app.js must contain category filter logic');
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed.`);
if (passedTests === totalTests) {
  console.log('🎉 All blog functionality and verification checks PASSED successfully!\n');
} else {
  console.error('❌ Some tests failed.');
  process.exit(1);
}
