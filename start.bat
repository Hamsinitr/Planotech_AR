@echo off
:: Hontime – Silent Launcher
:: Runs launch.py with pythonw.exe so zero CMD windows appear in the taskbar.
:: Double-click this file or pin the shortcut created by create_shortcut.ps1

set "SCRIPT_DIR=%~dp0"
set "LAUNCH=%SCRIPT_DIR%launch.py"

:: Try pythonw first (no console window at all)
where pythonw >nul 2>&1
if %ERRORLEVEL%==0 (
    start "" pythonw "%LAUNCH%"
    goto :eof
)

:: Fallback: python via vbscript trick to hide the window
set "VBS=%TEMP%\hontime_launch.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS%"
echo WshShell.Run "python ""%LAUNCH%""", 0, False >> "%VBS%"
wscript //nologo "%VBS%"
