"""Reject false success when verification inputs change or are incomplete."""
from pathlib import Path
from urllib.parse import urlsplit
import importlib.util,shutil,subprocess,tempfile,unittest,threading
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
update=load('update_verification','update.py')
class Response:
 def __init__(self,data):self.data=data
 def __enter__(self):return self
 def __exit__(self,*args):pass
 def read(self):return self.data
class VerificationTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  shutil.copytree(ROOT/'src',self.root/'src');shutil.copytree(ROOT/'scripts',self.root/'scripts',ignore=shutil.ignore_patterns('__pycache__'))
  for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','README.md','VERSION.txt','release-manifest.json']:
   shutil.copy2(ROOT/name,self.root/name)
  self.remote={p.name:p.read_bytes() for p in self.root.iterdir() if p.is_file()}
 def tearDown(self):self.tmp.cleanup()
 def opener(self,request,timeout):return Response(self.remote[urlsplit(request.full_url).path.rsplit('/',1)[-1]])
 def test_incomplete_manifest_cannot_be_verified_as_success(self):
  (self.root/'release-manifest.json').write_text('{"version":"8.80","files":{}}')
  self.remote['release-manifest.json']=(self.root/'release-manifest.json').read_bytes()
  with self.assertRaises(ValueError):update.verify_public(self.root,opener=self.opener)
 def test_public_check_rejects_source_changed_during_requests(self):
  lock=threading.Lock();edited=False
  def opener(request,timeout):
   nonlocal edited
   with lock:
    if not edited:
     p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* concurrent change */\n');edited=True
   return self.opener(request,timeout)
  results=update.verify_public(self.root,opener=opener)
  self.assertFalse(all(r['match'] for r in results),'verification accepted changing inputs')
 def test_public_check_rejects_artifact_changed_during_requests(self):
  def opener(request,timeout):
   (self.root/'index.html').write_text('edited during public check')
   return self.opener(request,timeout)
  self.assertFalse(all(r['match'] for r in update.verify_public(self.root,opener=opener)))
 def test_public_check_refuses_active_writer(self):
  (self.root/'.release-update.lock').write_text('{"pid":123}')
  with self.assertRaisesRegex(ValueError,'locked'):update.verify_public(self.root,opener=self.opener)
 def test_check_programs_cannot_pass_if_inputs_change(self):
  real=update.subprocess.run
  def run(command,*args,**kwargs):
   if str(command[-1]).endswith('test-release-sync.py'):
    p=self.root/'src/styles/game.css';p.write_text(p.read_text()+'\n/* edit during checks */\n')
    return subprocess.CompletedProcess(command,0)
   return real(command,*args,**kwargs)
  with patch.object(update,'ROOT',self.root),patch.object(update.subprocess,'run',side_effect=run):
   with self.assertRaisesRegex(ValueError,'Inputs changed during checks'):
    update.run_checks(tests=['scripts/test-release-sync.py'])
 def test_stable_release_checks_all_six_files(self):
  results=update.verify_public(self.root,opener=self.opener)
  self.assertEqual(len(results),6);self.assertTrue(all(r['match'] for r in results))
 def test_recovery_files_block_before_network(self):
  (self.root/'.release-stage-pending').mkdir()
  with patch.object(self,'opener') as opener:
   with self.assertRaisesRegex(ValueError,'recovery'):update.verify_public(self.root,opener=opener)
   opener.assert_not_called()
 def test_stale_local_output_blocks_before_network(self):
  (self.root/'index.html').write_text('local output is stale')
  with patch.object(self,'opener') as opener:
   with self.assertRaisesRegex(ValueError,'Out-of-sync'):update.verify_public(self.root,opener=opener)
   opener.assert_not_called()
 def test_writer_started_during_requests_discards_all_results(self):
  def opener(request,timeout):
   (self.root/'.release-update.lock').write_text('{"pid":456}')
   return self.opener(request,timeout)
  results=update.verify_public(self.root,opener=opener)
  self.assertTrue(all(not r['match'] and 'locked' in r.get('error','') for r in results))
  self.assertTrue((self.root/'.release-update.lock').exists())
 def test_source_change_public_verification_repeats_three_times(self):
  path=self.root/'src/styles/game.css';original=path.read_bytes()
  for repeat in range(3):
   with self.subTest(repeat=repeat):
    def opener(request,timeout):
     path.write_bytes(original+b'\n/* pending change */\n')
     return self.opener(request,timeout)
    results=update.verify_public(self.root,opener=opener)
    self.assertTrue(all(not r['match'] and 'changed' in r.get('error','') for r in results))
    path.write_bytes(original)
if __name__=='__main__':unittest.main(verbosity=2)
