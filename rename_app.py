"""
rename_app.py – Renames the app from Planotech to Hontime across all source files.
Run from project root: python rename_app.py
"""
import os, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

EXTENSIONS = {'.jsx', '.js', '.ts', '.tsx', '.html', '.json', '.py',
              '.md', '.bat', '.ps1', '.css', '.yaml', '.yml', '.txt', '.cfg'}

SKIP_DIRS = {'node_modules', '.git', '__pycache__', '.pytest_cache', 'dist'}

REPLACEMENTS = [
    # Keep order: most specific first
    ('PLANOTECH AR',               'HONTIME'),
    ('Planotech AR',               'Hontime'),
    ('planotech AR',               'Hontime'),
    ('PLANOTECH_AR',               'HONTIME'),
    ('Planotech_AR',               'Hontime'),
    ('planotech_ar',               'hontime'),
    ('PLANOTECH HR INTELLIGENCE',  'HONTIME HR INTELLIGENCE'),
    ('Planotech HR Intelligence',  'Hontime HR Intelligence'),
    ('PLANOTECH HR PORTAL',        'HONTIME PORTAL'),
    ('Planotech HR Portal',        'Hontime Portal'),
    ('Planotech HR & Attendance Portal', 'Hontime'),
    ('PLANOTECH PORTAL',           'HONTIME PORTAL'),
    ('Planotech Portal',           'Hontime Portal'),
    ('PLANOTECH',                  'HONTIME'),
    ('Planotech',                  'Hontime'),
    ('planotech',                  'hontime'),
    # Email domains
    ('admin@planotech.com',        'admin@hontime.com'),
    ('viewer@planotech.com',       'viewer@hontime.com'),
    ('@planotech.com',             '@hontime.com'),
    ('planotech.com',              'hontime.com'),
]

changed_files = []

for path in ROOT.rglob('*'):
    if path.is_dir():
        continue
    # Skip excluded directories
    if any(skip in path.parts for skip in SKIP_DIRS):
        continue
    if path.suffix.lower() not in EXTENSIONS:
        continue
    # Skip this script itself
    if path.name == 'rename_app.py':
        continue

    try:
        original = path.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        print(f"  SKIP (read error): {path.relative_to(ROOT)} — {e}")
        continue

    text = original
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)

    if text != original:
        path.write_text(text, encoding='utf-8')
        changed_files.append(str(path.relative_to(ROOT)))
        print(f"  ✅ {path.relative_to(ROOT)}")

print(f"\nDone — {len(changed_files)} files updated")
