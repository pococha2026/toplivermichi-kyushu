"""Repository cleanup and misleading health-check regressions."""
from pathlib import Path
import importlib.util,json,shutil,subprocess,sys,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/('update.py' if file=='update.py' else 'lib/'+file))
 value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
update=load('update_audit','update.py')
class AuditTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  shutil.copytree(ROOT/'src',self.root/'src');shutil.copytree(ROOT/'scripts',self.root/'scripts',ignore=shutil.ignore_patterns('__pycache__'));shutil.copytree(ROOT/'tests',self.root/'tests',ignore=shutil.ignore_patterns('__pycache__'));shutil.copytree(ROOT/'config',self.root/'config')
  for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt','release-manifest.json']:
   shutil.copy2(ROOT/name,self.root/name)
 def tearDown(self):self.tmp.cleanup()
 def test_doctor_rejects_invalid_release_date(self):
  (self.root/'VERSION.txt').write_text('8.78\n2026-02-30\n')
  result=update.doctor(self.root)
  self.assertEqual(result['status'],'blocked')
  self.assertTrue(any(x['kind']=='invalid_version' for x in result['issues']))
 def test_doctor_rejects_malformed_manifest(self):
  (self.root/'release-manifest.json').write_text('[]')
  result=update.doctor(self.root)
  self.assertEqual(result['status'],'blocked')
  self.assertTrue(any(x['kind']=='invalid_manifest' for x in result['issues']))
 def test_related_test_cannot_be_missing_from_ci(self):
  (self.root/'tests/maintenance/test-extra.py').write_text('pass\n')
  p=self.root/'config/test-suites.json';config=json.loads(p.read_text());config['related']['src/game/data.js'].append('tests/maintenance/test-extra.py');p.write_text(json.dumps(config))
  with patch.object(update,'ROOT',self.root):
   with self.assertRaisesRegex(ValueError,'full|always'):update.configuration()
 def test_standalone_builder_cannot_bypass_release_generation(self):
  (self.root/'.release-update.lock').write_text('{"token":"other"}')
  original=(self.root/'index.html').read_bytes()
  result=subprocess.run([sys.executable,str(self.root/'scripts/lib/build.py')],capture_output=True)
  self.assertNotEqual(result.returncode,0)
  self.assertTrue(original==(self.root/'index.html').read_bytes())
 def test_audit_detects_broken_relative_link_and_accepts_repair(self):
  p=self.root/'LOCAL.md';p.write_text('[target](missing-note.md)')
  result=update.repository_audit(self.root)
  self.assertTrue(any(x['kind']=='broken_link' and x['file']=='LOCAL.md' for x in result['issues']))
  (self.root/'missing-note.md').write_text('local note')
  result=update.repository_audit(self.root)
  self.assertFalse(any(x.get('file')=='LOCAL.md' for x in result['issues']))
 def test_audit_detects_unregistered_test(self):
  (self.root/'tests/maintenance/test-unregistered.py').write_text('pass')
  result=update.repository_audit(self.root)
  self.assertTrue(any(x['kind']=='unregistered_test' and x['path']=='tests/maintenance/test-unregistered.py' for x in result['issues']))
 def test_doctor_detects_edited_output(self):
  (self.root/'index.html').write_text('old output')
  result=update.doctor(self.root)
  self.assertTrue(any(x['kind']=='stale_output' and x['path']=='index.html' for x in result['issues']))
 def test_doctor_handles_invalid_manifest_date_type(self):
  p=self.root/'release-manifest.json';m=json.loads(p.read_text());m['date']=None;p.write_text(json.dumps(m))
  result=update.doctor(self.root)
  self.assertTrue(any(x['kind']=='invalid_manifest' for x in result['issues']))
 def test_current_repository_audit_passes(self):
  result=update.repository_audit()
  self.assertEqual(result['issues'],[])
  self.assertIn('tests/optional/test-regional-art.cjs',result['optional_tests'])
 def test_audit_ignores_link_examples_inside_code(self):
  (self.root/'EXAMPLES.md').write_text('```markdown\n[example](not-a-real-target.md)\n```\nUse `[inline](not-a-file.md)` as an example.\n')
  result=update.repository_audit(self.root)
  self.assertFalse(any(x.get('file')=='EXAMPLES.md' for x in result['issues']))
if __name__=='__main__':unittest.main(verbosity=2)
