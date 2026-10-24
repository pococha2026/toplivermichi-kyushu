#!/usr/bin/env python3
"""Local update entry point. Never commits or publishes changes."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import argparse, hashlib, importlib.util, json, os, re, shutil, subprocess, sys, time
from urllib.request import Request, urlopen
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = 'https://pococha2026.github.io/toplivermichi-kyushu/'

def load_sync():
    spec = importlib.util.spec_from_file_location('sync_release', ROOT/'scripts/sync-release.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module

def configuration(root=None):
    root=root or ROOT
    config = json.loads((root/'scripts/checks.json').read_text(encoding='utf-8'))
    if not isinstance(config,dict) or not {'always','full','related'}.issubset(config) or set(config)-{'always','full','related','optional'}:
        raise ValueError('checks.json requires always, full and related')
    if not isinstance(config['related'],dict) or not all(isinstance(k,str) and k for k in config['related']):
        raise ValueError('checks.json related must map path prefixes to test lists')
    lists=[config['always'],config['full'],*config['related'].values()]
    if any(not isinstance(group,list) or any(not isinstance(p,str) or not p for p in group) for group in lists):
        raise ValueError('checks.json test groups must be lists of non-empty paths')
    if any(not group for group in lists):
        raise ValueError('checks.json test groups cannot be empty')
    optional=config.get('optional',[])
    if not isinstance(optional,list) or any(not isinstance(p,str) or not p for p in optional):
        raise ValueError('checks.json optional must be a list of test paths')
    if any(path not in config['always']+config['full'] for tests in config['related'].values() for path in tests):
        raise ValueError('Related tests must be included in always or full for CI')
    for path in [p for group in lists for p in group]+optional:
        resolved = (root/path).resolve()
        if not resolved.is_relative_to(root.resolve()) or resolved.suffix not in {'.py','.cjs'} or not resolved.is_file():
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
    revision=subprocess.check_output(['git','rev-parse','--verify','--end-of-options',base+'^{commit}'],cwd=ROOT,stderr=subprocess.PIPE).decode().strip()
    tracked = subprocess.check_output(['git','diff','--no-renames','--name-only','-z',revision,'--'],cwd=ROOT).decode().split('\0')
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
    sync=load_sync()
    with sync.release_lock(ROOT):
        target = ROOT/'VERSION.txt'; original = target.read_bytes()
        old_version, old_day = original.decode().splitlines()
        version, day = version or old_version, day or old_day
        if not all(x.isdecimal() for x in version.split('.')) or len(version.split('.')) < 2:
            raise ValueError('Invalid version')
        if tuple(map(int,version.split('.'))) < tuple(map(int,old_version.split('.'))):
            raise ValueError('Version rollback is not allowed')
        tests=selected_checks(changed_files())
        try:
            target.write_text(version+'\n'+day+'\n',encoding='utf-8')
            sync._validate(ROOT,write=True)
        except BaseException:
            target.write_bytes(original)
            raise
        run_checks(tests=tests)

def doctor(root=None):
    root=root or ROOT
    issues=[]
    for name in ['VERSION.txt','GAME_SPEC.md','README.md','src/index.template.html','scripts/checks.json']:
        if not (root/name).is_file():issues.append({'kind':'missing','path':name})
    version=None
    if (root/'VERSION.txt').is_file():
        try:
            from datetime import date
            lines=(root/'VERSION.txt').read_text(encoding='utf-8').splitlines()
            if len(lines)!=2 or not re.fullmatch(r'[0-9]+(?:\.[0-9]+)+',lines[0]):raise ValueError('Expected version and ISO date')
            date.fromisoformat(lines[1]);version=lines
        except (OSError,ValueError) as error:issues.append({'kind':'invalid_version','detail':str(error)})
    if (root/'scripts/checks.json').is_file():
        try:configuration(root)
        except (OSError,ValueError) as error:issues.append({'kind':'invalid_checks','detail':str(error)})
    manifest=root/'release-manifest.json'
    if manifest.is_file():
        try:
            release=load_sync().read_manifest(manifest)
            if version and (release['version']!=version[0] or release['date']!=version[1]):
                issues.append({'kind':'stale_release','path':'release-manifest.json','action':'Run prepare after editing.'})
            for name,expected in release['files'].items():
                if not (root/name).is_file() or hashlib.sha256((root/name).read_bytes()).hexdigest()!=expected:
                    issues.append({'kind':'stale_output','path':name,'action':'Run prepare after editing.'})
        except (OSError,ValueError) as error:issues.append({'kind':'invalid_manifest','detail':str(error)})
    else:issues.append({'kind':'missing_generated','path':'release-manifest.json','action':'Regenerate with prepare.'})
    lock=root/'.release-update.lock'
    if lock.exists():
        item={'kind':'lock','path':str(lock),'action':'Check the update process before manually resolving this lock; never delete an active lock.'}
        try:
            owner=json.loads(lock.read_text(encoding='utf-8'));item['pid']=owner.get('pid');item['started']=owner.get('started')
        except (OSError,ValueError,AttributeError):item['detail']='Unreadable lock metadata'
        issues.append(item)
    for folder in sorted(root.glob('.release-stage-*')):
        issues.append({'kind':'recovery','path':str(folder),'action':'Inspect old/ backups and restore a consistent release before removing the folder.'})
    return {'status':'blocked' if issues else 'ok','issues':issues,'read_only':True}

def repository_audit(root=None):
    root=root or ROOT
    spec=importlib.util.spec_from_file_location('project_audit',ROOT/'scripts/project-audit.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module.audit(root,configuration(root))

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
    commands.add_parser('audit',help='Read-only audit of local documentation links and registered tests')
    commands.add_parser('doctor',help='Read-only diagnosis of missing inputs, locks and recovery files')
    p = commands.add_parser('verify-public',help='Compare published bytes with local release')
    p.add_argument('--url',default=PUBLIC)
    args = parser.parse_args()
    try:
        if args.action=='prepare':prepare(args.version,args.date)
        elif args.action=='check':run_checks(args.full,args.base)
        elif args.action=='audit':
            result=repository_audit();print(json.dumps(result,ensure_ascii=False,indent=2))
            return 0 if result['status']=='ok' else 1
        elif args.action=='doctor':
            result=doctor();print(json.dumps(result,ensure_ascii=False,indent=2))
            return 0 if result['status']=='ok' else 1
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
