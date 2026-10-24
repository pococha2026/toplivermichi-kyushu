#!/usr/bin/env python3
"""Generate release companions or reject a stale/mismatched game/spec bundle."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, uuid
from contextlib import contextmanager
ROOT=Path(__file__).resolve().parents[1]
def digest(data): return hashlib.sha256(data).hexdigest()
def game_body(html):
 html=re.sub(r'window.TLR_BUILD="[0-9-]+";', 'window.TLR_BUILD="DATE";',html)
 return re.sub(r'const GAME_VERSION = "[0-9.]+";', 'const GAME_VERSION = "RELEASE";',html)
def spec_body(spec):return re.sub(r'^改訂 v[0-9.]+｜[0-9]+年[0-9]+月[0-9]+日｜', '改訂 RELEASE｜DATE｜',spec,flags=re.M)
def planned(root):
 lines=(root/'VERSION.txt').read_text(encoding='utf-8').splitlines()
 if len(lines)!=2 or not re.fullmatch(r'\d+\.\d+(?:\.\d+)*',lines[0]):raise ValueError('VERSION.txt: expected version and date')
 from datetime import date
 date.fromisoformat(lines[1]);version,day=lines
 if (root/'src').exists():
  if not (root/'src/index.template.html').is_file():raise ValueError('Missing source template: src/index.template.html')
  import importlib.util
  module_spec=importlib.util.spec_from_file_location('build_game',ROOT/'scripts/build-game.py')
  builder=importlib.util.module_from_spec(module_spec);module_spec.loader.exec_module(builder)
  game=builder.render(root)
 else:
  game=(root/'index.html').read_text(encoding='utf-8')
 spec=(root/'GAME_SPEC.md').read_text(encoding='utf-8');readme=(root/'README.md').read_text(encoding='utf-8')
 if len(re.findall(r'const GAME_VERSION = "[0-9.]+";',game))!=1:raise ValueError('GAME_VERSION must be unique')
 game=re.sub(r'const GAME_VERSION = "[0-9.]+";',f'const GAME_VERSION = "{version}";',game)
 spec,n=re.subn(r'^改訂 v[0-9.]+｜',f'改訂 v{version}｜',spec,count=1,flags=re.M)
 if n!=1:raise ValueError('spec revision header missing')
 y,m,d=day.split('-')
 spec,n=re.subn(r'^(改訂 v[0-9.]+｜)[0-9]+年[0-9]+月[0-9]+日｜',rf'\g<1>{y}年{int(m)}月{int(d)}日｜',spec,count=1,flags=re.M)
 if n!=1:raise ValueError('spec date header missing')
 readme,n=re.subn(r'^(# .*?（公開版 v)[0-9.]+(）)$',rf'\g<1>{version}\2',readme,count=1,flags=re.M)
 if n!=1:raise ValueError('README release header missing')
 txt=re.sub(r'^#{1,6} ', '', spec,flags=re.M)
 files={'index.html':game.encode(),'GAME_SPEC.md':spec.encode(),'GAME_SPEC.txt':txt.encode(),'README.md':readme.encode(),'VERSION.txt':(version+'\n'+day+'\n').encode()}
 manifest={'version':version,'date':day,'files':{k:digest(v) for k,v in sorted(files.items())},'game_logic_sha256':digest(game_body(game).encode()),'spec_content_sha256':digest(spec_body(spec).encode())}
 return files,manifest

def read_manifest(path):
 previous=json.loads(path.read_text(encoding='utf-8'))
 expected={'index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt'}
 if not isinstance(previous,dict) or not isinstance(previous.get('files'),dict) or set(previous['files'])!=expected:
  raise ValueError('Invalid release manifest: expected the complete file hash mapping')
 hashes=[*previous['files'].values(),previous.get('game_logic_sha256')]
 if 'spec_content_sha256' in previous:hashes.append(previous['spec_content_sha256'])
 if any(not isinstance(h,str) or not re.fullmatch('[0-9a-f]{64}',h) for h in hashes):
  raise ValueError('Invalid release manifest: malformed SHA-256')
 if not isinstance(previous.get('version'),str) or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)+',previous['version']):
  raise ValueError('Invalid release manifest version')
 from datetime import date
 if not isinstance(previous.get('date'),str):raise ValueError('Invalid release manifest date')
 date.fromisoformat(previous['date'])
 return previous

@contextmanager
def release_lock(root):
 path=root/'.release-update.lock';token=uuid.uuid4().hex
 try:fd=os.open(path,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
 except FileExistsError:raise ValueError(f'Release locked: {path}; run update.py doctor and resolve the existing update first') from None
 try:
  with os.fdopen(fd,'w',encoding='utf-8') as stream:
   json.dump({'pid':os.getpid(),'started':time.time(),'token':token},stream);stream.flush()
  pending=list(root.glob('.release-stage-*'))
  if pending:raise ValueError('Unresolved recovery files: '+', '.join(str(p) for p in pending)+'; run update.py doctor')
  yield
 finally:
  # Never remove a lock that was replaced by another process or operator.
  if path.exists():
   try:owner=json.loads(path.read_text(encoding='utf-8')).get('token')
   except (OSError,ValueError,AttributeError):owner=None
   if owner==token:path.unlink()

def validate(root,write=False):
 if not write:return _validate(root,False)
 with release_lock(root):return _validate(root,True)

def _validate(root,write=False):
 files,manifest=planned(root);mp=root/'release-manifest.json'
 if write and mp.exists():
  previous=read_manifest(mp)
  raw_spec=(root/'GAME_SPEC.md').read_bytes()
  same_spec=(previous['spec_content_sha256']==manifest['spec_content_sha256']) if 'spec_content_sha256' in previous else (previous.get('files',{}).get('GAME_SPEC.md')==digest(raw_spec))
  if previous.get('game_logic_sha256')!=manifest['game_logic_sha256'] and same_spec:
   raise ValueError('Game code changed without a specification update')
 files['release-manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
 node=os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
 if not node:raise ValueError('Node.js is required for script syntax checks')
 scripts=re.findall(r'<script\b[^>]*>(.*?)</script>',files['index.html'].decode(),re.S|re.I)
 if not scripts:raise ValueError('No inline game scripts found')
 for body in scripts:
  with tempfile.TemporaryDirectory() as folder:
   path=Path(folder)/'syntax-check.js'
   path.write_text(body,encoding='utf-8')
   subprocess.run([node,'--check',str(path)],check=True,capture_output=True,text=True)
 if write:
  write_bundle(root,files)
 else:
  stale=[name for name,content in files.items() if not (root/name).exists() or (root/name).read_bytes()!=content]
  if stale:raise ValueError('Out-of-sync release files: '+', '.join(stale))
 return manifest

def write_bundle(root,files):
 """Stage on the same filesystem; restore replaced outputs on an I/O exception."""
 folder=Path(tempfile.mkdtemp(prefix='.release-stage-',dir=root));replaced=[];keep=False
 try:
  (folder/'new').mkdir();(folder/'old').mkdir()
  for name,content in files.items():
   (folder/'new'/name).write_bytes(content)
   if (root/name).exists():shutil.copy2(root/name,folder/'old'/name)
  for name in files:
   os.replace(folder/'new'/name,root/name);replaced.append(name)
 except BaseException as original:
  errors=[]
  for name in reversed(replaced):
   try:
    if (folder/'old'/name).exists():os.replace(folder/'old'/name,root/name)
    else:(root/name).unlink(missing_ok=True)
   except BaseException as error:errors.append(type(error).__name__+': '+str(error))
  if errors:
   keep=True
   raise OSError(f'{original}; rollback incomplete; recovery files: {folder}; '+ '; '.join(errors)) from original
  raise
 finally:
  if not keep:shutil.rmtree(folder,ignore_errors=True)

def main():
 parser=argparse.ArgumentParser();g=parser.add_mutually_exclusive_group(required=True);g.add_argument('--write',action='store_true');g.add_argument('--check',action='store_true');args=parser.parse_args()
 try:
  manifest=validate(ROOT,args.write)
  print(json.dumps({'status':'ok','version':manifest['version'],'files':list(manifest['files']),'mode':'write' if args.write else 'check'},ensure_ascii=False))
 except (OSError,ValueError,subprocess.CalledProcessError) as e:
  print('Release sync failed: '+str(e)+(('\n'+e.stderr) if isinstance(e,subprocess.CalledProcessError) and e.stderr else ''),file=sys.stderr);return 1
 return 0
if __name__=='__main__':raise SystemExit(main())
