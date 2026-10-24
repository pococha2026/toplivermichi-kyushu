#!/usr/bin/env python3
"""Build one self-contained public HTML from ordered editable sources."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
def render(root=ROOT):
 source = root / 'src'
 version = (root / 'VERSION.txt').read_text().splitlines()[0]
 def include(match):
  path = (source / match[1]).resolve()
  if not path.is_relative_to(source.resolve()):
   raise ValueError('Source include escapes src: ' + match[1])
  return path.read_text()
 html = re.sub(r'\{\{include:([^}]+)\}\}', include, (source / 'index.template.html').read_text())
 return html.replace('{{VERSION}}', version)
if __name__ == '__main__':
 import argparse
 parser = argparse.ArgumentParser()
 parser.add_argument('--check', action='store_true')
 args = parser.parse_args()
 html = render()
 target = ROOT / 'index.html'
 if args.check:
  if target.read_text() != html:
   raise SystemExit('index.html differs from src; run python3 scripts/sync-release.py --write')
 else:
  target.write_text(html)
 print('Game source build: ok')
