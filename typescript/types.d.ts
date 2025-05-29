/**
 * Type declarations for 2PartsCut application
 * Provides type safety for the application
 */

// hCaptcha global type definitions
interface HCaptcha {
  render(container: HTMLElement | string, params: HCaptchaParams): void;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
  execute(widgetId?: string, options?: {async: boolean}): Promise<string> | void;
}

interface HCaptchaParams {
  sitekey: string;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  tabindex?: number;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: (error: Error) => void;
  'chalexpired-callback'?: () => void;
  'open-callback'?: () => void;
  'close-callback'?: () => void;
}

// Toast notification system
interface Toast {
  makeText(parent: HTMLElement, message: string, duration: number): ToastInstance;
  STYLE_INFO: string;
  STYLE_SUCCESS: string;
  STYLE_WARNING: string;
  STYLE_ERROR: string;
  LENGTH_SHORT: number;
  LENGTH_LONG: number;
  POSITION_TOP_LEFT: string;
  POSITION_TOP_CENTER: string;
  POSITION_TOP_RIGHT: string;
  POSITION_BOTTOM_LEFT: string;
  POSITION_BOTTOM_CENTER: string;
  POSITION_BOTTOM_RIGHT: string;
  WAVE_IN: string;
  WAVE_OUT: string;
}

interface ToastInstance {
  setStyle(style: string): ToastInstance;
  setPosition(position: string): ToastInstance;
  setAnimation(inAnimation: string, outAnimation: string): ToastInstance;
  show(): void;
  hide(): void;
}

// Security types for encryption
interface IEncryptionService {
  encrypt(data: string): string;
  decrypt(encrypted: string): string;
}

// Secure storage interface
interface ISecureStorage {
  store(key: string, value: string): void;
  retrieve(key: string): string | null;
  clear(key: string): void;
}

// CAPTCHA handler interface
interface ICaptchaHandler {
  init(callback: (token: string) => void): void;
  show(): void;
  hide(): void;
  reset(): void;
  onVerify(token: string): void;
  onExpire(): void;
  onError(err: Error): void;
  isVerified(): boolean;
}

// Global window extensions
interface Window {
  hcaptcha: HCaptcha;
  Toast: Toast;
  captchaHandler: ICaptchaHandler;
  onCaptchaVerify: (token: string) => void;
  onCaptchaExpire: () => void;
  onCaptchaError: (err: Error) => void;
}
