const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { build } = require('esbuild');
const { execSync } = require('child_process');

// Log environment information for debugging
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Environment:', process.env.NODE_ENV || 'development');

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

  // Explicitly prioritize the public/index.html file
  // This ensures we're always serving the correct file
  let filePath;
  if (req.url === '/') {
    // For root URL, always use the public/index.html file
    const publicIndexPath = path.join(process.cwd(), 'public', 'index.html');
    console.log('Checking for public index at:', publicIndexPath);
    
    if (fs.existsSync(publicIndexPath)) {
      filePath = publicIndexPath;
      console.log('Using public/index.html');
    } else {
      // Fallback to root index.html if public one doesn't exist
      filePath = path.join(process.cwd(), 'index.html');
      console.log('Falling back to root index.html');
    }
  } else {
    // For other URLs, look in public directory first
    const urlPath = req.url.split('?')[0];
    const publicPath = path.join(process.cwd(), 'public', urlPath);
    
    if (fs.existsSync(publicPath)) {
      filePath = publicPath;
    } else {
      // Fallback to root directory
      filePath = path.join(process.cwd(), urlPath);
    }
  }
  
  console.log('Attempting to serve file:', filePath);

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
  // Check if build.js exists before running it
  const buildScriptPath = path.join(process.cwd(), 'build.js');
  if (fs.existsSync(buildScriptPath)) {
    console.log('Found build script at:', buildScriptPath);
    execSync('node build.js', { stdio: 'inherit' });
    console.log('TypeScript CAPTCHA module built successfully!');
  } else {
    console.log('No build.js found at', buildScriptPath, '- skipping build step');
  }
} catch (error) {
  console.error('Failed to build TypeScript CAPTCHA module:', error.message);
  // Don't exit process on error, just log it
  console.log('Continuing server startup despite build error');
}

// Listen on all interfaces (0.0.0.0), not just localhost
// This is critical for Wasmer Edge deployment
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ CORS headers for FFmpeg are enabled`);
  console.log(`✓ Cross-Origin-Opener-Policy: same-origin`);
  console.log(`✓ Cross-Origin-Embedder-Policy: require-corp`);
});
