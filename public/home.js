function homeActor(parent,id){
 const canvas=document.createElement('canvas');canvas.width=220;canvas.height=170;canvas.setAttribute('aria-label',HEROES.find(h=>h.id===id)?.name||id);parent.append(canvas);
 const image=new Image(),ctx=canvas.getContext('2d');let visible=true;const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});observer.observe(canvas);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(time){if(visible&&image.complete&&image.naturalWidth){const f=reduced?0:Math.floor(time/160)%6,w=image.naturalWidth/6,h=image.naturalHeight/6,scale=145/h;ctx.clearRect(0,0,220,170);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,Math.round(f*w),0,Math.round((f+1)*w)-Math.round(f*w),Math.round(h),110-w*scale/2,160-h*scale,w*scale,h*scale);}requestAnimationFrame(draw);}
 image.onload=()=>requestAnimationFrame(draw);const knight={'knight-2':'holy-foot','knight-3':'dark-foot'}[id];image.src=knight?'/assets/knights-v2/'+knight+'.png':id==='warrior-2'?'/assets/ravager/hero-v2.png':id==='samurai-commander'?'/assets/blademaster/katana-forms.png':'/assets/heroes-v2/'+(id==='samurai-archer'?'samurai-archer-charge-v3':id)+'.png';
}
import {HEROES} from './content.js';
import {CLASSES} from './skills.js';
const descriptions={windblade:'Phong Kiếm Khách: Q lướt theo con trỏ, gió hộ thể và Kiếm Vực hất tung.',vanguard:'Bất Khuất: giáo và khiên, liên kích hút máu, hóa Cự Nhân, tỏa hào quang mặt trời.',fallen:'Hắc Kỵ Sĩ: trảm xuyên giáp, tha hóa và chiến mã diệt vong.',paladin:'Trọng kiếm ánh sáng, aura bảo hộ và thiên mã cường hóa.',darkelf:'Tên xuyên đêm, nguyệt thực và tinh linh cây đồng hành.',assassin:'Song đao, ẩn thân và lướt chém; tương tác đủ sáu loại ngọc.',guardian:'Giữ tuyến, tạo khiên và bảo vệ đồng đội.',berserker:'Cận chiến mạnh mẽ, cường hóa và hút máu.',duelist:'Đòn đánh nhanh, lướt chém và đổi thế đơn kiếm / song kiếm và kiếm vũ.',ranger:'Tấn công tầm xa, cường hóa tên độc và Vũ Tiễn liên hoàn.',pyromancer:'Thiêu đốt, tạo vùng dung nham và gọi thiên thạch.',stormcaller:'Sét nảy, lôi kích và bão sét liên hoàn, điện lan trên mặt đất.',tidecaller:'Sóng tròn, vùng hồi phục và bão tuyết cuộn xoắn.'};
for(const [id,c]of Object.entries(CLASSES)){
 const hero=HEROES.find(h=>h.classId===id),card=document.createElement('a');card.className='class-card';card.href='/class-gallery.html';card.style.setProperty('--class-color',c.color);
 const portrait=document.createElement('div');portrait.className='class-portrait';homeActor(portrait,hero.id);
 const name=document.createElement('h3');name.textContent=c.name;const text=document.createElement('p');text.textContent=descriptions[id]||c.passive;const number=document.createElement('span');number.className='hero-count';number.textContent=HEROES.filter(h=>h.classId===id).length+' hero · Q / E / R';
 card.append(portrait,name,text,number);document.getElementById('class-grid').append(card);
}

for(const node of document.querySelectorAll('[data-hero-count]'))node.textContent=HEROES.length;for(const node of document.querySelectorAll('[data-class-count]'))node.textContent=Object.keys(CLASSES).length;

import {accountMenu} from './auth-client.js';
fetch('/api/auth/me',{credentials:'same-origin'}).then(async r=>{if(r.ok)accountMenu((await r.json()).user);else {const a=document.createElement('a');a.href='/login.html';a.textContent='Đăng nhập';a.className='nav-play';document.querySelector('header nav')?.append(a);}}).catch(()=>{});

for(const [i,img]of [...document.querySelectorAll('.scene-party img')].entries()){const box=document.createElement('div');img.replaceWith(box);homeActor(box,['knight-1','fire-wizard','samurai-archer'][i]);}
