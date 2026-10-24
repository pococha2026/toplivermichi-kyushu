"""Interrupted writes, concurrent writers and real Git rename regression tests."""
from pathlib import Path
from contextlib import nullcontext
import importlib.util,shutil,subprocess,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
 value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
sync=load('sync_safety','sync-release.py');update=load('update_safety','update.py')
class SafetyTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  shutil.copytree(ROOT/'src',self.root/'src')
  for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt','release-manifest.json']:
   shutil.copy2(ROOT/name,self.root/name)
 def tearDown(self):self.tmp.cleanup()
 def snapshot(self):return {p.name:p.read_bytes() for p in self.root.iterdir() if p.is_file()}
 def edit(self):
  p=self.root/'GAME_SPEC.md';p.write_text(p.read_text()+'\nSafety test change\n')
 def test_keyboard_interrupt_restores_output_bundle(self):
  self.edit();(self.root/'VERSION.txt').write_text('99.01\n2027-01-02\n');before=self.snapshot();original=sync.os.replace;calls=0
  def interrupt(src,dst):
   nonlocal calls
   calls+=1
   if calls==3:raise KeyboardInterrupt()
   return original(src,dst)
  with patch.object(sync.os,'replace',side_effect=interrupt):
   with self.assertRaises(KeyboardInterrupt):sync.validate(self.root,True)
  self.assertTrue(before==self.snapshot(),"output bundle changed")
 def test_keyboard_interrupt_restores_prepare_version(self):
  original=(self.root/'VERSION.txt').read_bytes()
  class InterruptedSync:
   parse_release=staticmethod(sync.parse_release)
   write_bundle=staticmethod(sync.write_bundle)
   def release_lock(self,*args):return nullcontext()
   def validate(self,*args,**kwargs):raise KeyboardInterrupt()
   def _validate(self,*args,**kwargs):raise KeyboardInterrupt()
  with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=InterruptedSync()),patch.object(update,'changed_files',return_value=[]),patch.object(update,'selected_checks',return_value=[]):
   with self.assertRaises(KeyboardInterrupt):update.prepare('99.01','2027-01-02')
  self.assertEqual((self.root/'VERSION.txt').read_bytes(),original)
 def test_second_writer_is_rejected_without_changes(self):
  self.edit();(self.root/'.release-update.lock').write_text('{"pid":123,"token":"other-writer"}')
  before=self.snapshot()
  with self.assertRaisesRegex(ValueError,'locked'):sync.validate(self.root,True)
  self.assertTrue(before==self.snapshot(),"output bundle changed")
 def test_recovery_files_must_be_resolved_before_next_write(self):
  self.edit();(self.root/'.release-stage-interrupted').mkdir();before=self.snapshot()
  with self.assertRaisesRegex(ValueError,'recovery'):sync.validate(self.root,True)
  self.assertTrue(before==self.snapshot(),"output bundle changed")
 def test_malformed_manifest_returns_validation_error(self):
  (self.root/'release-manifest.json').write_text('[]')
  with self.assertRaises(ValueError):sync.validate(self.root,True)
 def test_git_rename_retains_old_and_new_test_categories(self):
  git=['git','-C',str(self.root)]
  subprocess.run(git+['init','-q'],check=True)
  subprocess.run(git+['add','.'],check=True)
  subprocess.run(git+['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture'],check=True)
  subprocess.run(git+['mv','src/game/data.js','src/game/new-views.js'],check=True)
  with patch.object(update,'ROOT',self.root):changed=update.changed_files()
  self.assertIn('src/game/data.js',changed);self.assertIn('src/game/new-views.js',changed)
 def test_doctor_lists_lock_and_recovery_without_mutating(self):
  (self.root/'.release-update.lock').write_text('{"pid":123}')
  (self.root/'.release-stage-pending').mkdir();before=self.snapshot()
  result=update.doctor(self.root)
  self.assertEqual(result['status'],'blocked')
  self.assertTrue({'lock','recovery'}.issubset({r['kind'] for r in result['issues']}))
  self.assertTrue(before==self.snapshot())
 def test_real_lock_refuses_nested_writer_and_releases_on_interrupt(self):
  for repeat in range(3):
   with self.subTest(repeat=repeat):
    with self.assertRaises(KeyboardInterrupt):
     with sync.release_lock(self.root):
      self.assertTrue((self.root/'.release-update.lock').is_file())
      with self.assertRaisesRegex(ValueError,'locked'):
       with sync.release_lock(self.root):pass
      raise KeyboardInterrupt()
    self.assertFalse((self.root/'.release-update.lock').exists())
 def test_interrupt_at_each_write_boundary_three_times(self):
  self.edit();(self.root/'VERSION.txt').write_text('99.01\n2027-01-02\n');before=self.snapshot()
  original=sync.os.replace
  for repeat in range(3):
   for stop_at in range(1,7):
    with self.subTest(repeat=repeat,stop_at=stop_at):
     calls=0
     def interrupt(src,dst):
      nonlocal calls
      calls+=1
      if calls==stop_at:raise KeyboardInterrupt()
      return original(src,dst)
     with patch.object(sync.os,'replace',side_effect=interrupt):
      with self.assertRaises(KeyboardInterrupt):sync.validate(self.root,True)
     self.assertTrue(before==self.snapshot(),'interrupted write did not restore the bundle')
     self.assertFalse(list(self.root.glob('.release-stage-*')))
 def test_lock_metadata_changed_by_other_process_is_preserved(self):
  lock=self.root/'.release-update.lock'
  with sync.release_lock(self.root):lock.write_text('{"token":"replacement-owner"}')
  self.assertTrue(lock.exists())
 def test_git_base_cannot_be_parsed_as_diff_option(self):
  with patch.object(update.subprocess,'check_output',side_effect=subprocess.CalledProcessError(1,['git'])) as output:
   with self.assertRaises(subprocess.CalledProcessError):update.changed_files('--output=unexpected-file')
  command=output.call_args.args[0]
  self.assertIn('--end-of-options',command)
  self.assertEqual(command[-1],'--output=unexpected-file^{commit}')
if __name__=='__main__':unittest.main(verbosity=2)
