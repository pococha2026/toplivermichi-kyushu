"""Protect the organized layout, historical data and stable update entry point."""
from pathlib import Path
import hashlib,importlib.util,json,subprocess,sys,tempfile,unittest
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('layout_update',ROOT/'scripts/update.py');update=importlib.util.module_from_spec(spec);spec.loader.exec_module(update)
class LayoutTest(unittest.TestCase):
 def test_archived_report_contents_match_original_digests(self):
  record=json.loads((ROOT/'docs/structure-v8.81.json').read_text())
  reports=json.loads((ROOT/'docs/reports/archive.json').read_text())['reports']
  self.assertEqual(set(record['consolidated_reports']),set(reports))
  for name,expected in record['archive_entry_sha256'].items():
   with self.subTest(name=name):
    actual=hashlib.sha256(json.dumps(reports[name],sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
    self.assertEqual(actual,expected)
 def test_moved_files_have_one_active_location(self):
  record=json.loads((ROOT/'docs/structure-v8.81.json').read_text())
  for old,new in record['moved'].items():
   with self.subTest(old=old,new=new):
    self.assertFalse((ROOT/old).exists());self.assertTrue((ROOT/new).is_file())
 def test_update_entry_works_outside_repository_directory(self):
  with tempfile.TemporaryDirectory() as d:
   result=subprocess.run([sys.executable,str(ROOT/'scripts/update.py'),'audit'],cwd=d,capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr+result.stdout)
  self.assertEqual(json.loads(result.stdout)['status'],'ok')
 def test_audit_detects_deeply_nested_unregistered_tests(self):
  spec=importlib.util.spec_from_file_location('layout_audit',ROOT/'scripts/lib/audit.py');audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);path=root/'tests/game/group/test-unregistered.cjs';path.parent.mkdir(parents=True);path.write_text('')
   result=audit.audit(root,{'always':[],'full':[],'optional':[]})
   self.assertTrue(any(x['kind']=='unregistered_test' and x['path']=='tests/game/group/test-unregistered.cjs' for x in result['issues']))
 def test_verification_tracks_configuration_and_test_folders(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);before=update.verification_fingerprints(root)
   for name in ['config/test-suites.json','tests/game/test-new.cjs','tests/maintenance/test-new.py']:
    path=root/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('changed')
   after=update.verification_fingerprints(root)
   self.assertNotEqual(before,after)
   self.assertTrue(all(name in after for name in ['config/test-suites.json','tests/game/test-new.cjs','tests/maintenance/test-new.py']))
if __name__=='__main__':unittest.main(verbosity=2)
