/**
 * 2PartsCut - A professional video splitting application
 * Efficiently splits videos in half with proper memory management
 */

/**
 * VideoSplitter class - Main application controller
 * Handles all video processing, UI interactions, and memory management
 */
class App {
    // Constants
    static MAX_FILE_SIZE = 2000; // Max file size in MB
    
    /**
     * Constructor - Initialize the application
     */
    constructor() {
        // Video processing state
        this.selectedFile = null;
        this.ffmpeg = null;
        this.part1Url = null;
        this.part2Url = null;
        this.videoMetadata = {
            duration: 0,
            fileSize: 0
        };
        
        // Reference to external CAPTCHA handler
        this.captchaHandler = null;
        
        // FFmpeg functions
        this.createFFmpeg = null;
        this.fetchFile = null;
        
        // DOM Elements
        this.dropArea = document.getElementById('dropArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.fileDuration = document.getElementById('fileDuration');
        this.processBtn = document.getElementById('processBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.progressSection = document.getElementById('progress');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('results');
        this.video1 = document.getElementById('video1');
        this.video2 = document.getElementById('video2');
        this.download1Btn = document.getElementById('download1');
        this.download2Btn = document.getElementById('download2');
        this.downloadZipBtn = document.getElementById('downloadZip');
        this.newFileBtn = document.getElementById('newFile');
        
        // Initialize FFmpeg functions
        this.initFFmpegFunctions();
        
        // Bind methods to this instance to maintain proper 'this' context
        this.handleDrop = this.handleDrop.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.processVideo = this.processVideo.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.resetApp = this.resetApp.bind(this);
        this.downloadPart = this.downloadPart.bind(this);
        this.downloadZip = this.downloadZip.bind(this);
        
        // Initialize the application when DOM is ready
        document.addEventListener('DOMContentLoaded', () => this.init());
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // First check for required browser features
            if (!this.isSharedArrayBufferAvailable() || !this.isCrossOriginIsolated()) {
                throw new Error(
                    !this.isSharedArrayBufferAvailable() 
                        ? 'SharedArrayBuffer is not available in your browser.' 
                        : 'Cross-Origin Isolation is not enabled.'
                );
            }
            
            // Get reference to CAPTCHA handler (loaded from TypeScript module)
            this.captchaHandler = window.captchaHandler;
            
            // Initialize CAPTCHA handler if available
            if (this.captchaHandler) {
                this.captchaHandler.init((token) => {
                    console.log('CAPTCHA verified successfully with token:', token.substring(0, 10) + '...');
                });
            }
            
            if (!this.createFFmpeg) {
                // Try loading FFmpeg from global object if not already defined
                if (window.FFmpeg) {
                    this.createFFmpeg = window.FFmpeg.createFFmpeg;
                    this.fetchFile = window.FFmpeg.fetchFile;
                } else {
                    throw new Error('FFmpeg module not available');
                }
            }
            
            // Create FFmpeg instance with multiple CDN fallbacks
            const cdnOptions = [
                'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
                'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg-core/0.11.0/ffmpeg-core.js'
            ];
            
            // Try the first CDN
            this.ffmpeg = this.createFFmpeg({
                log: true,
                corePath: cdnOptions[0],
                logger: (message) => {
                    // Only log errors to console
                    if (typeof message === 'string' && message.includes('error')) {
                        console.error('FFmpeg:', message);
                    }
                },
                progress: (progress) => {
                    // Optional progress tracking
                    console.log('FFmpeg progress:', progress);
                }
            });
            
            // Pre-load FFmpeg to avoid issues later
            console.log('Loading FFmpeg...');
            
            try {
                await this.ffmpeg.load();
            } catch (loadError) {
                console.warn('Failed to load FFmpeg from primary CDN, trying fallbacks...');
                
                // Try fallback CDNs if the first one fails
                for (let i = 1; i < cdnOptions.length; i++) {
                    try {
                        this.ffmpeg = this.createFFmpeg({
                            log: true,
                            corePath: cdnOptions[i],
                            logger: () => {}, // Suppress verbose logging
                        });
                        await this.ffmpeg.load();
                        console.log(`FFmpeg loaded successfully from fallback CDN ${i}`);
                        break;
                    } catch (fallbackError) {
                        if (i === cdnOptions.length - 1) {
                            throw new Error('All FFmpeg CDN fallbacks failed');
                        }
                    }
                }
            }
            
            // Show a welcome toast
            const welcomeToast = Toast.makeText(document.body, 'Welcome to 2PartsCut! Ready to split some videos?', Toast.LENGTH_SHORT);
            welcomeToast.setStyle(Toast.STYLE_SUCCESS)
                        .setPosition(Toast.POSITION_TOP_CENTER)
                        .setAnimation(Toast.SLIDE_IN_TOP_CENTER, Toast.SLIDE_OUT_TOP_CENTER)
                        .show();
            
            console.log('FFmpeg web assembly loaded successfully');
            
            // Setup event listeners
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Error loading FFmpeg:', error);
            
            // Show a more detailed error message based on the specific error
            let errorMessage = 'Failed to load video processing tools. ';
            
            if (!this.isSharedArrayBufferAvailable()) {
                errorMessage += 'Your browser does not support SharedArrayBuffer. Try using Chrome, Edge, or Firefox.';
            } else if (!this.isCrossOriginIsolated()) {
                errorMessage += 'Cross-Origin Isolation is not enabled. This is required for video processing.';
            } else {
                errorMessage += 'Please try refreshing the page or using a different browser.';
            }
            
            const errorToast = Toast.makeText(document.body, errorMessage, Toast.LENGTH_LONG);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .setDismissible(true)
                      .show();
                      
            // Update UI to show compatibility error
            if (this.dropArea) {
                this.dropArea.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Browser Compatibility Issue</h3>
                    <p>${errorMessage}</p>
                    <p>For best results, use Chrome, Edge, or Firefox and ensure you're accessing this site with HTTPS.</p>
                `;
            }
        }
    }
    
    /**
     * Initialize FFmpeg functions from global scope
     */
    initFFmpegFunctions() {
        try {
            // Try to get from the global FFmpeg object
            this.createFFmpeg = window.FFmpeg?.createFFmpeg;
            this.fetchFile = window.FFmpeg?.fetchFile;
            
            // If not available, try to access them directly (some CDNs expose them globally)
            if (!this.createFFmpeg && typeof window.createFFmpeg === 'function') {
                this.createFFmpeg = window.createFFmpeg;
            }
            if (!this.fetchFile && typeof window.fetchFile === 'function') {
                this.fetchFile = window.fetchFile;
            }
        } catch (e) {
            console.error('Error accessing FFmpeg functions:', e);
        }
    }
    
    /**
     * Check if SharedArrayBuffer is available (required for FFmpeg WASM)
     * @returns {boolean} Whether SharedArrayBuffer is available
     */
    isSharedArrayBufferAvailable() {
        return typeof SharedArrayBuffer !== 'undefined';
    }
    
    /**
     * Check if the page is cross-origin isolated (required for SharedArrayBuffer)
     * @returns {boolean} Whether the page is cross-origin isolated
     */
    isCrossOriginIsolated() {
        return window.crossOriginIsolated === true;
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // File drop area
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.highlight.bind(this), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.unhighlight.bind(this), false);
        });
        
        this.dropArea.addEventListener('drop', this.handleDrop, false);
        this.dropArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect);
        
        // Buttons
        this.processBtn.addEventListener('click', this.processVideo);
        this.cancelBtn.addEventListener('click', this.resetForm);
        this.download1Btn.addEventListener('click', () => this.downloadPart(1));
        this.download2Btn.addEventListener('click', () => this.downloadPart(2));
        this.downloadZipBtn.addEventListener('click', this.downloadZip);
        this.newFileBtn.addEventListener('click', this.resetApp);
    }
    
    /**
     * Prevent default behaviors for drag and drop
     * @param {Event} e - The event object
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Highlight drop area when dragging over
     */
    highlight() {
        this.dropArea.classList.add('active');
    }
    
    /**
     * Remove highlight when drag leaves
     */
    unhighlight() {
        this.dropArea.classList.remove('active');
    }
    
    /**
     * Handle file drop
     * @param {DragEvent} e - The drag event
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length === 1) {
            this.handleFile(files[0]);
        } else {
            const warnToast = Toast.makeText(document.body, 'Please drop only one video file', Toast.LENGTH_SHORT);
            warnToast.setStyle('warning')
                    .setPosition(Toast.POSITION_TOP_CENTER)
                    .show();
        }
    }
    
    /**
     * Handle file selection from input
     * @param {Event} e - The change event
     */
    handleFileSelect(e) {
        if (e.target.files.length === 1) {
            this.handleFile(e.target.files[0]);
        }
    }

    /**
     * Process the selected file
     * @param {File} file - The file to process
     */
    async handleFile(file) {
        // Check if it's a video file
        if (!file.type.startsWith('video/')) {
            const errorToast = Toast.makeText(document.body, 'Please select a valid video file', Toast.LENGTH_SHORT);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .show();
            return;
        }
        
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > App.MAX_FILE_SIZE) {
            const errorToast = Toast.makeText(document.body, `File size exceeds the ${App.MAX_FILE_SIZE}MB limit`, Toast.LENGTH_SHORT);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .show();
            return;
        }
        
        this.selectedFile = file;
        this.videoMetadata.fileSize = fileSizeMB.toFixed(2);
        
        // Display file info
        this.fileName.textContent = `Name: ${file.name}`;
        this.fileSize.textContent = `Size: ${this.videoMetadata.fileSize} MB`;
        
        try {
            // Get video duration
            this.videoMetadata.duration = await this.getVideoDuration(file);
            const minutes = Math.floor(this.videoMetadata.duration / 60);
            const seconds = Math.floor(this.videoMetadata.duration % 60);
            this.fileDuration.textContent = `Duration: ${minutes}m ${seconds}s`;
            
            // Show file info and buttons
            this.fileInfo.style.display = 'block';
            this.dropArea.style.display = 'none';
        } catch (error) {
            console.error('Error getting video duration:', error);
            const errorToast = Toast.makeText(document.body, 'Could not read video information. Please try another file.', Toast.LENGTH_SHORT);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .show();
        }
    }
    
    /**
     * Get video duration
     * @param {File} file - The video file
     * @returns {Promise<number>} The duration in seconds
     */
    getVideoDuration(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            
            video.onerror = () => {
                reject('Error loading video metadata');
            };
            
            video.src = URL.createObjectURL(file);
        });
    }

    /**
     * Process the video - split it into two equal parts
     */
    async processVideo() {
        try {
            if (!this.selectedFile) {
                throw new Error('No file selected');
            }
            
            // Show CAPTCHA verification before processing
            if (this.captchaHandler && !this.captchaHandler.isVerified()) {
                // Create a toast notification to instruct the user
                const infoToast = Toast.makeText(
                    document.body, 
                    'Please complete the CAPTCHA verification to continue', 
                    Toast.LENGTH_MEDIUM
                );
                
                infoToast.setStyle(Toast.STYLE_INFO)
                        .setPosition(Toast.POSITION_TOP_CENTER)
                        .show();
                
                // Make sure the hCaptcha container is visible
                const hCaptchaContainer = document.getElementById('h-captcha-widget-container');
                if (hCaptchaContainer) {
                    hCaptchaContainer.style.display = 'flex';
                    
                    // Force a reset of the hCaptcha widget to ensure it's visible
                    if (window.hcaptcha) {
                        try {
                            // Try to reset any existing widget
                            window.hcaptcha.reset();
                            console.log('hCaptcha widget reset');
                        } catch (e) {
                            console.log('No existing widget to reset, will be rendered by onLoadHCaptcha');
                        }
                    } else {
                        console.log('hCaptcha not loaded yet, widget will be rendered when script loads');
                    }
                }
                
                // Set up a one-time callback for when CAPTCHA is verified
                return new Promise((resolve) => {
                    const originalCallback = this.captchaHandler.onCaptchaVerifiedCallback;
                    const onVerified = (token) => {
                        // Reset to original callback if it exists
                        if (typeof originalCallback === 'function') {
                            this.captchaHandler.onCaptchaVerifiedCallback = originalCallback;
                        }
                        
                        // Show success message
                        const successToast = Toast.makeText(
                            document.body, 
                            'Verification successful! Starting video processing...', 
                            Toast.LENGTH_SHORT
                        );
                        
                        successToast.setStyle(Toast.STYLE_SUCCESS)
                                .setPosition(Toast.POSITION_TOP_CENTER)
                                .show();
                        
                        // Continue with video processing
                        this.startVideoProcessing().then(resolve).catch(err => {
                            console.error('Error processing video:', err);
                            this.updateProgress(0, 'Error: ' + err.message);
                        });
                    };
                    
                    // Set our custom callback
                    this.captchaHandler.onCaptchaVerifiedCallback = onVerified;
                });
            }
            
            // If CAPTCHA is already verified, proceed with processing
            return this.startVideoProcessing();
        } catch (error) {
            console.error('Error processing video:', error);
            this.updateProgress(0, 'Error: ' + error.message);
        }
    }
    
    /**
     * Start the actual video processing after CAPTCHA verification
     */
    async startVideoProcessing() {
        try {
            if (!this.selectedFile) {
                throw new Error('No file selected');
            }
            
            // Additional security check for the CAPTCHA
            if (this.captchaHandler && !this.captchaHandler.isVerified()) {
                throw new Error('Security verification required before processing');
            }
            
            // Hide file info, show progress
            this.fileInfo.style.display = 'none';
            this.progressSection.style.display = 'block';
            this.updateProgress(0, 'Initializing FFmpeg...');
            
            // Reset CAPTCHA for next use
            if (this.captchaHandler) {
                this.captchaHandler.reset();
            }
            
            // Check if FFmpeg is loaded or needs to be reinitialized
            if (!this.ffmpeg || !this.ffmpeg.isLoaded()) {
                const infoToast = Toast.makeText(document.body, 'Loading video processing tools...', Toast.LENGTH_SHORT);
                infoToast.setStyle('info')
                        .setPosition(Toast.POSITION_TOP_CENTER)
                        .show();
                try {
                    // If ffmpeg instance doesn't exist, create it
                    if (!this.ffmpeg) {
                        if (!this.createFFmpeg) {
                            throw new Error('FFmpeg module not available');
                        }
                        this.ffmpeg = this.createFFmpeg({
                            log: false,
                            corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
                        });
                    }
                    
                    // Try to load FFmpeg
                    await this.ffmpeg.load();
                    console.log('FFmpeg loaded successfully');
                } catch (loadError) {
                    console.error('FFmpeg load error:', loadError);
                    // Show user-friendly error
                    const errorToast = Toast.makeText(document.body, 'Your browser may not be compatible with video processing. Try using Chrome or Edge.', Toast.LENGTH_LONG);
                    errorToast.setStyle(Toast.STYLE_ERROR)
                              .setPosition(Toast.POSITION_TOP_CENTER)
                              .setDismissible(true)
                              .show();
                    throw new Error('Browser not compatible with video processing tools');
                }
            }
            
            // Update UI
            this.updateProgress(10, 'Preparing video...');
            
            // Write the file to FFmpeg's file system
            this.ffmpeg.FS('writeFile', 'input.mp4', await this.fetchFile(this.selectedFile));
            this.updateProgress(30, 'Analyzing video...');
            
            // Calculate the exact middle point for splitting
            const midpoint = this.videoMetadata.duration / 2;
            const midpointFormatted = this.formatTimeForFFmpeg(midpoint);
            
            // Split into first half
            this.updateProgress(40, 'Creating first part...');
            await this.ffmpeg.run(
                '-i', 'input.mp4',
                '-ss', '0',
                '-to', midpointFormatted,
                '-c', 'copy',
                'part1.mp4'
            );
            
            // Split into second half
            this.updateProgress(70, 'Creating second part...');
            await this.ffmpeg.run(
                '-i', 'input.mp4',
                '-ss', midpointFormatted,
                '-c', 'copy',
                'part2.mp4'
            );
            
            // Read the result files
            this.updateProgress(90, 'Finalizing...');
            const part1Data = this.ffmpeg.FS('readFile', 'part1.mp4');
            const part2Data = this.ffmpeg.FS('readFile', 'part2.mp4');
            
            // Create URLs for the video previews with explicit MP4 MIME type
            this.part1Url = URL.createObjectURL(new Blob([part1Data.buffer], { type: 'video/mp4' }));
            this.part2Url = URL.createObjectURL(new Blob([part2Data.buffer], { type: 'video/mp4' }));
            
            // Log the MIME type to ensure it's correct
            console.log('Part 1 MIME type: video/mp4');
            console.log('Part 2 MIME type: video/mp4');
            
            // Set video sources
            this.video1.src = this.part1Url;
            this.video2.src = this.part2Url;
            
            // Clean up FFmpeg filesystem - free memory like C's free()
            this.ffmpeg.FS('unlink', 'input.mp4');
            this.ffmpeg.FS('unlink', 'part1.mp4');
            this.ffmpeg.FS('unlink', 'part2.mp4');
            console.log('FFmpeg temporary files have been freed.');
            
            // Show results
            this.updateProgress(100, 'Complete!');
            setTimeout(() => {
                this.progressSection.style.display = 'none';
                this.resultsSection.style.display = 'block';
                const successToast = Toast.makeText(document.body, 'Video successfully split into two parts!', Toast.LENGTH_SHORT);
                successToast.setStyle(Toast.STYLE_SUCCESS)
                           .setPosition(Toast.POSITION_TOP_CENTER)
                           .setAnimation(Toast.WAVE_IN, Toast.WAVE_OUT)
                           .show();
            }, 500);
            
        } catch (error) {
            console.error('Error processing video:', error);
            this.progressSection.style.display = 'none';
            this.fileInfo.style.display = 'block';
            
            const errorToast = Toast.makeText(document.body, 'Error processing video. Please try again with a different file.', Toast.LENGTH_LONG);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .setDismissible(true)
                      .show();
        }
    }

    /**
     * Format time for FFmpeg (HH:MM:SS.mmm)
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTimeForFFmpeg(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    /**
     * Update progress bar and text
     * @param {number} percent - Progress percentage
     * @param {string} message - Progress message
     */
    updateProgress(percent, message) {
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}% - ${message}`;
    }

    /**
     * Download individual part
     * @param {number} partNum - Part number (1 or 2)
     */
    downloadPart(partNum) {
        const url = partNum === 1 ? this.part1Url : this.part2Url;
        const originalFileName = this.selectedFile.name;
        const extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
        const baseFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFileName}_part${partNum}${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        const infoToast = Toast.makeText(document.body, `Downloading Part ${partNum}...`, Toast.LENGTH_SHORT);
        infoToast.setStyle('info')
                .setPosition(Toast.POSITION_BOTTOM_CENTER)
                .setAnimation(Toast.FADE)
                .show();
    }
    
    /**
     * Download both parts as a ZIP file
     */
    async downloadZip() {
        try {
            const infoToast = Toast.makeText(document.body, 'Preparing ZIP file...', Toast.LENGTH_SHORT);
            infoToast.setStyle('info')
                    .setPosition(Toast.POSITION_BOTTOM_CENTER)
                    .setAnimation(Toast.FADE)
                    .show();
            
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Use the blob data directly from the existing URLs
            // We'll convert the object URLs to blobs without fetching
            const blob1 = await fetch(this.part1Url).then(r => r.blob()).catch(e => {
                console.error('Error fetching part1:', e);
                // Try to get the blob directly if it's an object URL
                return new Promise((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', this.part1Url, true);
                    xhr.responseType = 'blob';
                    xhr.onload = () => resolve(xhr.response);
                    xhr.send();
                });
            });
            
            const blob2 = await fetch(this.part2Url).then(r => r.blob()).catch(e => {
                console.error('Error fetching part2:', e);
                // Try to get the blob directly if it's an object URL
                return new Promise((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', this.part2Url, true);
                    xhr.responseType = 'blob';
                    xhr.onload = () => resolve(xhr.response);
                    xhr.send();
                });
            });
            
            // Get file extension
            const originalFileName = this.selectedFile.name;
            const extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
            const baseFileName = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
            
            // Add files to the zip
            zip.file(`${baseFileName}_part1${extension}`, blob1);
            zip.file(`${baseFileName}_part2${extension}`, blob2);
            
            // Generate the zip file
            const zipContent = await zip.generateAsync({ type: 'blob' });
            
            // Trigger download
            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipContent);
            a.download = `${baseFileName}_split.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            const successToast = Toast.makeText(document.body, 'ZIP file download started', Toast.LENGTH_SHORT);
            successToast.setStyle(Toast.STYLE_SUCCESS)
                       .setPosition(Toast.POSITION_BOTTOM_CENTER)
                       .setAnimation(Toast.WAVE_IN, Toast.WAVE_OUT)
                       .show();
        } catch (error) {
            console.error('Error creating ZIP file:', error);
            const errorToast = Toast.makeText(document.body, 'Failed to create ZIP file', Toast.LENGTH_SHORT);
            errorToast.setStyle(Toast.STYLE_ERROR)
                      .setPosition(Toast.POSITION_TOP_RIGHT)
                      .show();
        }
    }
    
    /**
     * Reset the form
     */
    resetForm() {
        this.selectedFile = null;
        this.fileInfo.style.display = 'none';
        this.dropArea.style.display = 'block';
        this.fileInput.value = '';
    }
    
    /**
     * Reset the entire app for a new file
     * Implements proper FFmpeg memory management like C's free()
     */
    resetApp() {
        // First reset video elements to prevent Invalid URI errors
        this.video1.src = '';
        this.video2.src = '';
        
        // Then revoke object URLs to prevent memory leaks
        if (this.part1Url) {
            URL.revokeObjectURL(this.part1Url);
            this.part1Url = null;
        }
        if (this.part2Url) {
            URL.revokeObjectURL(this.part2Url);
            this.part2Url = null;
        }
        
        // Reset CAPTCHA verification
        if (this.captchaHandler) {
            this.captchaHandler.reset();
        }
        
        // Hide results, show drop area
        this.resultsSection.style.display = 'none';
        this.dropArea.style.display = 'block';
        
        // Reset file input
        this.selectedFile = null;
        this.fileInput.value = '';
        
        // Free FFmpeg memory and files like C's free()
        // Do this last to ensure all references are cleared first
        if (this.ffmpeg) {
            try {
                this.ffmpeg.FS('unlink', 'input.mp4');
            } catch (e) {}
            try {
                this.ffmpeg.FS('unlink', 'part1.mp4');
            } catch (e) {}
            try {
                this.ffmpeg.FS('unlink', 'part2.mp4');
            } catch (e) {}
            if (typeof this.ffmpeg.exit === 'function') {
                this.ffmpeg.exit();
                console.log('FFmpeg memory and files have been freed.');
            }
            this.ffmpeg = null;
        }
    }
}

// Create and initialize the application
const app = new App();
