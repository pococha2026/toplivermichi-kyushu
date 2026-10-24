"""Read-only inventory, local Markdown link and test registration audit."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import os,re

def link_text(content):
    """Mask code examples without moving character offsets or line numbers."""
    masked=[];fence=None
    def blank(text):return ''.join('\n' if c=='\n' else ' ' for c in text)
    for line in content.splitlines(keepends=True):
        marker=re.match(r' {0,3}(`{3,}|~{3,})(.*)',line)
        if fence:
            char,length=fence
            if re.fullmatch(r' {0,3}'+re.escape(char)+'{'+str(length)+r',}[ \t]*\r?\n?',line):fence=None
            masked.append(blank(line));continue
        if marker:
            fence=(marker[1][0],len(marker[1]));masked.append(blank(line));continue
        masked.append(re.sub(r'(`+)(.+?)\1',lambda m:blank(m[0]),line))
    return ''.join(masked)

def audit(root,config):
    root=root.resolve();files=[];issues=[]
    for directory,names,leaves in os.walk(root):
        names[:]=[n for n in names if (not n.startswith('.') or n=='.github') and n not in {'__pycache__','node_modules','venv'}]
        for name in leaves:
            if name.startswith('.'):continue
            files.append(Path(directory)/name)
    for path in sorted(p for p in files if p.suffix=='.md'):
        content=path.read_text(encoding='utf-8')
        for match in re.finditer(r'\[[^\]\n]+\]\(([^)\n]+)\)',link_text(content)):
            destination=match[1].strip().strip('<>')
            parsed=urlsplit(destination)
            if parsed.scheme or parsed.netloc or not parsed.path:continue
            target=(root/parsed.path.lstrip('/') if parsed.path.startswith('/') else path.parent/unquote(parsed.path)).resolve()
            if not target.is_relative_to(root) or not target.exists():
                issues.append({'kind':'broken_link','file':str(path.relative_to(root)),'target':destination,'line':content[:match.start()].count('\n')+1})
    registered=set(config['always']+config['full']+config.get('optional',[]))
    for path in sorted(p for p in files if p.parent==root/'scripts' and p.name.startswith('test-') and p.suffix in {'.py','.cjs'}):
        name=path.relative_to(root).as_posix()
        if name not in registered:issues.append({'kind':'unregistered_test','path':name})
    return {'status':'blocked' if issues else 'ok','read_only':True,'tracked_or_working_files':len(files),'registered_tests':len(registered),'optional_tests':config.get('optional',[]),'issues':issues}
