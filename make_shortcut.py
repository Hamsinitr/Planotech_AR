"""
make_shortcut.py – Creates Hontime desktop shortcut using PowerShell IWshRuntimeLibrary
Works even on OneDrive Desktop by writing to a temp path then copying.
"""
import os, shutil, subprocess, sys, tempfile
from pathlib import Path

project = Path(__file__).resolve().parent
pythonw  = project / "pythonw_finder.txt"

# Find pythonw.exe
py = Path(sys.executable)
pythonw_path = py.parent / "pythonw.exe"
if not pythonw_path.exists():
    pythonw_path = py  # fallback to python.exe

icon_path = project / "app.ico"
launch_py  = project / "launch.py"

# Candidate desktop paths
desktops = [
    os.path.expandvars(r"%USERPROFILE%\OneDrive\Desktop"),
    os.path.expandvars(r"%USERPROFILE%\Desktop"),
    os.path.expanduser("~/Desktop"),
]

desktop = None
for d in desktops:
    if d and os.path.isdir(d):
        desktop = d
        break

if not desktop:
    print("ERROR: could not find Desktop folder")
    sys.exit(1)

shortcut_name = "Hontime.lnk"
# Write to a temp location first, then copy to desktop
tmp_dir = Path(tempfile.mkdtemp())
tmp_lnk = tmp_dir / shortcut_name
dest_lnk = Path(desktop) / shortcut_name

ps_script = f"""
$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut('{str(tmp_lnk).replace(chr(92), "/")}')
$sc.TargetPath       = '{str(pythonw_path).replace(chr(92), "/")}'
$sc.Arguments        = '"{str(launch_py).replace(chr(92), "/")}"'
$sc.WorkingDirectory = '{str(project).replace(chr(92), "/")}'
$sc.Description      = 'Hontime - Attendance & Operations Platform'
$sc.IconLocation     = '{str(icon_path).replace(chr(92), "/")}' 
$sc.WindowStyle      = 7
$sc.Save()
Write-Host 'saved'
"""

tmp_ps = tmp_dir / "make.ps1"
tmp_ps.write_text(ps_script, encoding="utf-8")

result = subprocess.run(
    ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(tmp_ps)],
    capture_output=True, text=True
)
print("PS stdout:", result.stdout.strip())
print("PS stderr:", result.stderr.strip())

if tmp_lnk.exists():
    shutil.copy2(str(tmp_lnk), str(dest_lnk))
    print(f"✅ Shortcut saved: {dest_lnk}")
else:
    print("❌ Shortcut file not created by PowerShell")

shutil.rmtree(str(tmp_dir), ignore_errors=True)

