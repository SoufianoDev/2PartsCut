/**
 * hcaptcha.sitekey.ts
 * 
 * Contains the hCaptcha site key for frontend use
 * 
 * IMPORTANT: This file only contains the public site key, which is safe to include in frontend code.
 * The secret key should NEVER be included here and should only be stored in environment variables on the server.
 * 
 * Following official hCaptcha integration guidelines:
 * - Site key is stored plaintext in the frontend
 * - Secret key is stored only on the server in environment variables
 * - Verification is done server-side via the official API
 */

// Class to handle hCaptcha keys
export class HCaptchaKeyManager {
    private static instance: HCaptchaKeyManager;
    
    // The site key is public and used in the frontend
    // This is the key that goes into the data-sitekey attribute in HTML
    private readonly siteKey: string = '006abb56-ec16-427e-bfec-3f06f8ae5a1a';
    
    // Private constructor to enforce singleton pattern
    private constructor() {}
    
    // Get the singleton instance
    static getInstance(): HCaptchaKeyManager {
        if (!HCaptchaKeyManager.instance) {
            HCaptchaKeyManager.instance = new HCaptchaKeyManager();
        }
        return HCaptchaKeyManager.instance;
    }
    
    // Get the site key - this is safe to expose in frontend code
    getSiteKey(): string {
        return this.siteKey;
    }
}
