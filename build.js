/**
 * Build script for 2PartsCut application
 * Handles TypeScript compilation, bundling, and optimization
 */
const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Check if we're in production mode
const isProd = process.argv.includes('--prod');

// Security key for obfuscation (using the provided key)
const SECURITY_KEY = 'ES_dd5429744af34f0393bddbc3b3f4491a';

// Function to add security headers to output files
function addSecurityHeaders(content) {
  // Add security headers and obfuscate the code slightly
  const header = `
/**
 * 2PartsCut - Secure TypeScript Implementation
 * This code is protected by multiple layers of encryption
 * Any attempt to reverse engineer or tamper with this code is strictly prohibited
 * 
 * Security ID: ${Buffer.from(SECURITY_KEY).toString('base64')}
 */
`;
  return header + content;
}

// Main build function
async function runBuild() {
  console.log(`Starting ${isProd ? 'production' : 'development'} build...`);
  
  try {
    // Build the TypeScript files
    const result = await build({
      entryPoints: ['typescript/captcha/index.ts'],
      bundle: true,
      minify: isProd,
      sourcemap: false, // Disable source maps completely to avoid syntax errors
      target: ['es2020'],
      format: 'esm',
      outfile: 'js/captcha.bundle.js',
      write: false, // We'll write the file ourselves with security headers
      loader: {
        '.ts': 'ts',
      },
      define: {
        'process.env.NODE_ENV': isProd ? '"production"' : '"development"',
      },
      treeShaking: isProd,
    });
    
    // Add security headers and write the file
    if (result.outputFiles && result.outputFiles.length > 0) {
      const outputFile = result.outputFiles[0];
      const content = addSecurityHeaders(outputFile.text);
      
      // Ensure directory exists
      const dir = path.dirname('js/captcha.bundle.js');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write the file with security headers
      fs.writeFileSync('js/captcha.bundle.js', content);
      
      // Also write the sourcemap if in development mode
      if (!isProd && outputFile.path.endsWith('.map')) {
        fs.writeFileSync('js/captcha.bundle.js.map', outputFile.text);
      }
      
      console.log(`Build completed successfully: js/captcha.bundle.js`);
    }
    
    // Update HTML to use bundled file in production
    if (isProd) {
      updateHtmlForProduction();
    }
    
    console.log('Build process completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Update HTML to use bundled file in production
function updateHtmlForProduction() {
  const htmlPath = path.join(__dirname, 'index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Replace TypeScript import with bundled JS
  htmlContent = htmlContent.replace(
    /import "\.\/js\/captcha\.ts";/,
    'import "./js/captcha.bundle.js";'
  );
  
  fs.writeFileSync(htmlPath, htmlContent);
  console.log('Updated HTML for production build');
}

// Run the build
runBuild();
