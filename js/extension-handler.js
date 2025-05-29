/**
 * Extension Message Handler
 * 
 * This script handles Chrome extension message errors by providing
 * a global message listener that responds to extension messages.
 * This prevents "Unchecked runtime.lastError" console errors.
 */

(function() {
    // Only run in Chrome browsers with extension support
    if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
        try {
            // Add a global message listener that always responds
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                // Log the request for debugging (optional)
                console.debug('Received extension message:', request);
                
                // Always send a response to prevent "message port closed" errors
                sendResponse({
                    status: 'success',
                    message: '2PartsCut application acknowledged message'
                });
                
                // Return true to indicate we'll respond asynchronously
                return true;
            });
            
            console.info('Extension message handler initialized');
        } catch (e) {
            // Silently fail if we can't access chrome APIs
            console.debug('Extension handler not initialized:', e.message);
        }
    }
})();
