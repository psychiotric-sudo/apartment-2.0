$rootPath = "C:\Users\ADMIN\Documents"

Write-Host "Scanning files in $rootPath" -ForegroundColor Cyan

# Get all files
$files = Get-ChildItem -Path $rootPath -Recurse -File -ErrorAction SilentlyContinue
$totalFiles = $files.Count
$counter = 0

# Store hashes
$hashTable = @{}
$duplicates = @() # Will hold arrays of duplicates

foreach ($file in $files) {
    $counter++
    
    Write-Progress -Activity "Scanning files" -Status "Processing $($file.FullName)" -PercentComplete (($counter / $totalFiles) * 100)
    Write-Host "Scanning: $($file.FullName)"

    try {
        $hash = Get-FileHash -Path $file.FullName -Algorithm SHA256
    } catch {
        Write-Host "Skipped (access denied): $($file.FullName)" -ForegroundColor Yellow
        continue
    }

    if ($hashTable.ContainsKey($hash.Hash)) {
        # Store both original and duplicate in a list
        $original = $hashTable[$hash.Hash]
        $duplicates += ,@($original, $file.FullName)
    } else {
        $hashTable[$hash.Hash] = $file.FullName
    }
}

Write-Progress -Activity "Scanning files" -Completed
Write-Host "`nScan complete." -ForegroundColor Cyan

if ($duplicates.Count -eq 0) {
    Write-Host "No duplicates found." -ForegroundColor Green
    exit
}

# Remove exact duplicate entries (keep unique sets)
$uniqueDuplicates = @()
foreach ($pair in $duplicates) {
    if (-not ($uniqueDuplicates -contains $pair)) {
        $uniqueDuplicates += ,$pair
    }
}

# Display duplicates numbered
Write-Host "`nDuplicates found:`n"
$dupIndex = 1
$dupMap = @{} # Map number to path

foreach ($pair in $uniqueDuplicates) {
    foreach ($file in $pair) {
        Write-Host "[$dupIndex] $file"
        $dupMap[$dupIndex] = $file
        $dupIndex++
    }
    Write-Host "" # Empty line between sets
}

# Ask user what to delete
$deleteChoice = Read-Host "Delete duplicates? Enter 'all' or comma-separated numbers"

if ($deleteChoice -eq "all") {
    foreach ($file in $dupMap.Values) {
        try {
            Remove-Item -Path $file -Force
            Write-Host "Deleted: $file" -ForegroundColor Green
        } catch {
            Write-Host "Failed to delete: $file" -ForegroundColor Yellow
        }
    }
} else {
    $numbers = $deleteChoice -split "," | ForEach-Object { $_.Trim() }
    foreach ($num in $numbers) {
        if ($dupMap.ContainsKey([int]$num)) {
            $file = $dupMap[[int]$num]
            try {
                Remove-Item -Path $file -Force
                Write-Host "Deleted: $file" -ForegroundColor Green
            } catch {
                Write-Host "Failed to delete: $file" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host "`nDuplicate deletion complete."