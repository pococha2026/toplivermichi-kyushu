from pathlib import Path
import importlib.util, shutil, subprocess, tempfile, unittest
ROOT=Path(__file__).resolve().parents[1]
def module(name,filename):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/filename)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
build=module('build_game','build-game.py');sync=module('sync_release','sync-release.py');update=module('update','update.py')
class MaintenanceTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
        shutil.copytree(ROOT/'src',self.root/'src')
        for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','VERSION.txt','README.md','release-manifest.json']:
            shutil.copy2(ROOT/name,self.root/name)
    def tearDown(self):self.temp.cleanup()
    def template(self,transform):
        path=self.root/'src/index.template.html';path.write_text(transform(path.read_text()))
    def test_duplicate_include_rejected(self):
        self.template(lambda s:s+'{{include:game/input.js}}')
        with self.assertRaisesRegex(ValueError,'Duplicate'):build.render(self.root)
    def test_missing_include_rejected(self):
        (self.root/'src/game/input.js').unlink()
        with self.assertRaisesRegex(ValueError,'Missing source'):build.render(self.root)
    def test_new_file_not_connected_rejected(self):
        (self.root/'src/game/new.js').write_text('const nextFeature=1;')
        with self.assertRaisesRegex(ValueError,'missing from template'):build.render(self.root)
    def test_path_escape_rejected(self):
        self.template(lambda s:s+'{{include:../outside.js}}')
        with self.assertRaisesRegex(ValueError,'Invalid source'):build.render(self.root)
    def test_unresolved_placeholder_rejected(self):
        self.template(lambda s:s+'{{VERISON}}')
        with self.assertRaisesRegex(ValueError,'Unresolved'):build.render(self.root)
    def test_duplicate_version_placeholder_rejected(self):
        self.template(lambda s:s+'{{VERSION}}')
        with self.assertRaisesRegex(ValueError,'Exactly one'):build.render(self.root)
    def test_release_date_propagates(self):
        (self.root/'VERSION.txt').write_text('99.01\n2027-01-02\n')
        files,manifest=sync.planned(self.root)
        self.assertIn(b'window.TLR_BUILD="2027-01-02"',files['index.html'])
        self.assertIn('改訂 v99.01｜2027年1月2日｜',files['GAME_SPEC.md'].decode())
        self.assertEqual(manifest['date'],'2027-01-02')
    def test_invalid_date_rejected(self):
        (self.root/'VERSION.txt').write_text('99.01\n2027-02-30\n')
        with self.assertRaises(ValueError):build.render(self.root)
    def test_source_change_requires_specification_update(self):
        p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* new display rule */\n')
        with self.assertRaisesRegex(ValueError,'without a specification'):
            sync.validate(self.root,write=True)
    def test_prepare_failure_restores_version(self):
        from unittest.mock import patch
        original=(self.root/'VERSION.txt').read_bytes()
        class BrokenSync:
            parse_release=staticmethod(sync.parse_release)
            write_bundle=staticmethod(sync.write_bundle)
            def release_lock(self,*args):
                from contextlib import nullcontext
                return nullcontext()
            def _validate(self,*args,**kwargs):raise ValueError('generation blocked')
        with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=BrokenSync()),patch.object(update,'changed_files',return_value=[]),patch.object(update,'selected_checks',return_value=[]):
            with self.assertRaisesRegex(ValueError,'generation blocked'):
                update.prepare('99.01','2027-01-02')
        self.assertEqual((self.root/'VERSION.txt').read_bytes(),original)
    def test_prepare_rejects_version_rollback(self):
        from unittest.mock import patch
        original=(self.root/'VERSION.txt').read_bytes()
        with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=sync):
            with self.assertRaisesRegex(ValueError,'rollback'):
                update.prepare('0.01')
        self.assertEqual((self.root/'VERSION.txt').read_bytes(),original)
    def test_syntax_failure_leaves_generated_files_unchanged(self):
        names=['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','release-manifest.json']
        p=self.root/'GAME_SPEC.md';p.write_text(p.read_text()+'\nSyntax failure test\n')
        before={n:(self.root/n).read_bytes() for n in names}
        p=self.root/'src/game/actions.js';p.write_text(p.read_text()+'\nconst = invalid;\n')
        with self.assertRaises(subprocess.CalledProcessError):sync.validate(self.root,write=True)
        self.assertEqual(before,{n:(self.root/n).read_bytes() for n in names})
    def test_related_checks_and_deduplication(self):
        checks=update.selected_checks(['src/game/input.js','src/styles/game.css','src/game/views.js'])
        self.assertIn('scripts/test-retired-map-controls.cjs',checks)
        self.assertIn('scripts/test-mobile-dex.cjs',checks)
        self.assertEqual(len(checks),len(set(checks)))
    def test_full_config_retains_all_existing_game_checks(self):
        checks=update.selected_checks([],True)
        self.assertEqual(set(checks),set(update.configuration()['always']+update.configuration()['full']))
        self.assertGreaterEqual(len(update.configuration()['full']),23)
    def test_public_byte_match_and_mismatch(self):
        class Response:
            def __init__(self,data):self.data=data
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return self.data
        def opener(request,timeout):
            from urllib.parse import urlsplit
            name=urlsplit(request.full_url).path.rsplit('/',1)[-1]
            return Response((self.root/name).read_bytes())
        self.assertTrue(all(r['match'] for r in update.verify_public(self.root,opener=opener)))
        (self.root/'index.html').write_text('stale deployment')
        failed=[r['file'] for r in update.verify_public(self.root,opener=opener) if not r['match']]
        self.assertEqual(failed,['index.html'])
    def test_public_connection_failure_reported(self):
        def broken(*args,**kwargs):raise OSError('offline')
        results=update.verify_public(self.root,opener=broken)
        self.assertTrue(all(not r['match'] and 'offline' in r['error'] for r in results))
if __name__=='__main__':unittest.main(verbosity=2)
