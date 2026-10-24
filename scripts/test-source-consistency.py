"""Source-only drift, generation-time edits and metadata consistency tests."""
from pathlib import Path
from collections import Counter
import importlib.util,shutil,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
 value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
sync=load('sync_consistency','sync-release.py');build=load('build_consistency','build-game.py');update=load('update_consistency','update.py')
class ConsistencyTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  shutil.copytree(ROOT/'src',self.root/'src');shutil.copytree(ROOT/'scripts',self.root/'scripts',ignore=shutil.ignore_patterns('__pycache__'))
  for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt','release-manifest.json']:
   shutil.copy2(ROOT/name,self.root/name)
 def tearDown(self):self.tmp.cleanup()
 def test_doctor_detects_source_only_edit(self):
  p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* pending source edit */\n')
  result=update.doctor(self.root)
  self.assertEqual(result['status'],'blocked')
  self.assertTrue(any(i['kind']=='stale_source' for i in result['issues']))
 def test_edit_during_generation_is_preserved_and_rejected(self):
  p=self.root/'GAME_SPEC.md';p.write_text(p.read_text()+'\nGeneration consistency test\n')
  real=sync.subprocess.run;edited=False
  def run(*args,**kwargs):
   nonlocal edited
   result=real(*args,**kwargs)
   if not edited:
    p=self.root/'README.md';p.write_text(p.read_text()+'\nUSER EDIT DURING GENERATION\n');edited=True
   return result
  with patch.object(sync.subprocess,'run',side_effect=run):
   with self.assertRaisesRegex(ValueError,'Inputs changed'):sync.validate(self.root,True)
  self.assertIn('USER EDIT DURING GENERATION',(self.root/'README.md').read_text())
 def test_noncanonical_date_rejected_consistently(self):
  (self.root/'VERSION.txt').write_text('8.79\n20261024\n')
  with self.assertRaises(ValueError):build.render(self.root)
  with self.assertRaises(ValueError):sync.planned(self.root)
  self.assertTrue(any(i['kind']=='invalid_version' for i in update.doctor(self.root)['issues']))
 def test_build_date_cannot_be_hardcoded(self):
  p=self.root/'src/index.template.html';p.write_text(p.read_text().replace('{{BUILD_DATE}}','2026-01-01'))
  with self.assertRaisesRegex(ValueError,'BUILD_DATE'):build.render(self.root)
 def test_source_contents_are_read_once_per_render(self):
  counts=Counter();real=Path.read_text
  def read(path,*args,**kwargs):
   if path.is_relative_to(self.root/'src'):counts[str(path)]+=1
   return real(path,*args,**kwargs)
  with patch.object(Path,'read_text',new=read):build.render(self.root)
  self.assertTrue(counts and all(n==1 for n in counts.values()),'source text was read repeatedly')
 def test_prepare_failure_preserves_concurrent_version_edit(self):
  external=b'99.02\n2027-02-03\n'
  class ChangedSync:
   parse_release=staticmethod(sync.parse_release)
   write_bundle=staticmethod(sync.write_bundle)
   release_lock=staticmethod(sync.release_lock)
   def _validate(self,root,write):
    (root/'VERSION.txt').write_bytes(external)
    raise ValueError('Inputs changed')
  with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=ChangedSync()),patch.object(update,'changed_files',return_value=[]),patch.object(update,'selected_checks',return_value=[]):
   with self.assertRaisesRegex(ValueError,'Inputs changed'):update.prepare('99.01','2027-01-02')
  self.assertTrue((self.root/'VERSION.txt').read_bytes()==external,'concurrent version edit was overwritten')
 def test_non_ascii_version_is_rejected(self):
  with self.assertRaises(ValueError):build.parse_release('８.７９\n2026-10-24\n')
 def test_concurrent_edit_detection_repeats_three_times(self):
  p=self.root/'GAME_SPEC.md';p.write_text(p.read_text()+'\nRepeat consistency test\n')
  real=sync.subprocess.run
  for iteration in range(3):
   with self.subTest(iteration=iteration):
    marker='USER-EDIT-'+str(iteration);edited=False
    before=(self.root/'index.html').read_bytes()
    def run(*args,**kwargs):
     nonlocal edited
     result=real(*args,**kwargs)
     if not edited:
      p=self.root/'README.md';p.write_text(p.read_text()+'\n'+marker+'\n');edited=True
     return result
    with patch.object(sync.subprocess,'run',side_effect=run):
     with self.assertRaisesRegex(ValueError,'Inputs changed'):sync.validate(self.root,True)
    self.assertIn(marker,(self.root/'README.md').read_text())
    self.assertTrue(before==(self.root/'index.html').read_bytes())
 def test_manual_version_edit_cannot_downgrade_previous_release(self):
  p=self.root/'VERSION.txt';p.write_text('0.01\n2026-10-24\n')
  before=(self.root/'index.html').read_bytes()
  with self.assertRaisesRegex(ValueError,'rollback'):sync.validate(self.root,True)
  self.assertTrue((self.root/'index.html').read_bytes()==before)
 def test_partial_temporary_version_write_does_not_corrupt_input(self):
  before=(self.root/'VERSION.txt').read_bytes();real=Path.write_bytes;failed=False
  def write(path,data):
   nonlocal failed
   if path.name=='VERSION.txt' and not failed:
    failed=True;real(path,data[:4]);raise OSError('partial version write')
   return real(path,data)
  class NoGeneration:
   parse_release=staticmethod(sync.parse_release)
   write_bundle=staticmethod(sync.write_bundle)
   release_lock=staticmethod(sync.release_lock)
   def _validate(self,*args,**kwargs):raise OSError('generation deliberately stopped')
  with patch.object(update,'ROOT',self.root),patch.object(update,'load_sync',return_value=NoGeneration()),patch.object(update,'changed_files',return_value=[]),patch.object(update,'selected_checks',return_value=[]),patch.object(Path,'write_bytes',new=write):
   with self.assertRaises(OSError):update.prepare('99.01','2027-01-02')
  self.assertTrue(failed,'partial write fault was not injected')
  self.assertTrue((self.root/'VERSION.txt').read_bytes()==before,'temporary version was left truncated')
if __name__=='__main__':unittest.main(verbosity=2)
