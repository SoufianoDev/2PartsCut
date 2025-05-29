/**
 * Main CAPTCHA handler implementation
 * Manages hCaptcha integration using the standard approach
 * Following official hCaptcha documentation
 */

import { HCaptchaKeyManager } from './hcaptcha.sitekey';

// Simple storage utility for client-side data
class Storage {
    static store(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('Error storing data:', e);
        }
    }
    
    static retrieve(key: string): string {
        try {
            return localStorage.getItem(key) || '';
        } catch (e) {
            console.error('Error retrieving data:', e);
            return '';
        }
    }
}

// TypeScript interfaces and types for type safety
type CaptchaStatus = 'pending' | 'verified' | 'expired' | 'error';

// The main CAPTCHA handler class
export class CaptchaHandler {
    private captchaContainer: HTMLElement | null;
    private captchaWidgetContainer: HTMLElement | null;
    private captchaStatus: CaptchaStatus;
    private onCaptchaVerifiedCallback: ((token: string) => void) | null;
    private readonly siteKey: string;
    private widgetId: string | null = null;
    
    constructor() {
        // No longer using the popup container, instead using the widget directly above the button
        this.captchaContainer = document.getElementById('captcha-container');
        this.captchaWidgetContainer = document.getElementById('h-captcha-widget-container');
        this.captchaStatus = 'pending';
        this.onCaptchaVerifiedCallback = null;
        
        // Get the site key directly - it's public and safe to include in frontend code
        this.siteKey = HCaptchaKeyManager.getInstance().getSiteKey();
        
        // Hide the old captcha container (keeping for backward compatibility)
        if (this.captchaContainer) {
            this.captchaContainer.style.display = 'none';
        }
    }
    
    /**
     * Initialize the CAPTCHA
     * @param callback - Function to call when CAPTCHA is verified
     */
    init(callback: (token: string) => void): void {
        this.onCaptchaVerifiedCallback = callback;
        
        // We no longer need to dynamically load the script as it's already in the HTML
        // We just need to set up the callback for when the user completes the challenge
        
        // Make sure the widget container is initially hidden
        if (this.captchaWidgetContainer) {
            this.captchaWidgetContainer.style.display = 'flex';
        }
        
        // Set up callback for the standard hCaptcha integration
        (window as any).hcaptchaCallback = (token: string) => {
            this.onVerify(token);
        };
    }
    
    /**
     * Show the CAPTCHA directly in the widget container above the button
     */
    show(): void {
        // Always use the inline widget approach - no need to show the popup container
        if (!this.captchaWidgetContainer) return;
        
        // Make sure the widget container is visible
        this.captchaWidgetContainer.style.display = 'flex';
        
        // Check if hCaptcha is loaded
        if ((window as any).hcaptcha) {
            // If we've already rendered a widget, reset it
            if (this.widgetId) {
                (window as any).hcaptcha.reset(this.widgetId);
            } else {
                // Otherwise, render a new widget
                this.renderCaptcha();
            }
        } else {
            // If hCaptcha is not loaded yet, try to render it
            this.renderCaptcha();
        }
    }
    
    /**
     * Hide the CAPTCHA widget
     */
    hide(): void {
        // Hide the inline widget container
        if (this.captchaWidgetContainer) {
            this.captchaWidgetContainer.style.display = 'none';
        }
        
        // Also hide the old popup container for backward compatibility
        if (this.captchaContainer) {
            this.captchaContainer.style.display = 'none';
        }
    }
    
    /**
     * Reset the CAPTCHA
     */
    reset(): void {
        this.captchaStatus = 'pending';
        
        // Only reset if hCaptcha is loaded and we have a widget ID
        if ((window as any).hcaptcha && this.widgetId) {
            (window as any).hcaptcha.reset(this.widgetId);
        }
    }
    
    /**
     * Render the hCaptcha widget using the proper API with explicit rendering
     * Following the official hCaptcha documentation
     * @private
     */
    private renderCaptcha(): void {
        try {
            // Check if hCaptcha script has loaded
            if (!(window as any).hcaptcha) {
                console.warn('hCaptcha script not loaded yet');
                // Try again in 1 second
                setTimeout(() => this.renderCaptcha(), 1000);
                return;
            }
            
            // Find the official hCaptcha div with class="h-captcha"
            const hCaptchaDiv = document.querySelector('.h-captcha');
            
            if (!hCaptchaDiv) {
                console.error('Cannot find .h-captcha element');
                return;
            }
            
            // With the new implementation using the official approach,
            // we don't need to manually clear or manipulate the div
            
            // Per hCaptcha documentation, render the widget with explicit rendering
            // Pass the DOM element directly to render
            const widgetId = (window as any).hcaptcha.render(hCaptchaDiv, {
                sitekey: this.siteKey,
                theme: 'light',
                size: 'normal',
                callback: (token: string) => {
                    this.onVerify(token);
                },
                'expired-callback': () => this.onExpire(),
                'error-callback': (err: Error) => this.onError(err),
                'close-callback': () => {
                    console.log('CAPTCHA was closed without verification');
                }
            });
            
            // Store the widget ID for future reference
            const widgetIdString = widgetId.toString();
            this.widgetId = widgetIdString;
            Storage.store('widget_id', widgetIdString);
            
            // No need for manual animation with the official implementation
            // The hCaptcha widget handles its own rendering
        } catch (error) {
            console.error('Error rendering hCaptcha widget:', error);
            const hCaptchaDiv = document.querySelector('.h-captcha');
            // Show a fallback message to the user
            if (hCaptchaDiv) {
                hCaptchaDiv.innerHTML = '<div style="color:red;">Error loading CAPTCHA. Please refresh the page.</div>';
            }
        }
    }
    
    /**
     * Callback for when CAPTCHA is verified
     * @param token - The verification token
     */
    onVerify(token: string): void {
        // Basic token validation
        if (!token || token.length < 10) {
            console.error('Invalid token format');
            this.captchaStatus = 'error';
            return;
        }
        
        // Store token
        Storage.store('last_token', token);
        
        this.captchaStatus = 'verified';
        
        // Show success message if Toast is available
        if ((window as any).Toast) {
            const successToast = (window as any).Toast.makeText(
                document.body, 
                'CAPTCHA verification successful', 
                (window as any).Toast.LENGTH_SHORT
            );
            
            successToast.setStyle((window as any).Toast.STYLE_SUCCESS)
                       .setPosition((window as any).Toast.POSITION_BOTTOM_CENTER)
                       .setAnimation((window as any).Toast.WAVE_IN, (window as any).Toast.WAVE_OUT)
                       .show();
        } else {
            console.log('CAPTCHA verification successful');
        }
        
        // Hide the CAPTCHA container
        this.hide();
        
        // Call the callback if provided
        if (typeof this.onCaptchaVerifiedCallback === 'function') {
            this.onCaptchaVerifiedCallback(token);
        }
    }
    
    /**
     * Callback for when CAPTCHA verification expires
     */
    onExpire(): void {
        this.captchaStatus = 'expired';
        
        // Show expiration message if Toast is available
        if ((window as any).Toast) {
            const errorToast = (window as any).Toast.makeText(
                document.body, 
                'CAPTCHA verification expired, please verify again', 
                (window as any).Toast.LENGTH_SHORT
            );
            
            errorToast.setStyle((window as any).Toast.STYLE_WARNING)
                     .setPosition((window as any).Toast.POSITION_BOTTOM_CENTER)
                     .show();
        } else {
            console.log('CAPTCHA verification expired, please verify again');
        }
        
        // Show the CAPTCHA again
        this.show();
        
        // Log expiration
        Storage.store('captcha_expired', new Date().toISOString());
    }
    
    /**
     * Callback for when CAPTCHA encounters an error
     * @param err - The error object
     */
    onError(err: Error): void {
        console.error('CAPTCHA error:', err);
        this.captchaStatus = 'error';
        
        // Show error message if Toast is available
        if ((window as any).Toast) {
            const errorToast = (window as any).Toast.makeText(
                document.body, 
                'CAPTCHA verification failed, please try again', 
                (window as any).Toast.LENGTH_SHORT
            );
            
            errorToast.setStyle((window as any).Toast.STYLE_ERROR)
                     .setPosition((window as any).Toast.POSITION_BOTTOM_CENTER)
                     .show();
        } else {
            console.log('CAPTCHA verification failed, please try again');
        }
        
        // Reset the CAPTCHA
        this.reset();
        
        // Log error
        Storage.store('captcha_error', JSON.stringify({
            message: err.message,
            time: new Date().toISOString()
        }));
    }
    
    /**
     * Check if CAPTCHA is verified
     * @returns Whether CAPTCHA is verified
     */
    isVerified(): boolean {
        return this.captchaStatus === 'verified';
    }
}

