# create_shortcut.ps1
# Creates a Hontime shortcut on the Desktop that launches silently
# (no CMD window, no terminal in taskbar) using pythonw.exe

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launchScript = Join-Path $projectDir "launch.py"
$iconFile = Join-Path $projectDir "app.ico"

# Find pythonw.exe
$pythonw = $null
$candidates = @(
    (Get-Command pythonw -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
    "$env:LOCALAPPDATA\Programs\Python\Python313\pythonw.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\pythonw.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\pythonw.exe",
    "C:\Python313\pythonw.exe",
    "C:\Python312\pythonw.exe"
)
foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { $pythonw = $c; break }
}
if (-not $pythonw) {
    Write-Host "pythonw.exe not found – shortcut will use python.exe via VBScript wrapper" -ForegroundColor Yellow
}

# Determine desktop path (works for both local and OneDrive desktops)
$desktopPaths = @(
    [Environment]::GetFolderPath("Desktop"),
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\OneDrive\Desktop"
)
$desktop = $null
foreach ($p in $desktopPaths) {
    if ($p -and (Test-Path $p)) { $desktop = $p; break }
}
if (-not $desktop) { $desktop = "$env:USERPROFILE\Desktop" }

$shortcutPath = Join-Path $desktop "Hontime.lnk"

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)

if ($pythonw) {
    $shortcut.TargetPath  = $pythonw
    $shortcut.Arguments   = "`"$launchScript`""
} else {
    # Fallback: wrap with wscript to hide the window
    $vbs = Join-Path $projectDir "launch_hidden.vbs"
    @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "python ""$($launchScript.Replace('\','\\'))""", 0, False
"@ | Set-Content $vbs
    $shortcut.TargetPath = "wscript.exe"
    $shortcut.Arguments  = "//nologo `"$vbs`""
}

$shortcut.WorkingDirectory = $projectDir
$shortcut.Description      = "Hontime – Attendance & Operations Platform"
if (Test-Path $iconFile) { $shortcut.IconLocation = $iconFile }
$shortcut.WindowStyle = 7  # 7 = minimized (keeps shortcut launch invisible)
$shortcut.Save()

Write-Host "✅ Shortcut created: $shortcutPath" -ForegroundColor Green
Write-Host "   Target : $($shortcut.TargetPath)" -ForegroundColor Cyan
Write-Host "   Icon   : $iconFile" -ForegroundColor Cyan
