"""Copy generated body action PNGs unchanged and measure their six ground anchors."""
import json,shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'.local/passive-action-results-final.json').read_text(encoding='utf-8'))
dest=root/'public/assets/passive-actions-v1';dest.mkdir(exist_ok=True)
layout={}
for r in rows:
    im=Image.open(r['path']).convert('RGBA');bounds=[]
    for n in range(6):
        box=(round(n%3*im.width/3),round(n//3*im.height/2),round((n%3+1)*im.width/3),round((n//3+1)*im.height/2))
        alpha=im.getchannel('A').crop(box);b=alpha.point(lambda a:255 if a>180 else 0).getbbox();assert b,(r['id'],n)
        bounds.append(b)
    first=bounds[0];layout[r['id']]={'bodyRatio':(first[3]-first[1])/(im.height/2),'height':1,'originX':(first[0]+first[2])/2/(im.width/3),'originsY':[b[3]/(im.height/2) for b in bounds]}
    shutil.copyfile(r['path'],dest/(r['id']+'.png'))
(root/'public/passive-action-layout.js').write_text('export const PASSIVE_ACTION_LAYOUT='+json.dumps(layout,indent=2)+';\n',encoding='utf-8')
(dest/'PROMPTS.md').write_text('# Passive body actions\n\nBuilt-in imagegen; identity references, original PNGs copied unchanged.\n\n'+'\n\n'.join('## '+r['id']+'\nReference: '+r['ref']+'\n'+r['prompt']+'\nSource: '+r['path'] for r in rows),encoding='utf-8')
print('Installed',len(rows),'atlases;',len(rows)*6,'frames.')
import subprocess,sys
# Reapply anatomical measurements after copying: weapon/FX bounds are not body height.
subprocess.run([sys.executable,str(root/'scripts/measure-actor-bodies.py')],check=True)
