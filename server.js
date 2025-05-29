const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { build } = require('esbuild');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.ts': 'application/javascript', // TypeScript files served as JavaScript
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Security headers and CORS
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html') 
    : path.join(__dirname, req.url.split('?')[0]);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Special handling for TypeScript files
  if (ext === '.ts') {
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File doesn't exist
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      
      // Process TypeScript file on-the-fly
      build({
        entryPoints: [filePath],
        bundle: true,
        write: false,
        format: 'esm',
        target: 'es2020',
        loader: { '.ts': 'ts' },
      }).then(result => {
        const jsContent = result.outputFiles[0].text;
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(jsContent, 'utf-8');
      }).catch(error => {
        console.error('TypeScript compilation error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`TypeScript Compilation Error: ${error.message}`);
      });
    });
  } else {
    // Regular file handling
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          fs.readFile(path.join(__dirname, 'index.html'), (err2, fallback) => {
            if (err2) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('404 Not Found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallback, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
});

// Build TypeScript CAPTCHA module before starting server
console.log('Building TypeScript CAPTCHA module...');
try {
  // Run the build script
  execSync('node build.js', { stdio: 'inherit' });
  console.log('TypeScript CAPTCHA module built successfully!');
} catch (error) {
  console.error('Failed to build TypeScript CAPTCHA module:', error.message);
  process.exit(1);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ CORS headers for FFmpeg are enabled`);
  console.log(`✓ Cross-Origin-Opener-Policy: same-origin`);
  console.log(`✓ Cross-Origin-Embedder-Policy: require-corp`);
});
