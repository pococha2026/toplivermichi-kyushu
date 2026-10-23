from pathlib import Path
import importlib.util,json,tempfile,unittest
spec=importlib.util.spec_from_file_location('sync_release',Path(__file__).with_name('sync-release.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class SyncTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','VERSION.txt','README.md','release-manifest.json']:(self.root/name).write_bytes((m.ROOT/name).read_bytes())
 def tearDown(self):self.tmp.cleanup()
 def test_valid(self):self.assertEqual(m.validate(self.root)['version'],(self.root/'VERSION.txt').read_text().splitlines()[0])
 def test_game_drift(self):
  f=self.root/'index.html';f.write_text(f.read_text()+'\n<!-- changed -->')
  with self.assertRaisesRegex(ValueError,'Out-of-sync'):m.validate(self.root)
 def test_txt_drift(self):
  (self.root/'GAME_SPEC.txt').write_text('stale')
  with self.assertRaisesRegex(ValueError,'Out-of-sync'):m.validate(self.root)
 def test_version_drift(self):
  parts=(self.root/'VERSION.txt').read_text().splitlines(); nums=parts[0].split('.');nums[-1]=str(int(nums[-1])+1);(self.root/'VERSION.txt').write_text('.'.join(nums)+'\n'+parts[1]+'\n')
  with self.assertRaisesRegex(ValueError,'Out-of-sync'):m.validate(self.root)
 def test_missing_manifest(self):
  (self.root/'release-manifest.json').unlink()
  with self.assertRaisesRegex(ValueError,'Out-of-sync'):m.validate(self.root)
 def test_game_change_without_spec(self):
  f=self.root/'index.html';f.write_text(f.read_text()+'\n<!-- changed -->')
  with self.assertRaisesRegex(ValueError,'without a specification'):m.validate(self.root,True)
 def test_regenerate_text(self):
  f=self.root/'GAME_SPEC.md';f.write_text(f.read_text()+'\n修正した説明\n');m.validate(self.root,True);m.validate(self.root)
  self.assertTrue((self.root/'GAME_SPEC.txt').read_text().endswith('修正した説明\n'))
if __name__=='__main__':unittest.main(verbosity=2)
