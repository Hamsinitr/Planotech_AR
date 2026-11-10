# install_shortcut.ps1
# Double-click this file (or right-click -> Run with PowerShell) to place
# the Planotech AR shortcut on your Desktop.

$project  = Split-Path -Parent $MyInvocation.MyCommand.Path
$launchPy = Join-Path $project "launch.py"
$iconFile  = Join-Path $project "app.ico"

# Find pythonw.exe
$pythonw = $null
$candidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python313\pythonw.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\pythonw.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\pythonw.exe",
    "C:\Python313\pythonw.exe",
    "C:\Python312\pythonw.exe"
)
foreach ($c in $candidates) {
    if (Test-Path $c) { $pythonw = $c; break }
}
if (-not $pythonw) {
    $pythonw = (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
    if (-not $pythonw) { Write-Error "Python not found"; exit 1 }
}

# Desktop path
$desktop = [Environment]::GetFolderPath("Desktop")
if (-not $desktop -or -not (Test-Path $desktop)) {
    $desktop = "$env:USERPROFILE\OneDrive\Desktop"
}

$lnkPath = Join-Path $desktop "Planotech AR.lnk"

$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut($lnkPath)
$sc.TargetPath       = $pythonw
$sc.Arguments        = "`"$launchPy`""
$sc.WorkingDirectory = $project
$sc.Description      = "Planotech AR - HR Intelligence Platform"
if (Test-Path $iconFile) { $sc.IconLocation = $iconFile }
$sc.WindowStyle = 7   # minimized = starts with no visible window
$sc.Save()

Write-Host ""
Write-Host "  ✅  Shortcut installed!" -ForegroundColor Green
Write-Host "  📍  $lnkPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Double-click 'Planotech AR' on your Desktop to launch the app." -ForegroundColor White
Read-Host "  Press Enter to close"

