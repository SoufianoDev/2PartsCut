// Global variables
let selectedFile = null;
let ffmpeg = null;
let part1Url = null;
let part2Url = null;
let videoMetadata = {
    duration: 0,
    fileSize: 0
};

// Get FFmpeg functions safely
let createFFmpeg, fetchFile;
try {
    // Try to get from the global FFmpeg object
    createFFmpeg = window.FFmpeg?.createFFmpeg;
    fetchFile = window.FFmpeg?.fetchFile;
    
    // If not available, try to access them directly (some CDNs expose them globally)
    if (!createFFmpeg && typeof window.createFFmpeg === 'function') {
        createFFmpeg = window.createFFmpeg;
    }
    if (!fetchFile && typeof window.fetchFile === 'function') {
        fetchFile = window.fetchFile;
    }
} catch (e) {
    console.error('Error accessing FFmpeg functions:', e);
}

// Max file size in MB
const MAX_FILE_SIZE = 2000;

// DOM Elements
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileDuration = document.getElementById('fileDuration');
const processBtn = document.getElementById('processBtn');
const cancelBtn = document.getElementById('cancelBtn');
const progressSection = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('results');
const video1 = document.getElementById('video1');
const video2 = document.getElementById('video2');
const download1Btn = document.getElementById('download1');
const download2Btn = document.getElementById('download2');
const downloadZipBtn = document.getElementById('downloadZip');
const newFileBtn = document.getElementById('newFile');

// Initialize FFmpeg when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!createFFmpeg) {
            // Try loading FFmpeg from global object if not already defined
            if (window.FFmpeg) {
                createFFmpeg = window.FFmpeg.createFFmpeg;
                fetchFile = window.FFmpeg.fetchFile;
            } else {
                throw new Error('FFmpeg module not available');
            }
        }
        
        // Create FFmpeg instance
        ffmpeg = createFFmpeg({
            log: true,
            corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
            logger: () => {}, // Suppress verbose logging
            progress: (progress) => {
                // Optional progress tracking
                console.log('FFmpeg progress:', progress);
            }
        });
        
        // Pre-load FFmpeg to avoid issues later
        console.log('Loading FFmpeg...');
        await ffmpeg.load();
        
        // Show a welcome toast
        const welcomeToast = Toast.makeText(document.body, 'Welcome to 2PartsCut! Ready to split some videos?', Toast.LENGTH_SHORT);
        welcomeToast.setStyle(Toast.STYLE_SUCCESS)
                    .setPosition(Toast.POSITION_TOP_CENTER)
                    .setAnimation(Toast.SLIDE_IN_TOP_CENTER, Toast.SLIDE_OUT_TOP_CENTER)
                    .show();
        
        console.log('FFmpeg web assembly loaded');
    } catch (error) {
        console.error('Error loading FFmpeg:', error);
        const errorToast = Toast.makeText(document.body, 'Failed to load video processing tools. Please refresh the page.', Toast.LENGTH_LONG);
        errorToast.setStyle(Toast.STYLE_ERROR)
                  .setPosition(Toast.POSITION_TOP_RIGHT)
                  .setDismissible(true)
                  .show();
    }
});

// Setup event listeners
function setupEventListeners() {
    // File drop area
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Buttons
    processBtn.addEventListener('click', processVideo);
    cancelBtn.addEventListener('click', resetForm);
    download1Btn.addEventListener('click', () => downloadPart(1));
    download2Btn.addEventListener('click', () => downloadPart(2));
    downloadZipBtn.addEventListener('click', downloadZip);
    newFileBtn.addEventListener('click', resetApp);
}

// Prevent default behaviors for drag and drop
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area when dragging over
function highlight() {
    dropArea.classList.add('active');
}

// Remove highlight when drag leaves
function unhighlight() {
    dropArea.classList.remove('active');
}

// Handle file drop
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length === 1) {
        handleFile(files[0]);
    } else {
        const warnToast = Toast.makeText(document.body, 'Please drop only one video file', Toast.LENGTH_SHORT);
        warnToast.setStyle('warning')
                .setPosition(Toast.POSITION_TOP_CENTER)
                .show();
    }
}

// Handle file selection from input
function handleFileSelect(e) {
    if (e.target.files.length === 1) {
        handleFile(e.target.files[0]);
    }
}

// Process the selected file
async function handleFile(file) {
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
    if (fileSizeMB > MAX_FILE_SIZE) {
        const errorToast = Toast.makeText(document.body, `File size exceeds the ${MAX_FILE_SIZE}MB limit`, Toast.LENGTH_SHORT);
        errorToast.setStyle(Toast.STYLE_ERROR)
                  .setPosition(Toast.POSITION_TOP_RIGHT)
                  .show();
        return;
    }
    
    selectedFile = file;
    videoMetadata.fileSize = fileSizeMB.toFixed(2);
    
    // Display file info
    fileName.textContent = `Name: ${file.name}`;
    fileSize.textContent = `Size: ${videoMetadata.fileSize} MB`;
    
    try {
        // Get video duration
        videoMetadata.duration = await getVideoDuration(file);
        const minutes = Math.floor(videoMetadata.duration / 60);
        const seconds = Math.floor(videoMetadata.duration % 60);
        fileDuration.textContent = `Duration: ${minutes}m ${seconds}s`;
        
        // Show file info and buttons
        fileInfo.style.display = 'block';
        dropArea.style.display = 'none';
    } catch (error) {
        console.error('Error getting video duration:', error);
        const errorToast = Toast.makeText(document.body, 'Could not read video information. Please try another file.', Toast.LENGTH_SHORT);
        errorToast.setStyle(Toast.STYLE_ERROR)
                  .setPosition(Toast.POSITION_TOP_RIGHT)
                  .show();
    }
}

// Get video duration
function getVideoDuration(file) {
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

// Process the video
async function processVideo() {
    if (!selectedFile || !ffmpeg) {
        const errorToast = Toast.makeText(document.body, 'No video selected or processing tools not ready', Toast.LENGTH_SHORT);
        errorToast.setStyle(Toast.STYLE_ERROR)
                  .setPosition(Toast.POSITION_TOP_RIGHT)
                  .show();
        return;
    }
    
    // Show progress section
    fileInfo.style.display = 'none';
    progressSection.style.display = 'block';
    
    try {
        // Check if FFmpeg is loaded or needs to be reinitialized
        if (!ffmpeg || !ffmpeg.isLoaded()) {
            const infoToast = Toast.makeText(document.body, 'Loading video processing tools...', Toast.LENGTH_SHORT);
            infoToast.setStyle('info')
                    .setPosition(Toast.POSITION_TOP_CENTER)
                    .show();
            try {
                // If ffmpeg instance doesn't exist, create it
                if (!ffmpeg) {
                    if (!createFFmpeg) {
                        throw new Error('FFmpeg module not available');
                    }
                    ffmpeg = createFFmpeg({
                        log: false,
                        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
                    });
                }
                
                // Try to load FFmpeg
                await ffmpeg.load();
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
        updateProgress(10, 'Preparing video...');
        
        // Write the file to FFmpeg's file system
        ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(selectedFile));
        updateProgress(30, 'Analyzing video...');
        
        // Calculate the exact middle point for splitting
        const midpoint = videoMetadata.duration / 2;
        const midpointFormatted = formatTimeForFFmpeg(midpoint);
        
        // Split into first half
        updateProgress(40, 'Creating first part...');
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-ss', '0',
            '-to', midpointFormatted,
            '-c', 'copy',
            'part1.mp4'
        );
        
        // Split into second half
        updateProgress(70, 'Creating second part...');
        await ffmpeg.run(
            '-i', 'input.mp4',
            '-ss', midpointFormatted,
            '-c', 'copy',
            'part2.mp4'
        );
        
        // Read the result files
        updateProgress(90, 'Finalizing...');
        const part1Data = ffmpeg.FS('readFile', 'part1.mp4');
        const part2Data = ffmpeg.FS('readFile', 'part2.mp4');
        
        // Create URLs for the video previews with explicit MP4 MIME type
        part1Url = URL.createObjectURL(new Blob([part1Data.buffer], { type: 'video/mp4' }));
        part2Url = URL.createObjectURL(new Blob([part2Data.buffer], { type: 'video/mp4' }));
        
        // Log the MIME type to ensure it's correct
        console.log('Part 1 MIME type: video/mp4');
        console.log('Part 2 MIME type: video/mp4');
        
        // Set video sources
        video1.src = part1Url;
        video2.src = part2Url;
        
        // Clean up FFmpeg filesystem
        ffmpeg.FS('unlink', 'input.mp4');
        ffmpeg.FS('unlink', 'part1.mp4');
        ffmpeg.FS('unlink', 'part2.mp4');
        
        // Show results
        updateProgress(100, 'Complete!');
        setTimeout(() => {
            progressSection.style.display = 'none';
            resultsSection.style.display = 'block';
            const successToast = Toast.makeText(document.body, 'Video successfully split into two parts!', Toast.LENGTH_SHORT);
            successToast.setStyle(Toast.STYLE_SUCCESS)
                       .setPosition(Toast.POSITION_TOP_CENTER)
                       .setAnimation(Toast.WAVE_IN, Toast.WAVE_OUT)
                       .show();
        }, 500);
        
    } catch (error) {
        console.error('Error processing video:', error);
        progressSection.style.display = 'none';
        fileInfo.style.display = 'block';
        
        const errorToast = Toast.makeText(document.body, 'Error processing video. Please try again with a different file.', Toast.LENGTH_LONG);
        errorToast.setStyle(Toast.STYLE_ERROR)
                  .setPosition(Toast.POSITION_TOP_RIGHT)
                  .setDismissible(true)
                  .show();
    }
}

// Format time for FFmpeg (HH:MM:SS.mmm)
function formatTimeForFFmpeg(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Update progress bar and text
function updateProgress(percent, message) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}% - ${message}`;
}

// Download individual part
function downloadPart(partNum) {
    const url = partNum === 1 ? part1Url : part2Url;
    const originalFileName = selectedFile.name;
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

// Download both parts as a ZIP file
async function downloadZip() {
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
        const blob1 = await fetch(part1Url).then(r => r.blob()).catch(e => {
            console.error('Error fetching part1:', e);
            // Try to get the blob directly if it's an object URL
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', part1Url, true);
                xhr.responseType = 'blob';
                xhr.onload = () => resolve(xhr.response);
                xhr.send();
            });
        });
        
        const blob2 = await fetch(part2Url).then(r => r.blob()).catch(e => {
            console.error('Error fetching part2:', e);
            // Try to get the blob directly if it's an object URL
            return new Promise((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', part2Url, true);
                xhr.responseType = 'blob';
                xhr.onload = () => resolve(xhr.response);
                xhr.send();
            });
        });
        
        // Get file extension
        const originalFileName = selectedFile.name;
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

// Reset the form
function resetForm() {
    selectedFile = null;
    fileInfo.style.display = 'none';
    dropArea.style.display = 'block';
    fileInput.value = '';
}

// Reset the entire app for a new file
function resetApp() {
    // Revoke object URLs to prevent memory leaks
    if (part1Url) URL.revokeObjectURL(part1Url);
    if (part2Url) URL.revokeObjectURL(part2Url);
    
    part1Url = null;
    part2Url = null;
    
    // Reset video elements
    video1.src = '';
    video2.src = '';
    
    // Hide results, show drop area
    resultsSection.style.display = 'none';
    dropArea.style.display = 'block';
    
    // Reset file input
    selectedFile = null;
    fileInput.value = '';
}

// Initialize the application
setupEventListeners();
