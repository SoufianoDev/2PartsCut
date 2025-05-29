// Browser compatibility check for 2PartsCut
(function() {
    // Check if browser supports required features
    function checkBrowserCompatibility() {
        // Check for WebAssembly support
        if (typeof WebAssembly === 'undefined') {
            return {
                compatible: false,
                reason: 'WebAssembly is not supported in your browser. Please use a modern browser like Chrome, Firefox, Edge, or Safari.'
            };
        }
        
        // Check for SharedArrayBuffer support (needed for multi-threaded WASM)
        if (typeof SharedArrayBuffer === 'undefined') {
            return {
                compatible: true,
                warning: 'Your browser may have limited performance with large videos. For best results, use Chrome or Edge.'
            };
        }
        
        // Check for cross-origin isolation (needed for SharedArrayBuffer in modern browsers)
        if (window.crossOriginIsolated !== true && typeof SharedArrayBuffer !== 'undefined') {
            return {
                compatible: true,
                warning: 'For optimal performance, this site should be served with COOP/COEP headers.'
            };
        }
        
        return { compatible: true };
    }
    
    // Run the check when the page loads
    window.addEventListener('DOMContentLoaded', function() {
        const result = checkBrowserCompatibility();
        
        if (!result.compatible) {
            // Show error for incompatible browsers
            const errorToast = Toast.makeText(document.body, result.reason, Toast.LENGTH_LONG);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_CENTER)
                      .setDismissible(true)
                      .show();
                      
            // Disable the upload area
            const dropArea = document.getElementById('dropArea');
            if (dropArea) {
                dropArea.style.opacity = '0.5';
                dropArea.style.pointerEvents = 'none';
                
                const warningMsg = document.createElement('div');
                warningMsg.className = 'browser-warning';
                warningMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + result.reason;
                dropArea.parentNode.insertBefore(warningMsg, dropArea);
            }
        } else if (result.warning) {
            // Show warning for partially compatible browsers
            setTimeout(function() {
                const warnToast = Toast.makeText(document.body, result.warning, Toast.LENGTH_SHORT);
                warnToast.setStyle('warning')
                        .setPosition(Toast.POSITION_BOTTOM_CENTER)
                        .show();
            }, 2000);
        }
    });
})();
