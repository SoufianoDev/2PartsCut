/**
 * Main entry point for the CAPTCHA module
 * Exports the CaptchaHandler and initializes global instance
 * Following official hCaptcha integration guidelines
 */

import { CaptchaHandler } from './handler';
import { HCaptchaKeyManager } from './hcaptcha.sitekey';

// The ICaptchaHandler interface is already defined in types.d.ts
// We don't need to redefine it here

// The Window interface is already defined in types.d.ts
// We don't need to redeclare it here

// Initialize the hCaptcha key manager
const keyManager = HCaptchaKeyManager.getInstance();
console.log('Using hCaptcha site key:', keyManager.getSiteKey());

// Create and expose the captcha handler
window.captchaHandler = new CaptchaHandler();

// Initialize the captcha handler
window.captchaHandler.init((token: string) => {
    console.log('CAPTCHA verified with token:', token.substring(0, 10) + '...');
    // The video processing can now proceed
    const processBtn = document.getElementById('processBtn');
    if (processBtn && typeof (window as any).processVideo === 'function') {
        // Trigger the video processing
        (window as any).processVideo();
    }
});

// Set up global callback functions for hCaptcha
window.onCaptchaVerify = (token: string) => {
    if (window.captchaHandler) {
        window.captchaHandler.onVerify(token);
    }
};

window.onCaptchaExpire = () => {
    if (window.captchaHandler) {
        window.captchaHandler.onExpire();
    }
};

window.onCaptchaError = (err: Error) => {
    if (window.captchaHandler) {
        window.captchaHandler.onError(err);
    }
};

// Export for TypeScript module support
export default CaptchaHandler;
// Export key manager for use in other modules
export { HCaptchaKeyManager };
