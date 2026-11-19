"""Install original generated PNGs and measure anchors without editing pixels."""
import json, shutil
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
results = json.loads((root/'.local/enemy-attack-results-final.json').read_text(encoding='utf-8'))
catalog = json.loads((root/'public/catalog-v4.json').read_text(encoding='utf-8-sig'))
actors = {a['id']: a for a in catalog['actors']}
dest = root/'public/assets/enemy-attacks-v1'
dest.mkdir(parents=True, exist_ok=True)
layout = {}
prompts = ['# Động tác đánh thường của quái\n\n39 bộ × 6 khung. Vẽ bằng imagegen tích hợp; giữ bản PNG gốc.\n']
for result in results:
    id = result['id']
    shutil.copyfile(result['path'], dest/(id+'.png'))
    im = Image.open(result['path']).convert('RGBA')
    bounds = []
    for n in range(6):
        x0,y0 = round(n%3*im.width/3),round(n//3*im.height/2)
        x1,y1 = round((n%3+1)*im.width/3),round((n//3+1)*im.height/2)
        alpha = im.getchannel('A').crop((x0,y0,x1,y1))
        bbox = alpha.point(lambda x: 255 if x>200 else 0).getbbox()
        assert bbox, (id,n)
        bounds.append(bbox)
    actor = actors[id]
    idle = actor['actions']['idle']
    old = Image.open(root/('public'+idle['url'])).convert('RGBA')
    rect = idle.get('frameRects',[None])[0]
    fw = idle.get('frameWidth',actor['frame'])
    fh = idle.get('frameHeight',actor.get('frameHeight',actor['frame']))
    if rect:
        x,y,fw,fh = [rect[k] for k in ['x','y','width','height']]
    else:
        start = idle.get('start',0)
        cols = idle.get('atlasColumns',actor.get('sheetColumns',idle['frames']))
        x,y = (start%cols)*fw,(start//cols)*fh
    oldbox = old.getchannel('A').crop((x,y,x+fw,y+fh)).point(lambda x: 255 if x>128 else 0).getbbox()
    oldbody = idle.get('bodyHeight',actor['bodyHeight'])
    b = bounds[0]
    layout[id] = dict(bodyRatio=(b[3]-b[1])/(im.height/2),originalRatio=(oldbox[3]-oldbox[1])/oldbody,
        originX=(b[0]+b[2])/2/(im.width/3),bottoms=[b[3]/(im.height/2) for b in bounds],
        footOffset=(oldbox[3]-idle.get('originY',actor['originY'])*fh)/oldbody)
    prompts.append(f"## {id}\n\n{result['prompt']}\n\nSource: `{result['path']}`\n")
(dest/'PROMPTS.md').write_text('\n'.join(prompts),encoding='utf-8')
(root/'public/enemy-attack-layout.js').write_text('export const ENEMY_ATTACK_LAYOUT='+json.dumps(layout,indent=2)+';\n',encoding='utf-8')
print(f'Installed {len(layout)} attack atlases; measured 234 frames.')
