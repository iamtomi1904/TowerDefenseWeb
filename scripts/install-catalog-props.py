"""Install original painted prop atlases unchanged and measure their transparent cells."""
from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'.local/catalog-style-props-results.json').read_text(encoding='utf-8'))
plan=json.loads((root/'.local/catalog-style-props-plan.json').read_text(encoding='utf-8'))
by_sheet={s['id']:s for s in plan['sheets']};dest=root/'public/assets/catalog-props-v1';dest.mkdir(parents=True,exist_ok=True)
snap=lambda n:int(n+.5)
layout={};issues=[]
for r in rows:
    path=Path(r['path']);im=Image.open(path).convert('RGBA');alpha=im.getchannel('A');assert im.mode=='RGBA'
    shutil.copyfile(path,dest/(r['id']+'.png'))
    for n,item in enumerate(by_sheet[r['id']]['items']):
        x=snap(n%4*im.width/4);y=snap(n//4*im.height/4);w=snap((n%4+1)*im.width/4)-x;h=snap((n//4+1)*im.height/4)-y
        cell=alpha.crop((x,y,x+w,y+h));b=cell.point(lambda v:255 if v>128 else 0).getbbox()
        if not b:raise ValueError('Empty painted prop: '+item['id'])
        if b[0]<2 or b[1]<2 or b[2]>w-2 or b[3]>h-2:issues.append(item['id'])
        layout[item['id']]={'sheet':r['id'],'cell':n,'bounds':[x+b[0],y+b[1],b[2]-b[0],b[3]-b[1]]}
    # Full cell gutters must remain transparent, not an opaque matte rectangle.
    corners=[alpha.getpixel((snap(col*im.width/4)+2,snap(row*im.height/4)+2)) for col in range(4) for row in range(4)]
    if max(corners)>100:raise ValueError('Opaque sheet gutter: '+r['id'])
assert len(layout)==246,len(layout)
(root/'public/catalog-prop-layout.js').write_text('export const CATALOG_PROP_LAYOUT='+json.dumps(layout,separators=(',',':'))+';\nexport const CATALOG_PROP_SHEETS='+json.dumps([r['id'] for r in rows])+';\n',encoding='utf-8')
(dest/'PROMPTS.md').write_text('# Catalog-v4 style prop redraw\n\n246 unique prop IDs. Original PNG atlases copied unchanged. Runtime crops alpha bounds and fits the existing metadata dimensions; gameplay footprints remain unchanged. Reference images: assets/v2/props/tree1.png, rock1_1.png, brown_ruins1.png, bush_simple1_1.png.\n\n'+'\n\n'.join('## '+r['id']+'\n\n'+r['prompt']+'\n\nSource: '+r['path'] for r in rows),encoding='utf-8')
print('Installed',len(rows),'atlases;',len(layout),'unique props. Edge review:',issues)
