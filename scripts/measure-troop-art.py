"""Match new troop atlas silhouettes to the original visible in-game heights."""
from pathlib import Path
import json
from PIL import Image

root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'public/catalog-v4.json').read_text(encoding='utf-8-sig'))
layout={}
for actor in catalog['actors']:
    troop=actor['id']
    if not troop.startswith('soldier-'):
        continue
    original=Image.open(root/'public'/actor['actions']['idle']['url'].lstrip('/')).convert('RGBA')
    old_alpha=original.getchannel('A').crop((0,0,actor['frame'],actor.get('frameHeight',actor['frame'])))
    old_bounds=old_alpha.point(lambda a:255 if a>100 else 0).getbbox()
    image=Image.open(root/'public/assets/troops-v2'/f'{troop}.png').convert('RGBA')
    width=round(image.width/6)
    height=round(image.height/6)
    bounds=image.getchannel('A').crop((0,0,width,height)).point(lambda a:255 if a>100 else 0).getbbox()
    if not bounds or not old_bounds:
        raise ValueError(f'Empty idle frame: {troop}')
    layout[troop]={
        'originX':(bounds[0]+bounds[2])/2/width,
        'originY':bounds[3]/height,
        'bodyRatio':(bounds[3]-bounds[1])/height,
        'originalRatio':(old_bounds[3]-old_bounds[1])/actor['bodyHeight'],
        'originalOriginX':(old_bounds[0]+old_bounds[2])/2/actor['frame'],
        'originalOriginY':old_bounds[3]/actor.get('frameHeight',actor['frame']),
    }
if len(layout)!=9:
    raise ValueError('Expected nine troop atlases')
(root/'public/troop-layout.js').write_text('export const TROOP_ART_READY=true;\nexport const TROOP_LAYOUT='+json.dumps(layout,separators=(',',':'))+';\n',encoding='utf-8')
print('Matched nine troop heights to original sprites')
