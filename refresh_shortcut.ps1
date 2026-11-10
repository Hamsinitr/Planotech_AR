$project  = 'c:\Users\hamsi\OneDrive\Desktop\Planotech_AR'
$launchPy = Join-Path $project 'launch.py'
$iconFile  = Join-Path $project 'app.ico'
$pythonw   = 'C:\Users\hamsi\AppData\Local\Programs\Python\Python313\pythonw.exe'
$desktop   = 'C:\Users\hamsi\OneDrive\Desktop'

# Remove ALL old Planotech shortcuts
Get-ChildItem $desktop -Filter 'Planotech*.lnk' | Remove-Item -Force -ErrorAction SilentlyContinue

# Create clean new shortcut
$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut((Join-Path $desktop 'Planotech AR.lnk'))
$sc.TargetPath       = $pythonw
$sc.Arguments        = ('"' + $launchPy + '"')
$sc.WorkingDirectory = $project
$sc.Description      = 'Planotech AR - HR Intelligence Platform'
$sc.IconLocation     = $iconFile
$sc.WindowStyle      = 7
$sc.Save()
Write-Host 'Shortcut created successfully'

# Refresh desktop icon cache
ie4uinit.exe -ClearIconCache
