from pathlib import Path
import importlib.util, shutil, tempfile, unittest, hashlib
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_game', ROOT/'scripts/build-game.py')
build = importlib.util.module_from_spec(spec); spec.loader.exec_module(build)
spec2 = importlib.util.spec_from_file_location('sync_release', ROOT/'scripts/sync-release.py')
sync = importlib.util.module_from_spec(spec2); spec2.loader.exec_module(sync)
class SourceBuildTest(unittest.TestCase):
 def test_exact_generated_html(self):
  self.assertEqual(build.render(), (ROOT/'index.html').read_text())
 def test_version_has_single_source(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);shutil.copytree(ROOT/'src',root/'src')
   (root/'VERSION.txt').write_text('99.01\n2026-10-24\n')
   html=build.render(root)
   self.assertEqual(html.count('const GAME_VERSION = "99.01";'),1)
   self.assertNotIn('{{VERSION}}',html)
 def test_unbuilt_source_edit_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root = Path(d)
   for name in ['index.html','GAME_SPEC.md','GAME_SPEC.txt','VERSION.txt','README.md','release-manifest.json']:
    shutil.copy2(ROOT/name,root/name)
   shutil.copytree(ROOT/'src',root/'src')
   p=root/'src/styles/game.css'; p.write_text(p.read_text()+'\n/* pending edit */\n')
   with self.assertRaisesRegex(ValueError,'Out-of-sync'):
    sync.validate(root)
 def test_template_include_order(self):
  html=build.render()
  self.assertLess(html.index('const PROFILES='),html.index('/* ===== core:'))
  self.assertLess(html.index('/* ===== core:'),html.index('/* ===== art:'))
  self.assertLess(html.index('/* ===== 操作の受付'),html.index('/* ===== input:'))
if __name__=='__main__': unittest.main(verbosity=2)
