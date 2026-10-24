#!/usr/bin/env python3
"""Generate release companions or reject a stale/mismatched game/spec bundle."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile
ROOT=Path(__file__).resolve().parents[1]
def digest(data): return hashlib.sha256(data).hexdigest()
def game_body(html): return re.sub(r'const GAME_VERSION = "[0-9.]+";', 'const GAME_VERSION = "RELEASE";',html)
def planned(root):
 lines=(root/'VERSION.txt').read_text().splitlines()
 if len(lines)!=2 or not re.fullmatch(r'\d+\.\d+(?:\.\d+)*',lines[0]):raise ValueError('VERSION.txt: expected version and date')
 from datetime import date
 date.fromisoformat(lines[1]);version,day=lines
 game=(root/'index.html').read_text()
 if (root/'src/index.template.html').exists():
  import importlib.util
  module_spec=importlib.util.spec_from_file_location('build_game',ROOT/'scripts/build-game.py')
  builder=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(builder)
  game=builder.render(root)
 spec=(root/'GAME_SPEC.md').read_text();readme=(root/'README.md').read_text()
 if len(re.findall(r'const GAME_VERSION = "[0-9.]+";',game))!=1:raise ValueError('GAME_VERSION must be unique')
 game=re.sub(r'const GAME_VERSION = "[0-9.]+";',f'const GAME_VERSION = "{version}";',game)
 spec,n=re.subn(r'^改訂 v[0-9.]+｜',f'改訂 v{version}｜',spec,count=1,flags=re.M)
 if n!=1:raise ValueError('spec revision header missing')
 readme,n=re.subn(r'^(# .*?（公開版 v)[0-9.]+(）)$',rf'\g<1>{version}\2',readme,count=1,flags=re.M)
 if n!=1:raise ValueError('README release header missing')
 txt=re.sub(r'^#{1,6} ', '', spec,flags=re.M)
 files={'index.html':game.encode(),'GAME_SPEC.md':spec.encode(),'GAME_SPEC.txt':txt.encode(),'README.md':readme.encode(),'VERSION.txt':(version+'\n'+day+'\n').encode()}
 manifest={'version':version,'date':day,'files':{k:digest(v) for k,v in sorted(files.items())},'game_logic_sha256':digest(game_body(game).encode())}
 return files,manifest

def validate(root,write=False):
 files,manifest=planned(root);mp=root/'release-manifest.json'
 if write and mp.exists():
  previous=json.loads(mp.read_text())
  if previous.get('game_logic_sha256')!=manifest['game_logic_sha256'] and previous.get('files',{}).get('GAME_SPEC.md')==manifest['files']['GAME_SPEC.md']:
   raise ValueError('Game code changed without a specification update')
 files['release-manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
 if write:
  for name,content in files.items():(root/name).write_bytes(content)
 else:
  stale=[name for name,content in files.items() if not (root/name).exists() or (root/name).read_bytes()!=content]
  if stale:raise ValueError('Out-of-sync release files: '+', '.join(stale))
 node=os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
 if not node:raise ValueError('Node.js is required for script syntax checks')
 scripts=re.findall(r'<script\b[^>]*>(.*?)</script>',files['index.html'].decode(),re.S|re.I)
 if not scripts:raise ValueError('No inline game scripts found')
 for body in scripts:
  with tempfile.NamedTemporaryFile(suffix='.js',mode='w',encoding='utf-8') as f:
   f.write(body);f.flush();subprocess.run([node,'--check',f.name],check=True,capture_output=True,text=True)
 return manifest

def main():
 parser=argparse.ArgumentParser();g=parser.add_mutually_exclusive_group(required=True);g.add_argument('--write',action='store_true');g.add_argument('--check',action='store_true');args=parser.parse_args()
 try:
  # Validate script syntax before writing any release output.
  if args.write:
   staged,man=planned(ROOT)
   with tempfile.TemporaryDirectory() as d:
    temp=Path(d)
    for k,v in staged.items():(temp/k).write_bytes(v)
    (temp/'release-manifest.json').write_text(json.dumps(man,ensure_ascii=False,indent=2)+'\n')
    validate(temp)
  manifest=validate(ROOT,args.write)
  print(json.dumps({'status':'ok','version':manifest['version'],'files':list(manifest['files']),'mode':'write' if args.write else 'check'},ensure_ascii=False))
 except (OSError,ValueError,subprocess.CalledProcessError) as e:
  print('Release sync failed: '+str(e),file=sys.stderr);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
