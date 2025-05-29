# PowerShell script to clean up Git repository
# This will remove files from Git tracking without deleting them from disk

# Get list of essential source files to keep
$essentialFiles = @(
    "*.html",
    "*.css",
    "*.js",
    "*.json",
    "*.md",
    "*.svg",
    ".gitignore"
)

# Create a temporary file to store the list of files to keep
$tempFile = "temp-files-to-keep.txt"

# Get all files that match the essential patterns
foreach ($pattern in $essentialFiles) {
    git ls-files $pattern | Out-File -Append -FilePath $tempFile
}

# Get all files currently tracked by Git
$allTrackedFiles = git ls-files

# Find files to remove (all tracked files except essential ones)
$filesToKeep = Get-Content $tempFile
$filesToRemove = $allTrackedFiles | Where-Object { $filesToKeep -notcontains $_ }

# Remove files from Git tracking (but keep them on disk)
foreach ($file in $filesToRemove) {
    git rm --cached "$file"
}

# Clean up temporary file
Remove-Item $tempFile

Write-Host "Git repository cleaned. Files are still on disk but no longer tracked by Git."
Write-Host "Now you can commit the changes with: git commit -m 'Clean up repository'"
