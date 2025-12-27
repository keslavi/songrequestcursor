
# Word Document Converter Script
# Recursively converts Word documents while maintaining folder structure

param(
    [string]$sourceRoot = "C:\Users\msdn\Dropbox\UnrealBook-doc",
    [string]$targetRoot = "C:\Users\msdn\Dropbox\OnSong"
)
cls
# Function to create directory if it doesn't exist
function Ensure-Directory {
    param([string]$path)
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "Created directory: $path"
    }
}

# Function to convert Word document to PDF
function Convert-WordToPdf {
    param(
        [string]$sourceFile,
        [string]$targetFile
    )
    
    try {
        # Create Word application object
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $word.DisplayAlerts = 0
        
        # Open the document
        $doc = $word.Documents.Open($sourceFile)
        
        # Ensure target directory exists
        $targetDir = Split-Path $targetFile -Parent
        Ensure-Directory $targetDir
        
        # Save as PDF
        $doc.SaveAs([ref]$targetFile, [ref]17) # 17 = PDF format
        
        # Close document and quit Word
        $doc.Close()
        $word.Quit()
        
        # Clean up COM objects
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
        
        Write-Host "Converted: $sourceFile -> $targetFile"
        return $true
    }
    catch {
        Write-Error "Error converting $sourceFile : $($_.Exception.Message)"
        return $false
    }
}

# Function to process directory recursively
function Process-Directory {
    param(
        [string]$sourceDir,
        [string]$targetDir
    )
    
    # Ensure target directory exists
    Ensure-Directory $targetDir
    
    # Get all files in current directory
    $files = Get-ChildItem -Path $sourceDir -File
    
    foreach ($file in $files) {
        # Check if it's a Word document
        if ($file.Extension -match "\.(doc|docx)$") {
            $relativePath = $file.FullName.Substring($sourceRoot.Length).TrimStart('\')
            $targetFile = Join-Path $targetRoot ($relativePath -replace "\.(doc|docx)$", ".pdf")
            
            Convert-WordToPdf -sourceFile $file.FullName -targetFile $targetFile
        }
    }
    
    # Process subdirectories
    $subdirs = Get-ChildItem -Path $sourceDir -Directory
    foreach ($subdir in $subdirs) {
        $newSourceDir = $subdir.FullName
        $newTargetDir = Join-Path $targetDir $subdir.Name
        Process-Directory -sourceDir $newSourceDir -targetDir $newTargetDir
    }
}

# Main execution
try {
    Write-Host "Starting Word document conversion..."
    Write-Host "Source: $sourceRoot"
    Write-Host "Target: $targetRoot"
    Write-Host ""
    
    # Verify source directory exists
    if (!(Test-Path $sourceRoot)) {
        throw "Source directory does not exist: $sourceRoot"
    }
    
    # Ensure target root directory exists
    Ensure-Directory $targetRoot
    
    # Start recursive processing
    Process-Directory -sourceDir $sourceRoot -targetDir $targetRoot
    
    Write-Host ""
    Write-Host "Conversion completed successfully!"
}
catch {
    Write-Error "Script failed: $($_.Exception.Message)"
    exit 1
}
finally {
    # Final cleanup
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
} 