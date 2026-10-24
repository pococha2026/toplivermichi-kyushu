"""Reproduce update failures and protect recovery paths; no browser required."""
from pathlib import Path
import importlib.util,json,re,shutil,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
sync=load('sync_recovery','sync-release.py');update=load('update_recovery','update.py')
class RecoveryTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
        shutil.copytree(ROOT/'src',self.root/'src')
        for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt','release-manifest.json']:
            shutil.copy2(ROOT/name,self.root/name)
    def tearDown(self):self.tmp.cleanup()
    def snapshot(self):
        return {p.name:p.read_bytes() for p in self.root.iterdir() if p.is_file()}
    def change_spec(self):
        p=self.root/'GAME_SPEC.md';p.write_text(p.read_text()+'\nRecovery test change\n',encoding='utf-8')
    def test_missing_generated_html_can_be_rebuilt(self):
        self.change_spec();(self.root/'index.html').unlink()
        sync.validate(self.root,True);sync.validate(self.root)
    def test_deleted_template_is_not_silent_fallback(self):
        (self.root/'src/index.template.html').unlink()
        with self.assertRaisesRegex(ValueError,'template'):sync.planned(self.root)
    def test_version_bump_cannot_bypass_missing_spec_update(self):
        p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* changed behavior */\n')
        (self.root/'VERSION.txt').write_text('99.01\n2026-10-24\n')
        with self.assertRaisesRegex(ValueError,'without a specification'):sync.validate(self.root,True)
    def test_failed_output_replace_restores_entire_bundle(self):
        self.change_spec();before=self.snapshot()
        real_replace=sync.os.replace;calls=0
        def fail_once(src,dst):
            nonlocal calls
            calls+=1
            if calls==3:raise OSError('injected disk failure')
            return real_replace(src,dst)
        with patch.object(sync.os,'replace',side_effect=fail_once):
            with self.assertRaisesRegex(OSError,'injected disk failure'):sync.validate(self.root,True)
        self.assertGreaterEqual(calls,3)
        self.assertEqual(before,self.snapshot())
    def test_all_six_write_boundaries_restore_three_times(self):
        self.change_spec();before=self.snapshot()
        real_replace=sync.os.replace
        for repeat in range(3):
            for fail_at in range(1,7):
                with self.subTest(repeat=repeat,fail_at=fail_at):
                    calls=0
                    def replace(src,dst):
                        nonlocal calls
                        calls+=1
                        if calls==fail_at:raise OSError('boundary failure')
                        return real_replace(src,dst)
                    with patch.object(sync.os,'replace',side_effect=replace):
                        with self.assertRaisesRegex(OSError,'boundary failure'):
                            sync.validate(self.root,True)
                    self.assertEqual(before,self.snapshot())
                    self.assertFalse(list(self.root.glob('.release-stage-*')))
    def test_rollback_failure_preserves_recovery_files(self):
        self.change_spec();real_replace=sync.os.replace;calls=0
        def broken(src,dst):
            nonlocal calls
            calls+=1
            if calls>=3:raise OSError('disk unavailable')
            return real_replace(src,dst)
        with patch.object(sync.os,'replace',side_effect=broken):
            with self.assertRaisesRegex(OSError,'rollback incomplete; recovery files:'):
                sync.validate(self.root,True)
        folders=list(self.root.glob('.release-stage-*'))
        self.assertEqual(len(folders),1)
        self.assertTrue((folders[0]/'old'/'index.html').is_file())
    def test_header_only_spec_change_does_not_bypass_guard(self):
        p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* logic changed */\n')
        p=self.root/'GAME_SPEC.md';p.write_text(re.sub(r'^改訂 v[0-9.]+｜','改訂 v99.01｜',p.read_text(),flags=re.M))
        (self.root/'VERSION.txt').write_text('99.01\n2026-10-24\n')
        with self.assertRaisesRegex(ValueError,'without a specification'):
            sync.validate(self.root,True)
    def test_date_only_change_needs_no_game_spec_body_edit(self):
        (self.root/'VERSION.txt').write_text('99.01\n2027-01-02\n')
        sync.validate(self.root,True);sync.validate(self.root)
    def test_prepare_config_failure_keeps_all_outputs(self):
        (self.root/'scripts').mkdir();(self.root/'scripts/checks.json').write_text('{"always":"broken"}')
        before=self.snapshot()
        with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=sync),patch.object(update,'changed_files',return_value=[]):
            with self.assertRaisesRegex(ValueError,'checks.json'):
                update.prepare('99.01','2027-01-02')
        self.assertEqual(before,self.snapshot())
    def test_full_checks_do_not_require_git_metadata(self):
        with patch.object(update,'load_sync',return_value=sync),patch.object(update,'ROOT',self.root),patch.object(update,'selected_checks',return_value=[]),patch.object(update,'changed_files',side_effect=AssertionError('git unexpectedly called')):
            update.run_checks(full=True)
    def test_malformed_config_is_clear_validation_error(self):
        (self.root/'scripts').mkdir();(self.root/'scripts/checks.json').write_text('{"always":"broken"}')
        with patch.object(update,'ROOT',self.root):
            with self.assertRaises(ValueError):update.configuration()
    def test_unmapped_game_source_gets_full_game_tests(self):
        checks=update.selected_checks(['src/game/new-feature.js'])
        self.assertTrue(set(update.configuration()['full']).issubset(checks))
if __name__=='__main__':unittest.main(verbosity=2)
