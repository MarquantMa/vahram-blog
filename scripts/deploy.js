/**
 * Vahram 的 blog - One-command Build & Deploy Script
 * Usage:
 *   npm run deploy
 *   npm run deploy -- "commit message"
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const msg = process.argv.slice(2).join(' ').trim() || `Update blog posts - ${new Date().toISOString().substring(0, 10)}`;

// Environment setup for macOS git & wrangler
const env = {
  ...process.env,
  PATH: `/Library/Developer/CommandLineTools/usr/bin:/opt/homebrew/bin:${process.env.PATH}`,
  WRANGLER_CACHE_DIR: path.join(os.homedir(), '.wrangler/cache')
};

function run(cmd, desc) {
  console.log(`\n⏳ ${desc}...`);
  try {
    execSync(cmd, { cwd: rootDir, env, stdio: 'inherit' });
  } catch (err) {
    console.error(`\n❌ Failed at: ${desc}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('🚀 Deploying Vahram 的 blog (Local -> Cloudflare & GitHub)');
console.log('====================================================');

// 1. Build Static Files
run('npm run build', 'Building static site');

// 2. Deploy to Cloudflare Pages
run('npx --yes wrangler pages deploy dist --project-name=vahram --branch=main', 'Deploying to Cloudflare Pages (vahram.pages.dev)');

// 3. Git commit & push
run('git add -A', 'Staging Git changes');

try {
  execSync('git diff --cached --quiet', { cwd: rootDir, env });
  console.log('\nℹ️ No new git changes to commit, skipping commit step.');
} catch (e) {
  // Diff exists, so commit
  const safeMsg = msg.replace(/"/g, '\\"');
  run(`git commit -m "${safeMsg}"`, `Committing changes: "${msg}"`);
}

run('git push origin main --no-verify', 'Pushing commits to GitHub');

console.log('\n====================================================');
console.log('🎉 部署成功！全部更新已生效：');
console.log('👉 博客线上地址: https://vahram.pages.dev');
console.log('👉 GitHub 仓库: https://github.com/MarquantMa/vahram-blog');
console.log('====================================================\n');
