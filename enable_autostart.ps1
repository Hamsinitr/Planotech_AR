$WshShell = New-Object -comObject WScript.Shell
$StartupPath = [System.Environment]::GetFolderPath('Startup')
$ProjectDir = $PSScriptRoot
if (-not $ProjectDir) {
    $ProjectDir = "c:\Users\hamsi\OneDrive\Desktop\Planotech_AR"
}

$iconPath = Join-Path $ProjectDir "app.ico"
$launchScript = Join-Path $ProjectDir "launch.py"

# Locate pythonw.exe
$pyw = (Get-Command pythonw -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
if (-not $pyw) {
    $search = @(
        "$env:LOCALAPPDATA\Programs\Python\Python313\pythonw.exe",
        "$env:ProgramFiles\Python313\pythonw.exe",
        (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source)
    )
    foreach ($s in $search) {
        /cxz 
        if ($s -and (Test-Path $s)) { $pyw = $s; break }
    }
}

$DestinationShortcut = Join-Path $StartupPath "Planotech HR Portal.lnk"
$Shortcut = $WshShell.CreateShortcut($DestinationShortcut)
if ($pyw) {
    $Shortcut.TargetPath = $pyw
    $Shortcut.Arguments = "`"$launchScript`""
}
else {
    $Shortcut.TargetPath = Join-Path $ProjectDir "start.bat"
}
$Shortcut.WorkingDirectory = $ProjectDir
$Shortcut.Description = "Planotech HR & Attendance Portal"

if (Test-Path $iconPath) {
    $Shortcut.IconLocation = "$iconPath,0"
}
$Shortcut.Save()

Write-Output "Successfully configured Planotech HR Portal to autostart silently on system boot: $DestinationShortcut"
