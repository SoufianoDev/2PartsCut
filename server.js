const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Default port with fallback options
let PORT = 3000;
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 different ports

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Add security headers for SharedArrayBuffer support and CORS
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle the root path
  let filePath = req.url === '/' 
    ? path.join(__dirname, 'index.html')
    : path.join(__dirname, req.url);
  
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Page not found
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Try to start the server with port fallbacks
async function startServer() {
  let attempts = 0;
  let currentPort = PORT;
  
  while (attempts < MAX_PORT_ATTEMPTS) {
    try {
      const inUse = await isPortInUse(currentPort);
      
      if (inUse) {
        console.log(`Port ${currentPort} is already in use, trying next port...`);
        currentPort++;
        attempts++;
        continue;
      }
      
      // Port is available, start server
      server.listen(currentPort, () => {
        console.log(`✅ 2PartsCut server running at http://localhost:${currentPort}/`);
      });
      
      return;
    } catch (err) {
      console.error(`Error checking port ${currentPort}:`, err);
      currentPort++;
      attempts++;
    }
  }
  
  console.error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts.`);
}

// Start the server
startServer();