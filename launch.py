"""
Hontime – Silent Desktop Launcher
--------------------------------------
Starts the FastAPI backend silently (zero CMD windows in taskbar)
then opens the app in Edge / Chrome standalone App Mode.

Usage:
  pythonw launch.py      ← zero windows, recommended
  python   launch.py     ← same behaviour, one brief flash then gone
"""

import os
import sys
import time
import socket
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

# Windows flag: CREATE_NO_WINDOW – child process gets no console window at all
CREATE_NO_WINDOW = 0x08000000


def is_port_open(port: int) -> bool:
    """Returns True if something is already listening on the given TCP port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        try:
            return s.connect_ex(("127.0.0.1", port)) == 0
        except Exception:
            return False


def find_python() -> str:
    """
    Returns the path to python.exe (not pythonw.exe) so uvicorn can run.
    pythonw.exe has no stdout/stderr which breaks uvicorn's logging.
    We use CREATE_NO_WINDOW instead to stay silent.
    """
    # Prefer the python.exe sitting next to pythonw.exe (same install)
    base = Path(sys.executable)
    for name in ("python.exe", "python3.exe"):
        candidate = base.parent / name
        if candidate.is_file():
            return str(candidate)
    return str(sys.executable)  # fallback


def find_browser() -> str | None:
    """Locates Edge or Chrome for --app standalone mode."""
    candidates = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


def start_backend(port: int) -> None:
    """Launch uvicorn silently with no console window."""
    python = find_python()
    cmd = [
        python, "-m", "uvicorn",
        "app.main:app",
        "--host", "127.0.0.1",
        "--port", str(port),
        "--log-level", "error",   # minimize output
    ]

    kwargs = dict(
        cwd=str(BACKEND_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
    )

    if sys.platform == "win32":
        kwargs["creationflags"] = CREATE_NO_WINDOW

    subprocess.Popen(cmd, **kwargs)


def open_app(url: str) -> None:
    """Open the app in standalone window (no browser chrome)."""
    browser = find_browser()
    if browser:
        flags = {}
        if sys.platform == "win32":
            flags["creationflags"] = CREATE_NO_WINDOW
        subprocess.Popen(
            [browser, f"--app={url}", "--window-size=1400,900"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            **flags,
        )
    else:
        import webbrowser
        webbrowser.open(url)


def main() -> None:
    port = 8000
    app_url = f"http://localhost:{port}"

    # Start backend only if not already running
    if not is_port_open(port):
        start_backend(port)

        # Wait up to 8 s for the server to become ready
        deadline = time.time() + 8.0
        while time.time() < deadline:
            if is_port_open(port):
                break
            time.sleep(0.25)

    open_app(app_url)


if __name__ == "__main__":
    main()
