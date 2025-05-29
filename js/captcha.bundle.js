
/**
 * 2PartsCut - Secure TypeScript Implementation
 * This code is protected by multiple layers of encryption
 * Any attempt to reverse engineer or tamper with this code is strictly prohibited
 * 
 * Security ID: RVNfZGQ1NDI5NzQ0YWYzNGYwMzkzYmRkYmMzYjNmNDQ5MWE=
 */
// typescript/captcha/hcaptcha.sitekey.ts
var HCaptchaKeyManager = class _HCaptchaKeyManager {
  // Private constructor to enforce singleton pattern
  constructor() {
    // The site key is public and used in the frontend
    // This is the key that goes into the data-sitekey attribute in HTML
    this.siteKey = "006abb56-ec16-427e-bfec-3f06f8ae5a1a";
  }
  // Get the singleton instance
  static getInstance() {
    if (!_HCaptchaKeyManager.instance) {
      _HCaptchaKeyManager.instance = new _HCaptchaKeyManager();
    }
    return _HCaptchaKeyManager.instance;
  }
  // Get the site key - this is safe to expose in frontend code
  getSiteKey() {
    return this.siteKey;
  }
};

// typescript/captcha/handler.ts
var Storage = class {
  static store(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Error storing data:", e);
    }
  }
  static retrieve(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (e) {
      console.error("Error retrieving data:", e);
      return "";
    }
  }
};
var CaptchaHandler = class {
  constructor() {
    this.widgetId = null;
    this.captchaContainer = document.getElementById("captcha-container");
    this.captchaWidgetContainer = document.getElementById("h-captcha-widget-container");
    this.captchaStatus = "pending";
    this.onCaptchaVerifiedCallback = null;
    this.siteKey = HCaptchaKeyManager.getInstance().getSiteKey();
    if (this.captchaContainer) {
      this.captchaContainer.style.display = "none";
    }
  }
  /**
   * Initialize the CAPTCHA
   * @param callback - Function to call when CAPTCHA is verified
   */
  init(callback) {
    this.onCaptchaVerifiedCallback = callback;
    if (this.captchaWidgetContainer) {
      this.captchaWidgetContainer.style.display = "flex";
    }
    window.hcaptchaCallback = (token) => {
      this.onVerify(token);
    };
  }
  /**
   * Show the CAPTCHA directly in the widget container above the button
   */
  show() {
    if (!this.captchaWidgetContainer) return;
    this.captchaWidgetContainer.style.display = "flex";
    if (window.hcaptcha) {
      if (this.widgetId) {
        window.hcaptcha.reset(this.widgetId);
      } else {
        this.renderCaptcha();
      }
    } else {
      this.renderCaptcha();
    }
  }
  /**
   * Hide the CAPTCHA widget
   */
  hide() {
    if (this.captchaWidgetContainer) {
      this.captchaWidgetContainer.style.display = "none";
    }
    if (this.captchaContainer) {
      this.captchaContainer.style.display = "none";
    }
  }
  /**
   * Reset the CAPTCHA
   */
  reset() {
    this.captchaStatus = "pending";
    if (window.hcaptcha && this.widgetId) {
      window.hcaptcha.reset(this.widgetId);
    }
  }
  /**
   * Render the hCaptcha widget using the proper API with explicit rendering
   * Following the official hCaptcha documentation
   * @private
   */
  renderCaptcha() {
    try {
      if (!window.hcaptcha) {
        console.warn("hCaptcha script not loaded yet");
        setTimeout(() => this.renderCaptcha(), 1e3);
        return;
      }
      const hCaptchaDiv = document.querySelector(".h-captcha");
      if (!hCaptchaDiv) {
        console.error("Cannot find .h-captcha element");
        return;
      }
      const widgetId = window.hcaptcha.render(hCaptchaDiv, {
        sitekey: this.siteKey,
        theme: "light",
        size: "normal",
        callback: (token) => {
          this.onVerify(token);
        },
        "expired-callback": () => this.onExpire(),
        "error-callback": (err) => this.onError(err),
        "close-callback": () => {
          console.log("CAPTCHA was closed without verification");
        }
      });
      const widgetIdString = widgetId.toString();
      this.widgetId = widgetIdString;
      Storage.store("widget_id", widgetIdString);
    } catch (error) {
      console.error("Error rendering hCaptcha widget:", error);
      const hCaptchaDiv = document.querySelector(".h-captcha");
      if (hCaptchaDiv) {
        hCaptchaDiv.innerHTML = '<div style="color:red;">Error loading CAPTCHA. Please refresh the page.</div>';
      }
    }
  }
  /**
   * Callback for when CAPTCHA is verified
   * @param token - The verification token
   */
  onVerify(token) {
    if (!token || token.length < 10) {
      console.error("Invalid token format");
      this.captchaStatus = "error";
      return;
    }
    Storage.store("last_token", token);
    this.captchaStatus = "verified";
    if (window.Toast) {
      const successToast = window.Toast.makeText(
        document.body,
        "CAPTCHA verification successful",
        window.Toast.LENGTH_SHORT
      );
      successToast.setStyle(window.Toast.STYLE_SUCCESS).setPosition(window.Toast.POSITION_BOTTOM_CENTER).setAnimation(window.Toast.WAVE_IN, window.Toast.WAVE_OUT).show();
    } else {
      console.log("CAPTCHA verification successful");
    }
    this.hide();
    if (typeof this.onCaptchaVerifiedCallback === "function") {
      this.onCaptchaVerifiedCallback(token);
    }
  }
  /**
   * Callback for when CAPTCHA verification expires
   */
  onExpire() {
    this.captchaStatus = "expired";
    if (window.Toast) {
      const errorToast = window.Toast.makeText(
        document.body,
        "CAPTCHA verification expired, please verify again",
        window.Toast.LENGTH_SHORT
      );
      errorToast.setStyle(window.Toast.STYLE_WARNING).setPosition(window.Toast.POSITION_BOTTOM_CENTER).show();
    } else {
      console.log("CAPTCHA verification expired, please verify again");
    }
    this.show();
    Storage.store("captcha_expired", (/* @__PURE__ */ new Date()).toISOString());
  }
  /**
   * Callback for when CAPTCHA encounters an error
   * @param err - The error object
   */
  onError(err) {
    console.error("CAPTCHA error:", err);
    this.captchaStatus = "error";
    if (window.Toast) {
      const errorToast = window.Toast.makeText(
        document.body,
        "CAPTCHA verification failed, please try again",
        window.Toast.LENGTH_SHORT
      );
      errorToast.setStyle(window.Toast.STYLE_ERROR).setPosition(window.Toast.POSITION_BOTTOM_CENTER).show();
    } else {
      console.log("CAPTCHA verification failed, please try again");
    }
    this.reset();
    Storage.store("captcha_error", JSON.stringify({
      message: err.message,
      time: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  /**
   * Check if CAPTCHA is verified
   * @returns Whether CAPTCHA is verified
   */
  isVerified() {
    return this.captchaStatus === "verified";
  }
};

// typescript/captcha/index.ts
var keyManager = HCaptchaKeyManager.getInstance();
console.log("Using hCaptcha site key:", keyManager.getSiteKey());
window.captchaHandler = new CaptchaHandler();
window.captchaHandler.init((token) => {
  console.log("CAPTCHA verified with token:", token.substring(0, 10) + "...");
  const processBtn = document.getElementById("processBtn");
  if (processBtn && typeof window.processVideo === "function") {
    window.processVideo();
  }
});
window.onCaptchaVerify = (token) => {
  if (window.captchaHandler) {
    window.captchaHandler.onVerify(token);
  }
};
window.onCaptchaExpire = () => {
  if (window.captchaHandler) {
    window.captchaHandler.onExpire();
  }
};
window.onCaptchaError = (err) => {
  if (window.captchaHandler) {
    window.captchaHandler.onError(err);
  }
};
var index_default = CaptchaHandler;
export {
  HCaptchaKeyManager,
  index_default as default
};
