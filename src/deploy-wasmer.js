// Wasmer SDK deployment script
const sdk = require('@wasmer/sdk');

async function initSDK() {
  if (typeof sdk.init === 'function') {
    await sdk.init();
    console.log('SDK initialized');
  } else {
    console.log('SDK init method not found, assuming already initialized');
  }
}

async function deployToWasmer() {
  try {
    console.log('Initializing Wasmer SDK...');
    await initSDK();
    
    const fs = require('fs');
    const path = require('path');
    const projectDir = process.cwd();
    
    console.log('Working with project directory:', projectDir);
    
    // Check if wasmer.toml exists
    const wasmerTomlPath = path.join(projectDir, 'wasmer.toml');
    if (!fs.existsSync(wasmerTomlPath)) {
      console.error('wasmer.toml not found at', wasmerTomlPath);
      return;
    }
    
    console.log('wasmer.toml found at', wasmerTomlPath);
    
    // Create a Wasmer instance
    if (!sdk.Wasmer || typeof sdk.Wasmer !== 'function') {
      console.error('Wasmer class not found in SDK');
      return;
    }
    
    const wasmer = new sdk.Wasmer();
    console.log('Wasmer instance created');
    
    // Try to use pkg method to create a package
    if (typeof wasmer.pkg !== 'function') {
      console.error('pkg method not found on Wasmer instance');
      return;
    }
    
    try {
      console.log('Creating package from directory...');
      const pkg = wasmer.pkg(projectDir);
      console.log('Package created:', pkg);
      
      // Check if we can publish the package
      if (pkg && typeof pkg.publish === 'function') {
        console.log('Publishing package...');
        const result = await pkg.publish();
        console.log('Package published successfully:', result);
        console.log('Your app should now be available on Wasmer');
      } else {
        console.error('publish method not found on package object');
      }
    } catch (pkgError) {
      console.error('Error creating or publishing package:', pkgError);
    }
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

deployToWasmer().catch(console.error);
