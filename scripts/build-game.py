#!/usr/bin/env python3
"""Assemble validated editable sources into one self-contained public HTML."""
from pathlib import Path
from datetime import date
import re
ROOT = Path(__file__).resolve().parents[1]
INCLUDE = re.compile(r'\{\{include:([^}]+)\}\}')

def parse_release(text):
    lines=text.splitlines()
    if len(lines)!=2 or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)+',lines[0]):
        raise ValueError('Expected an ASCII dotted version and YYYY-MM-DD date on two lines')
    if not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}',lines[1]):
        raise ValueError('Expected canonical YYYY-MM-DD date')
    date.fromisoformat(lines[1])
    return lines

def release(root):
    return parse_release((root/'VERSION.txt').read_text(encoding='utf-8'))

def render(root=ROOT, metadata=None):
    source = (root / 'src').resolve()
    version, day = metadata or release(root)
    template = (source / 'index.template.html').read_text(encoding='utf-8')
    included = set();contents=[template]
    def include(match):
        relative = match[1]
        path = (source / relative).resolve()
        if not path.is_relative_to(source) or path.suffix not in {'.js', '.css'}:
            raise ValueError('Invalid source include: ' + relative)
        if path in included:
            raise ValueError('Duplicate source include: ' + relative)
        included.add(path)
        if not path.is_file():
            raise ValueError('Missing source include: ' + relative)
        content=path.read_text(encoding='utf-8');contents.append(content)
        return content
    html = INCLUDE.sub(include, template)
    orphaned = sorted(str(p.relative_to(source)) for p in source.rglob('*')
                      if p.suffix in {'.js', '.css'} and p.resolve() not in included)
    if orphaned:
        raise ValueError('Sources missing from template: ' + ', '.join(orphaned))
    for name in ['VERSION','BUILD_DATE']:
        placeholder='{{'+name+'}}'
        if sum(content.count(placeholder) for content in contents)!=1:
            raise ValueError('Exactly one '+placeholder+' placeholder is required')
    html = html.replace('{{VERSION}}', version).replace('{{BUILD_DATE}}', day)
    if re.search(r'\{\{[^{}]*\}\}', html):
        raise ValueError('Unresolved template placeholder')
    return html

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', required=True, help='Read-only comparison; generate through update.py prepare')
    args = parser.parse_args()
    try:
        html = render()
        target = ROOT / 'index.html'
        if target.read_text(encoding='utf-8') != html:
            raise ValueError('index.html differs from src; run python3 scripts/update.py prepare')
        print('Game source build: ok')
    except (ValueError, OSError) as error:
        parser.exit(1, str(error) + '\n')
