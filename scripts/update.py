#!/usr/bin/env python3
"""Local update entry point. Never commits or publishes changes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse, hashlib, importlib.util, json, os, shutil, subprocess, sys, time
from urllib.request import Request, urlopen
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = 'https://pococha2026.github.io/toplivermichi-kyushu/'

def load_sync():
    spec = importlib.util.spec_from_file_location('sync_release', ROOT/'scripts/sync-release.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module

def configuration():
    config = json.loads((ROOT/'scripts/checks.json').read_text(encoding='utf-8'))
    if not isinstance(config,dict) or set(config)!={'always','full','related'}:
        raise ValueError('checks.json requires always, full and related')
    if not isinstance(config['related'],dict) or not all(isinstance(k,str) and k for k in config['related']):
        raise ValueError('checks.json related must map path prefixes to test lists')
    lists=[config['always'],config['full'],*config['related'].values()]
    if any(not isinstance(group,list) or any(not isinstance(p,str) or not p for p in group) for group in lists):
        raise ValueError('checks.json test groups must be lists of non-empty paths')
    if any(not group for group in lists):
        raise ValueError('checks.json test groups cannot be empty')
    for path in [p for group in lists for p in group]:
        resolved = (ROOT/path).resolve()
        if not resolved.is_relative_to(ROOT) or resolved.suffix not in {'.py','.cjs'} or not resolved.is_file():
            raise ValueError('Missing/invalid check: '+path)
    return config

def selected_checks(changed, full=False):
    config = configuration()
    tests = list(config['always'])
    if full:
        tests += config['full']
    else:
        for path in changed:
            matched=False
            for prefix, related in config['related'].items():
                if path == prefix or (prefix.endswith('/') and path.startswith(prefix)):
                    tests += related;matched=True
            if path.startswith('src/') and not matched:
                tests += config['full']
    return list(dict.fromkeys(tests))

def changed_files(base='HEAD'):
    tracked = subprocess.check_output(['git','diff','--name-only','-z',base,'--'],cwd=ROOT).decode().split('\0')
    untracked = subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
    return sorted(set(filter(None,tracked+untracked)))

def run_checks(full=False, base='HEAD', tests=None):
    load_sync().validate(ROOT)
    if tests is None:tests = selected_checks([] if full else changed_files(base), full)
    node = os.environ.get('CODEX_PRIMARY_RUNTIME_NODE') or shutil.which('node')
    for path in tests:
        executable = sys.executable if path.endswith('.py') else node
        if not executable:
            raise ValueError('Node.js is required')
        print('CHECK '+path,flush=True)
        subprocess.run([executable,str(ROOT/path)],cwd=ROOT,check=True)
    print(f'OK: {len(tests)} check programs; device rendering/touch not verified',flush=True)

def prepare(version=None, day=None):
    target = ROOT/'VERSION.txt'; original = target.read_bytes()
    old_version, old_day = original.decode().splitlines()
    version, day = version or old_version, day or old_day
    # Reject accidental rollback. Re-running the same version is permitted.
    if not all(x.isdecimal() for x in version.split('.')) or len(version.split('.')) < 2:
        raise ValueError('Invalid version')
    if tuple(map(int,version.split('.'))) < tuple(map(int,old_version.split('.'))):
        raise ValueError('Version rollback is not allowed')
    tests=selected_checks(changed_files())
    try:
        target.write_text(version+'\n'+day+'\n',encoding='utf-8')
        load_sync().validate(ROOT,write=True)
    except Exception:
        target.write_bytes(original)
        raise
    run_checks(tests=tests)

def verify_public(root=ROOT, base=PUBLIC, opener=urlopen):
    manifest = json.loads((root/'release-manifest.json').read_text(encoding='utf-8'))
    expected = dict(manifest['files'])
    expected['release-manifest.json'] = hashlib.sha256((root/'release-manifest.json').read_bytes()).hexdigest()
    def verify(item):
        name, sha = item
        request = Request(base.rstrip('/')+'/'+name+'?v='+manifest['version']+'&verify='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
        try:
            with opener(request,timeout=30) as response:
                actual = hashlib.sha256(response.read()).hexdigest()
            return {'file':name,'match':actual==sha}
        except Exception as error:
            return {'file':name,'match':False,'error':str(error)}
    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(verify,expected.items()))
    return results

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='action',required=True)
    p = commands.add_parser('prepare',help='Generate release and run relevant checks')
    p.add_argument('--version');p.add_argument('--date')
    p = commands.add_parser('check',help='Read-only release and regression checks')
    p.add_argument('--full',action='store_true');p.add_argument('--base',default='HEAD')
    p = commands.add_parser('plan',help='Show changed files and relevant checks')
    p.add_argument('--base',default='HEAD')
    p = commands.add_parser('verify-public',help='Compare published bytes with local release')
    p.add_argument('--url',default=PUBLIC)
    args = parser.parse_args()
    try:
        if args.action=='prepare':prepare(args.version,args.date)
        elif args.action=='check':run_checks(args.full,args.base)
        elif args.action=='plan':
            changed=changed_files(args.base)
            print(json.dumps({'changed':changed,'checks':selected_checks(changed)},ensure_ascii=False,indent=2))
        else:
            # Reject locally stale artifacts before consulting the public website.
            load_sync().validate(ROOT)
            results=verify_public(base=args.url)
            print(json.dumps(results,ensure_ascii=False,indent=2))
            return 0 if all(r['match'] for r in results) else 1
    except (OSError,ValueError,subprocess.CalledProcessError) as error:
        print('Update failed: '+str(error)+(('\n'+error.stderr) if isinstance(error,subprocess.CalledProcessError) and error.stderr else ''),file=sys.stderr);return 1
    return 0
if __name__=='__main__':raise SystemExit(main())
