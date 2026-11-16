$project  = 'c:\Users\hamsi\OneDrive\Desktop\Planotech_AR'
$launchPy = Join-Path $project 'launch.py'
$iconFile  = Join-Path $project 'app.ico'
$pythonw   = 'C:\Users\hamsi\AppData\Local\Programs\Python\Python313\pythonw.exe'
$desktop   = 'C:\Users\hamsi\OneDrive\Desktop'

# Remove ALL old shortcuts (Planotech or Hontime)
Get-ChildItem $desktop -Filter '*.lnk' | Where-Object { $_.Name -match 'Planotech|Hontime' } | Remove-Item -Force -ErrorAction SilentlyContinue

# Create clean new shortcut named Hontime
$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut((Join-Path $desktop 'Hontime.lnk'))
$sc.TargetPath       = $pythonw
$sc.Arguments        = ('"' + $launchPy + '"')
$sc.WorkingDirectory = $project
$sc.Description      = 'Hontime - Attendance & Operations Platform'
$sc.IconLocation     = $iconFile
$sc.WindowStyle      = 7
$sc.Save()
Write-Host 'Hontime shortcut created'

ie4uinit.exe -ClearIconCache
