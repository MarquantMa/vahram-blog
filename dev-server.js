/**
 * Vahram's Blog - Local Live Development Server
 * Serves dist/ with file watching and automatic rebuild on markdown / style edits.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.xml': 'application/xml; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8'
};

// Initial Build
build();

// Start HTTP Server
const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // Normalize path
  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  } else if (!path.extname(reqPath)) {
    // Check if directory exists with index.html
    const potentialDir = path.join(DIST_DIR, reqPath, 'index.html');
    if (fs.existsSync(potentialDir)) {
      reqPath += '/index.html';
    } else {
      reqPath += '.html';
    }
  }

  const filePath = path.join(DIST_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 fallback
      const notFoundPath = path.join(DIST_DIR, '404.html');
      if (fs.existsSync(notFoundPath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        fs.createReadStream(notFoundPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n Vahram's Blog Server running at: http://localhost:${PORT}/`);
  console.log(`📡 Watching content/posts/, src/styles/, src/scripts/ for real-time changes...\n`);
});

// File Watcher with Debounce
let debounceTimer = null;
function triggerRebuild(event, filename) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    console.log(`\n🔄 Change detected in ${filename || 'files'}. Rebuilding...`);
    try {
      build();
      console.log('⚡ Site rebuilt successfully.\n');
    } catch (err) {
      console.error('❌ Rebuild error:', err);
    }
  }, 200);
}

const watchDirs = [
  path.join(__dirname, 'content/posts'),
  path.join(__dirname, 'src/styles'),
  path.join(__dirname, 'src/scripts')
];

watchDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, triggerRebuild);
  }
});
