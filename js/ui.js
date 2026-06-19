// ========================= 共用視覺系統（v0.9 大膽重塑：Arcane Dusk）=========================
// 設計語言：深靛夜底色＋燈火金 CTA、晶湖青(資訊)、遺物紫(魔法/收藏)、商隊琥珀(補給)。
// 圓角分層面板、實心按鈕、導覽卡（圖示＋標題＋一句說明）、晶片標籤、向量圖示組、工具提示。
// 沿用舊呼叫簽章（button 仍提供 .bg/.label），改一處即全畫面升級。

const UI = {
  bg0:0x0c0a1a, bg1:0x171232, bg2:0x0a0816,
  panelN:0x1b1736, panelHiN:0x241e44, raisedN:0x2a2350, hoverN:0x372d66,
  lineN:0x423a72, lineSoftN:0x2a2548, inkN:0x07060f,
  text:'#ece6d6', dim:'#9b93b8', faint:'#6e6790', white:'#ffffff',
  gold:'#f2c14e', teal:'#56d6c6', violet:'#a98bff', ember:'#f0975a', green:'#6ee29a', red:'#ff6f7a', blue:'#6aa6f0',
  goldN:0xf2c14e, tealN:0x56d6c6, violetN:0xa98bff, emberN:0xf0975a, greenN:0x6ee29a, redN:0xff6f7a, blueN:0x6aa6f0,
};
// 新色系套用到舊主題鍵（data.js 的 TH 維持原樣，這裡覆寫；scene 內 TH.* 即時生效）
if(typeof TH!=='undefined') Object.assign(TH, { bg:'#0c0a1a', panel:0x1b1736, panel2:0x241e44, gold:'#f2c14e', goldN:0xf2c14e, cyan:'#56d6c6', red:'#ff6f7a', green:'#6ee29a', text:'#ece6d6', dim:'#9b93b8' });

function accent(name){
  const m={ gold:['#f2c14e',0xf2c14e,0x6b5320], teal:['#56d6c6',0x56d6c6,0x1d6a63], violet:['#a98bff',0xa98bff,0x523f96],
            ember:['#f0975a',0xf0975a,0x8f4f29], green:['#6ee29a',0x6ee29a,0x2c8551], red:['#ff6f7a',0xff6f7a,0x933039],
            blue:['#6aa6f0',0x6aa6f0,0x315c93], slate:['#9b93b8',0x9b93b8,0x322c52] };
  const a=m[name]||m.teal; return {hex:a[0], num:a[1], deep:a[2]};
}
function _mix(c1,c2,t){ const r=Math.round(((c1>>16)&255)+(((c2>>16)&255)-((c1>>16)&255))*t),
  g=Math.round(((c1>>8)&255)+(((c2>>8)&255)-((c1>>8)&255))*t), b=Math.round((c1&255)+((c2&255)-(c1&255))*t); return (r<<16)|(g<<8)|b; }
function _hx(n){ return '#'+(n>>>0&0xffffff).toString(16).padStart(6,'0'); }

function sceneBg(scene, opt){
  opt=opt||{}; const W=scene.scale.width, H=scene.scale.height;
  const g=scene.add.graphics().setDepth(-100);
  const top=opt.top??UI.bg1, bot=opt.bottom??UI.bg2, steps=30;
  for(let i=0;i<steps;i++){ g.fillStyle(_mix(top,bot,i/(steps-1)),1); g.fillRect(0, Math.floor(H*i/steps), W, Math.ceil(H/steps)+1); }
  if(scene.textures.exists('wall')) scene.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.06).setDepth(-99);
  const glow=scene.add.graphics().setDepth(-98); const gx=opt.glowX??W/2, gy=opt.glowY??-30, gc=opt.glow??0xf0a850;
  for(let r=340;r>0;r-=34){ glow.fillStyle(gc, 0.035); glow.fillCircle(gx,gy,r); }
  const v=scene.add.graphics().setDepth(-97); const vg=64;
  for(let i=0;i<vg;i++){ const a=0.20*Math.pow(1-i/vg,2.2); v.fillStyle(0x000006, a); v.fillRect(0,i,W,1); v.fillRect(0,H-1-i,W,1); v.fillRect(i,0,1,H); v.fillRect(W-1-i,0,1,H); }
  return g;
}

function txt(scene,x,y,s,size,color,origin,originY){
  const ox = origin===undefined?0.5:origin, oy = originY===undefined?ox:originY;
  return scene.add.text(x,y,s,{fontFamily:'"Noto Sans TC","Microsoft JhengHei",sans-serif',fontSize:size+'px',color:color||UI.text})
    .setOrigin(ox,oy).setResolution(2);
}
function sceneHeader(scene, title, subtitle, opt){
  opt=opt||{}; const W=scene.scale.width, ac=accent(opt.accent||'gold'); const out=[];
  const t=txt(scene, W/2, 30, title, opt.size||27, ac.hex);
  t.setStroke('#07060f',5); t.setShadow(0,3,'#000',6,false,true); out.push(t);
  const g=scene.add.graphics(); const tw=t.width;
  g.lineStyle(2, ac.num, 0.7); g.lineBetween(W/2-tw/2-46,30, W/2-tw/2-14,30); g.lineBetween(W/2+tw/2+14,30, W/2+tw/2+46,30);
  g.fillStyle(ac.num,0.9); g.fillCircle(W/2-tw/2-54,30,3); g.fillCircle(W/2+tw/2+54,30,3); out.push(g);
  if(subtitle){ out.push(txt(scene, W/2, 54, subtitle, opt.subSize||12, UI.dim)); }
  return out;
}

function panel(scene,x,y,w,h,opt){
  opt=opt||{}; const ac=accent(opt.accent||'slate'); const r=opt.radius??14;
  const c=scene.add.container(x,y); const g=scene.add.graphics(); c.add(g);
  g.fillStyle(0x000000,0.42); g.fillRoundedRect(-w/2-2,-h/2+7,w+4,h,r+2);
  g.fillStyle(opt.fillN??UI.panelN,1); g.fillRoundedRect(-w/2,-h/2,w,h,r);
  g.fillStyle(UI.panelHiN,0.55); g.fillRoundedRect(-w/2,-h/2,w,Math.min(h*0.4,64),r);
  g.lineStyle(2, ac.num, opt.borderA??0.85); g.strokeRoundedRect(-w/2,-h/2,w,h,r);
  g.lineStyle(1,0xffffff,0.05); g.lineBetween(-w/2+r,-h/2+1.5, w/2-r,-h/2+1.5);
  let bodyTop=-h/2+16;
  if(opt.title){
    g.fillStyle(ac.num,1); g.fillRoundedRect(-w/2,-h/2,5,h,{tl:r,bl:r,tr:0,br:0});
    if(opt.icon){ c.add(icon(scene,-w/2+24,-h/2+24,opt.icon,18,ac.num)); }
    c.add(txt(scene, opt.icon? -w/2+40 : 0, -h/2+24, opt.title, opt.titleSize||17, ac.hex, opt.icon?0:0.5, opt.icon?0.5:undefined));
    g.lineStyle(1, ac.num, 0.25); g.lineBetween(-w/2+14,-h/2+44, w/2-14,-h/2+44);
    bodyTop=-h/2+58;
  }
  c.gfx=g; c.w=w; c.h=h; c.accent=ac; c.bodyTop=y+bodyTop; c.cx=x; c.left=x-w/2; c.right=x+w/2;
  return c;
}

function button(scene,x,y,w,h,label,onClick,opt){
  opt=opt||{};
  const variantAcc={ primary:'teal', go:'green', confirm:'green', danger:'red', gold:'gold', secondary:'violet', ember:'ember', info:'blue' };
  const acName = opt.accent || variantAcc[opt.variant];
  const ac = acName? accent(acName) : null;
  const r = opt.radius ?? 10;
  const g = scene.add.container(x,y); const gfx=scene.add.graphics(); g.add(gfx);
  const st = { fill: opt.fill ?? (ac? ac.deep : UI.raisedN), stroke: opt.stroke ?? (ac? ac.num : UI.lineN), hov:false };
  const draw=()=>{ gfx.clear();
    gfx.fillStyle(0x000000,0.34); gfx.fillRoundedRect(-w/2,-h/2+4,w,h,r);
    gfx.fillStyle(st.hov? _mix(st.fill,0xffffff,0.16): st.fill, 1); gfx.fillRoundedRect(-w/2,-h/2,w,h,r);
    gfx.fillStyle(0xffffff, st.hov?0.16:0.10); gfx.fillRoundedRect(-w/2,-h/2,w,Math.max(6,h*0.46),r);
    gfx.lineStyle(2, st.stroke, 0.95); gfx.strokeRoundedRect(-w/2,-h/2,w,h,r);
  };
  draw();
  const t=txt(scene, 0, 0, label, opt.size||15, opt.color||UI.text); g.add(t);
  if(opt.icon){ const iw=(opt.iconSize||16); const tot=t.width+iw+6; t.setX(tot/2-t.width/2); g.add(icon(scene, -tot/2+iw/2, 0, opt.icon, iw, (typeof opt.iconColor==='number')?opt.iconColor:st.stroke)); }
  const hit=scene.add.rectangle(0,0,w,h,0xffffff,0.001).setInteractive({useHandCursor:true}); g.add(hit);
  hit.on('pointerover',()=>{ st.hov=true; draw(); scene.tweens.add({targets:g,scaleX:1.03,scaleY:1.03,duration:90,ease:'Quad.out'}); })
     .on('pointerout', ()=>{ st.hov=false; draw(); scene.tweens.add({targets:g,scaleX:1,scaleY:1,duration:90,ease:'Quad.out'}); })
     .on('pointerdown',()=>{ scene.tweens.add({targets:g,scaleX:0.96,scaleY:0.96,duration:55,yoyo:true}); if(onClick)onClick(); });
  g.bg = { setFillStyle:(c)=>{ if(c!=null)st.fill=c; draw(); return g.bg; }, setStrokeStyle:(wd,c)=>{ if(c!=null)st.stroke=c; draw(); return g.bg; } };
  g.label = t; g._hit = hit;
  return g;
}

function navCard(scene,x,y,w,h,o){
  o=o||{}; const ac=accent(o.accent||'teal'); const r=12;
  const g=scene.add.container(x,y); const gfx=scene.add.graphics(); g.add(gfx); let hov=false;
  const draw=()=>{ gfx.clear();
    gfx.fillStyle(0x000000,0.36); gfx.fillRoundedRect(-w/2,-h/2+4,w,h,r);
    gfx.fillStyle(hov?UI.hoverN:UI.raisedN,1); gfx.fillRoundedRect(-w/2,-h/2,w,h,r);
    gfx.fillStyle(0xffffff,hov?0.12:0.06); gfx.fillRoundedRect(-w/2,-h/2,w,Math.max(8,h*0.5),r);
    gfx.lineStyle(2, ac.num, hov?1:0.6); gfx.strokeRoundedRect(-w/2,-h/2,w,h,r);
    gfx.fillStyle(ac.deep,1); gfx.fillCircle(-w/2+28,0,19); gfx.lineStyle(2,ac.num,1); gfx.strokeCircle(-w/2+28,0,19);
  };
  draw();
  if(o.icon) g.add(icon(scene,-w/2+28,0,o.icon,19,ac.num));
  g.add(txt(scene,-w/2+56,o.desc?-h/2+20:0, o.title, o.titleSize||15, UI.text, 0));
  if(o.desc) g.add(txt(scene,-w/2+56,-h/2+39, o.desc, 10.5, UI.dim,0).setWordWrapWidth(w-70));
  const hit=scene.add.rectangle(0,0,w,h,0xffffff,0.001).setInteractive({useHandCursor:true}); g.add(hit);
  hit.on('pointerover',()=>{hov=true;draw();scene.tweens.add({targets:g,y:y-3,duration:110,ease:'Quad.out'});})
     .on('pointerout', ()=>{hov=false;draw();scene.tweens.add({targets:g,y:y,duration:110,ease:'Quad.out'});})
     .on('pointerdown',()=>{ if(o.onClick)o.onClick(); });
  g._hit=hit; return g;
}

function chip(scene,x,y,o){
  o=o||{}; const ac=accent(o.accent||'teal'); const pad=12, isz=o.icon?13:0, h=o.h||22;
  const t=txt(scene,0,0,o.label||'',o.size||11, o.textColor||ac.hex, 0,0.5);
  const w=pad*2+(isz?isz+5:0)+Math.ceil(t.width)+2;
  const c=scene.add.container(x,y); const g=scene.add.graphics(); c.add(g);
  g.fillStyle(o.filled?ac.deep:UI.raisedN, 0.96); g.fillRoundedRect(0,-h/2,w,h,h/2);
  g.lineStyle(1.5, ac.num, 0.9); g.strokeRoundedRect(0,-h/2,w,h,h/2);
  let tx=pad; if(isz){ c.add(icon(scene,pad+isz/2,0,o.icon,isz,ac.num)); tx=pad+isz+5; }
  t.setX(tx); c.add(t);
  c.w=w; c.h=h; return c;
}
function chipRow(scene,x,y,items,o){
  o=o||{}; const maxW=o.maxWidth||400, gap=o.gap||7, lh=o.lineH||28; let cx=x, cy=y, lines=1;
  items.forEach((it,k)=>{ let ch=chip(scene,cx,cy,it);
    if(k>0 && (cx-x)+ch.w>maxW){ cx=x; cy+=lh; lines++; ch.setX(cx); ch.setY(cy); }
    cx+=ch.w+gap; if(o.parent)o.parent.push(ch); });
  return lines*lh;
}

function statBar(scene,x,y,w,h,val,max,o){
  o=o||{}; const ac=accent(o.accent||'green'); const r=h/2; const frac=Math.max(0,Math.min(1, max? val/max:0));
  const c=scene.add.container(x,y); const g=scene.add.graphics(); c.add(g);
  g.fillStyle(UI.inkN,0.85); g.fillRoundedRect(0,-h/2,w,h,r);
  if(frac>0){ const fw=Math.max(h, w*frac); g.fillStyle(ac.num,1); g.fillRoundedRect(0,-h/2,fw,h,r);
    g.fillStyle(0xffffff,0.20); g.fillRoundedRect(0,-h/2,fw,Math.max(2,h*0.42),r); }
  g.lineStyle(1.5, ac.num, 0.45); g.strokeRoundedRect(0,-h/2,w,h,r);
  if(o.label) c.add(txt(scene,w/2,0,o.label,o.size||10,o.labelColor||UI.text));
  c.w=w; return c;
}
function divider(scene,x,y,w,col,a){ const g=scene.add.graphics(); g.lineStyle(1, col||UI.lineN, a==null?0.5:a); g.lineBetween(x-w/2,y,x+w/2,y); return g; }

function icon(scene,x,y,name,size,col){
  const c=scene.add.container(x,y); const g=scene.add.graphics(); c.add(g);
  const fn=ICONS[name];
  if(fn){ fn(g,0,0,size,(typeof col==='number')?col:0xece6d6); }
  else { g.fillStyle((typeof col==='number')?col:0xece6d6,1); g.fillCircle(0,0,size*0.42); }
  return c;
}
const ICONS = {
  coin(g,x,y,s,c){ const r=s*0.46; g.lineStyle(Math.max(2,s*0.1),c,1); g.fillStyle(c,0.18); g.fillCircle(x,y,r); g.strokeCircle(x,y,r); g.strokeCircle(x,y,r*0.62); g.lineBetween(x,y-r*0.5,x,y+r*0.5); },
  relic(g,x,y,s,c){ const w=s*0.5,hh=s*0.7; g.lineStyle(Math.max(2,s*0.1),c,1); g.fillStyle(c,0.16);
    g.beginPath(); g.moveTo(x-w*0.34,y-hh*0.5); g.lineTo(x+w*0.34,y-hh*0.5); g.lineTo(x+w*0.5,y-hh*0.1); g.lineTo(x+w*0.28,y+hh*0.5); g.lineTo(x-w*0.28,y+hh*0.5); g.lineTo(x-w*0.5,y-hh*0.1); g.closePath(); g.fillPath(); g.strokePath();
    g.lineBetween(x-w*0.34,y-hh*0.5,x-w*0.18,y-hh*0.66); g.lineBetween(x+w*0.34,y-hh*0.5,x+w*0.18,y-hh*0.66); },
  star(g,x,y,s,c){ g.fillStyle(c,1); _starPath(g,x,y,s*0.5,s*0.21,5); g.fillPath(); },
  bag(g,x,y,s,c){ const w=s*0.62,hh=s*0.62; g.lineStyle(Math.max(2,s*0.1),c,1); g.fillStyle(c,0.16);
    g.fillRoundedRect(x-w/2,y-hh*0.28,w,hh*0.86,s*0.14); g.strokeRoundedRect(x-w/2,y-hh*0.28,w,hh*0.86,s*0.14);
    g.lineBetween(x-w*0.22,y-hh*0.28,x-w*0.1,y-hh*0.6); g.lineBetween(x+w*0.22,y-hh*0.28,x+w*0.1,y-hh*0.6); },
  box(g,x,y,s,c){ const w=s*0.62; g.lineStyle(Math.max(2,s*0.1),c,1); g.fillStyle(c,0.14);
    g.fillRect(x-w/2,y-w/2,w,w); g.strokeRect(x-w/2,y-w/2,w,w); g.lineBetween(x-w/2,y-w*0.12,x+w/2,y-w*0.12); g.lineBetween(x,y-w*0.12,x,y+w/2); },
  person(g,x,y,s,c){ g.fillStyle(c,1); g.fillCircle(x,y-s*0.24,s*0.18);
    g.beginPath(); g.arc(x,y+s*0.5,s*0.34,Math.PI*1.05,Math.PI*1.95,false); g.lineTo(x+s*0.3,y+s*0.5); g.lineTo(x-s*0.3,y+s*0.5); g.closePath(); g.fillPath(); },
  recruit(g,x,y,s,c){ ICONS.person(g,x-s*0.1,y,s*0.9,c); g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x+s*0.28,y-s*0.1,x+s*0.28,y+s*0.18); g.lineBetween(x+s*0.16,y+s*0.04,x+s*0.4,y+s*0.04); },
  formation(g,x,y,s,c){ g.fillStyle(c,1); g.fillCircle(x,y-s*0.26,s*0.13); g.fillCircle(x-s*0.3,y+s*0.22,s*0.13); g.fillCircle(x+s*0.3,y+s*0.22,s*0.13); g.lineStyle(Math.max(1.5,s*0.06),c,0.6); g.lineBetween(x,y-s*0.26,x-s*0.3,y+s*0.22); g.lineBetween(x,y-s*0.26,x+s*0.3,y+s*0.22); g.lineBetween(x-s*0.3,y+s*0.22,x+s*0.3,y+s*0.22); },
  wagon(g,x,y,s,c){ const w=s*0.74,hh=s*0.4; g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.14);
    g.fillRoundedRect(x-w/2,y-hh*0.7,w,hh,s*0.08); g.strokeRoundedRect(x-w/2,y-hh*0.7,w,hh,s*0.08);
    g.beginPath(); g.arc(x,y-hh*0.7,w*0.5,Math.PI,0,false); g.strokePath();
    g.fillStyle(0x07060f,1); g.fillCircle(x-w*0.28,y+hh*0.5,s*0.13); g.fillCircle(x+w*0.28,y+hh*0.5,s*0.13);
    g.lineStyle(Math.max(2,s*0.09),c,1); g.strokeCircle(x-w*0.28,y+hh*0.5,s*0.13); g.strokeCircle(x+w*0.28,y+hh*0.5,s*0.13); },
  sword(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x-s*0.3,y+s*0.34,x+s*0.32,y-s*0.34); g.lineBetween(x+s*0.12,y-s*0.34,x+s*0.32,y-s*0.34); g.lineBetween(x+s*0.32,y-s*0.14,x+s*0.32,y-s*0.34); g.lineBetween(x-s*0.34,y+s*0.18,x-s*0.06,y+s*0.46); },
  shield(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.fillStyle(c,0.14);
    g.beginPath(); g.moveTo(x,y-s*0.42); g.lineTo(x+s*0.36,y-s*0.26); g.lineTo(x+s*0.32,y+s*0.18); g.lineTo(x,y+s*0.46); g.lineTo(x-s*0.32,y+s*0.18); g.lineTo(x-s*0.36,y-s*0.26); g.closePath(); g.fillPath(); g.strokePath(); },
  heart(g,x,y,s,c){ g.fillStyle(c,1); g.fillCircle(x-s*0.18,y-s*0.1,s*0.2); g.fillCircle(x+s*0.18,y-s*0.1,s*0.2); g.fillTriangle(x-s*0.37,y-s*0.02,x+s*0.37,y-s*0.02,x,y+s*0.42); },
  skull(g,x,y,s,c){ g.fillStyle(c,1); g.fillCircle(x,y-s*0.1,s*0.34); g.fillRect(x-s*0.2,y+s*0.08,s*0.4,s*0.24);
    g.fillStyle(0x07060f,1); g.fillCircle(x-s*0.14,y-s*0.12,s*0.1); g.fillCircle(x+s*0.14,y-s*0.12,s*0.1); g.fillRect(x-s*0.04,y+s*0.12,s*0.08,s*0.16); },
  gear(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.strokeCircle(x,y,s*0.26); g.fillStyle(c,1); g.fillCircle(x,y,s*0.08);
    for(let i=0;i<8;i++){ const a=i*Math.PI/4; g.lineBetween(x+Math.cos(a)*s*0.26,y+Math.sin(a)*s*0.26, x+Math.cos(a)*s*0.42,y+Math.sin(a)*s*0.42); } },
  flame(g,x,y,s,c){ g.fillStyle(c,1); g.beginPath(); g.moveTo(x,y-s*0.44); g.lineTo(x+s*0.26,y-s*0.02); g.lineTo(x+s*0.2,y+s*0.3); g.lineTo(x-s*0.2,y+s*0.3); g.lineTo(x-s*0.26,y-s*0.02); g.closePath(); g.fillPath();
    g.fillStyle(_mix(c,0xffffff,0.5),1); g.fillTriangle(x,y-s*0.12,x+s*0.12,y+s*0.2,x-s*0.12,y+s*0.2); },
  pin(g,x,y,s,c){ g.fillStyle(c,1); g.beginPath(); g.arc(x,y-s*0.1,s*0.28,Math.PI*0.86,Math.PI*0.14,false); g.lineTo(x,y+s*0.42); g.closePath(); g.fillPath(); g.fillStyle(0x07060f,1); g.fillCircle(x,y-s*0.12,s*0.1); },
  chest(g,x,y,s,c){ const w=s*0.66,hh=s*0.5; g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.16);
    g.fillRoundedRect(x-w/2,y-hh*0.2,w,hh*0.7,s*0.06); g.strokeRoundedRect(x-w/2,y-hh*0.2,w,hh*0.7,s*0.06);
    g.beginPath(); g.arc(x,y-hh*0.2,w*0.5,Math.PI,0,false); g.strokePath(); g.fillStyle(c,1); g.fillRect(x-s*0.05,y-hh*0.16,s*0.1,s*0.2); },
  play(g,x,y,s,c){ g.fillStyle(c,1); g.fillTriangle(x-s*0.26,y-s*0.32,x-s*0.26,y+s*0.32,x+s*0.34,y); },
  home(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.14); g.beginPath(); g.moveTo(x-s*0.4,y); g.lineTo(x,y-s*0.4); g.lineTo(x+s*0.4,y); g.strokePath(); g.fillRect(x-s*0.3,y,s*0.6,s*0.4); g.strokeRect(x-s*0.3,y,s*0.6,s*0.4); },
  refresh(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.beginPath(); g.arc(x,y,s*0.32,Math.PI*0.5,Math.PI*1.9,false); g.strokePath(); g.fillStyle(c,1); g.fillTriangle(x+s*0.18,y-s*0.34,x+s*0.42,y-s*0.28,x+s*0.26,y-s*0.06); },
  bug(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.5); g.fillEllipse(x,y+s*0.04,s*0.4,s*0.52); g.strokeEllipse(x,y+s*0.04,s*0.4,s*0.52); g.lineBetween(x-s*0.2,y,x-s*0.42,y-s*0.14); g.lineBetween(x+s*0.2,y,x+s*0.42,y-s*0.14); g.lineBetween(x-s*0.2,y+s*0.16,x-s*0.42,y+s*0.24); g.lineBetween(x+s*0.2,y+s*0.16,x+s*0.42,y+s*0.24); },
  axe(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x,y-s*0.4,x,y+s*0.42); g.fillStyle(c,0.85);
    g.beginPath(); g.moveTo(x,y-s*0.38); g.lineTo(x+s*0.4,y-s*0.26); g.lineTo(x+s*0.34,y+s*0.04); g.lineTo(x,y-s*0.06); g.closePath(); g.fillPath();
    g.beginPath(); g.moveTo(x,y-s*0.38); g.lineTo(x-s*0.4,y-s*0.26); g.lineTo(x-s*0.34,y+s*0.04); g.lineTo(x,y-s*0.06); g.closePath(); g.fillPath(); },
  greatsword(g,x,y,s,c){ g.lineStyle(Math.max(3,s*0.15),c,1); g.lineBetween(x,y-s*0.46,x,y+s*0.3); g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x-s*0.22,y+s*0.16,x+s*0.22,y+s*0.16); g.lineBetween(x-s*0.07,y+s*0.34,x+s*0.07,y+s*0.34); },
  dualblade(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x-s*0.34,y+s*0.36,x+s*0.34,y-s*0.36); g.lineBetween(x+s*0.34,y+s*0.36,x-s*0.34,y-s*0.36); },
  dagger(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x,y-s*0.28,x,y+s*0.24); g.lineBetween(x-s*0.16,y+s*0.24,x+s*0.16,y+s*0.24); g.fillStyle(c,0.9); g.fillTriangle(x-s*0.07,y-s*0.26,x+s*0.07,y-s*0.26,x,y-s*0.44); },
  bow(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.beginPath(); g.arc(x-s*0.06,y,s*0.42,-Math.PI*0.5,Math.PI*0.5,false); g.strokePath(); g.lineStyle(Math.max(1.5,s*0.06),c,1); g.lineBetween(x-s*0.06,y-s*0.42,x-s*0.06,y+s*0.42); g.lineBetween(x-s*0.2,y,x+s*0.42,y); g.fillStyle(c,1); g.fillTriangle(x+s*0.42,y-s*0.07,x+s*0.42,y+s*0.07,x+s*0.52,y); },
  staff(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x,y-s*0.18,x,y+s*0.44); g.fillStyle(c,0.35); g.fillCircle(x,y-s*0.3,s*0.16); g.lineStyle(Math.max(2,s*0.09),c,1); g.strokeCircle(x,y-s*0.3,s*0.16); },
  magestaff(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x,y-s*0.16,x,y+s*0.44); g.fillStyle(c,1); _starPath(g,x,y-s*0.3,s*0.2,s*0.09,4); g.fillPath(); },
  armor(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.16); g.beginPath();
    g.moveTo(x-s*0.3,y-s*0.32); g.lineTo(x-s*0.08,y-s*0.32); g.lineTo(x,y-s*0.22); g.lineTo(x+s*0.08,y-s*0.32); g.lineTo(x+s*0.3,y-s*0.32);
    g.lineTo(x+s*0.34,y+s*0.08); g.lineTo(x,y+s*0.42); g.lineTo(x-s*0.34,y+s*0.08); g.closePath(); g.fillPath(); g.strokePath(); },
  robe(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.16); g.beginPath();
    g.moveTo(x-s*0.16,y-s*0.36); g.lineTo(x+s*0.16,y-s*0.36); g.lineTo(x+s*0.32,y+s*0.42); g.lineTo(x-s*0.32,y+s*0.42); g.closePath(); g.fillPath(); g.strokePath(); g.lineBetween(x,y-s*0.36,x,y+s*0.12); },
  helmet(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.16); g.beginPath(); g.arc(x,y-s*0.02,s*0.34,Math.PI,0,false); g.lineTo(x+s*0.34,y+s*0.2); g.lineTo(x-s*0.34,y+s*0.2); g.closePath(); g.fillPath(); g.strokePath(); g.fillStyle(0x07060f,0.85); g.fillRect(x-s*0.24,y-s*0.04,s*0.48,s*0.1); },
  potion(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.45); g.fillCircle(x,y+s*0.12,s*0.26); g.strokeCircle(x,y+s*0.12,s*0.26); g.fillStyle(c,1); g.fillRect(x-s*0.08,y-s*0.34,s*0.16,s*0.22); g.lineBetween(x-s*0.13,y-s*0.34,x+s*0.13,y-s*0.34); },
  scroll(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.16); g.fillRoundedRect(x-s*0.26,y-s*0.3,s*0.52,s*0.6,s*0.06); g.strokeRoundedRect(x-s*0.26,y-s*0.3,s*0.52,s*0.6,s*0.06); g.lineBetween(x-s*0.14,y-s*0.12,x+s*0.14,y-s*0.12); g.lineBetween(x-s*0.14,y,x+s*0.14,y); g.lineBetween(x-s*0.14,y+s*0.12,x+s*0.14,y+s*0.12); },
  seed(g,x,y,s,c){ g.fillStyle(c,0.85); g.fillEllipse(x,y+s*0.14,s*0.32,s*0.44); g.lineStyle(Math.max(2,s*0.09),c,1); g.lineBetween(x,y+s*0.12,x,y-s*0.28); g.beginPath(); g.arc(x+s*0.1,y-s*0.2,s*0.13,Math.PI,Math.PI*1.85,false); g.strokePath(); },
  gem(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.fillStyle(c,0.4); g.beginPath(); g.moveTo(x,y-s*0.3); g.lineTo(x+s*0.3,y-s*0.06); g.lineTo(x,y+s*0.34); g.lineTo(x-s*0.3,y-s*0.06); g.closePath(); g.fillPath(); g.strokePath(); g.lineBetween(x-s*0.3,y-s*0.06,x+s*0.3,y-s*0.06); },
  stun(g,x,y,s,c){ g.fillStyle(c,1); for(let i=0;i<3;i++){ const a=-s*0.26+i*s*0.26; _starPath(g, x+a, y-s*0.16-Math.abs(a)*0.45, s*0.12, s*0.05, 4); g.fillPath(); } g.lineStyle(Math.max(1.5,s*0.07),c,0.8); g.beginPath(); g.arc(x,y+s*0.14,s*0.28,Math.PI*0.12,Math.PI*0.88,false); g.strokePath(); },
  smash(g,x,y,s,c){ g.fillStyle(c,1); _starPath(g,x,y,s*0.46,s*0.16,4); g.fillPath(); g.fillStyle(_mix(c,0xffffff,0.55),1); g.fillCircle(x,y,s*0.1); },
  target(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.strokeCircle(x,y,s*0.32); g.lineBetween(x-s*0.46,y,x-s*0.2,y); g.lineBetween(x+s*0.2,y,x+s*0.46,y); g.lineBetween(x,y-s*0.46,x,y-s*0.2); g.lineBetween(x,y+s*0.2,x,y+s*0.46); g.fillStyle(c,1); g.fillCircle(x,y,s*0.08); },
  eye(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.09),c,1); g.beginPath(); g.arc(x,y+s*0.32,s*0.4,Math.PI*1.18,Math.PI*1.82,false); g.strokePath(); g.beginPath(); g.arc(x,y-s*0.32,s*0.4,Math.PI*0.18,Math.PI*0.82,false); g.strokePath(); g.fillStyle(c,1); g.fillCircle(x,y,s*0.14); },
  fireball(g,x,y,s,c){ g.fillStyle(c,0.9); g.fillCircle(x,y+s*0.08,s*0.3); g.fillStyle(c,1); g.beginPath(); g.moveTo(x,y-s*0.44); g.lineTo(x+s*0.16,y-s*0.08); g.lineTo(x-s*0.16,y-s*0.08); g.closePath(); g.fillPath(); g.fillStyle(_mix(c,0xffffff,0.55),1); g.fillCircle(x,y+s*0.1,s*0.11); },
  arrows(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.08),c,1); for(const dy of [-s*0.15,s*0.15]){ g.lineBetween(x-s*0.4,y+dy,x+s*0.32,y+dy); g.fillStyle(c,1); g.fillTriangle(x+s*0.32,y+dy-s*0.1,x+s*0.32,y+dy+s*0.1,x+s*0.46,y+dy); } },
  sparkle(g,x,y,s,c){ g.fillStyle(c,1); _starPath(g,x-s*0.08,y-s*0.06,s*0.38,s*0.12,4); g.fillPath(); g.fillStyle(_mix(c,0xffffff,0.4),1); _starPath(g,x+s*0.26,y+s*0.24,s*0.16,s*0.05,4); g.fillPath(); },
  heal(g,x,y,s,c){ g.fillStyle(c,0.22); g.fillCircle(x,y,s*0.42); g.lineStyle(Math.max(2,s*0.09),c,1); g.strokeCircle(x,y,s*0.42); g.fillStyle(c,1); g.fillRect(x-s*0.07,y-s*0.26,s*0.14,s*0.52); g.fillRect(x-s*0.26,y-s*0.07,s*0.52,s*0.14); },
  reflect(g,x,y,s,c){ g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x+s*0.3,y-s*0.4,x+s*0.3,y+s*0.4); g.lineBetween(x-s*0.38,y-s*0.24,x+s*0.16,y-s*0.04); g.fillStyle(c,1); g.fillTriangle(x-s*0.38,y-s*0.34,x-s*0.38,y-s*0.12,x-s*0.2,y-s*0.23); g.lineBetween(x+s*0.16,y-s*0.04,x-s*0.32,y+s*0.2); },
  fortify(g,x,y,s,c){ ICONS.shield(g,x,y,s,c); g.lineStyle(Math.max(2,s*0.1),c,1); g.lineBetween(x-s*0.14,y+s*0.06,x,y-s*0.12); g.lineBetween(x,y-s*0.12,x+s*0.14,y+s*0.06); },
  ward(g,x,y,s,c){ ICONS.shield(g,x,y,s,c); g.fillStyle(c,1); g.fillRect(x-s*0.05,y-s*0.16,s*0.1,s*0.3); g.fillRect(x-s*0.15,y-s*0.06,s*0.3,s*0.1); },
};
function _starPath(g,cx,cy,outer,inner,points){ g.beginPath(); for(let i=0;i<points*2;i++){ const rad=i%2?inner:outer, a=-Math.PI/2+i*Math.PI/points, px=cx+Math.cos(a)*rad, py=cy+Math.sin(a)*rad; if(i===0)g.moveTo(px,py); else g.lineTo(px,py);} g.closePath(); }

function pips(scene,x,y,n,col){ const c=scene.add.container(x,y); const g=scene.add.graphics(); c.add(g); const gap=15;
  for(let i=0;i<n;i++){ g.fillStyle(col,1); _starPath(g, i*gap, 0, 6, 2.6, 5); g.fillPath(); } c.w=(n-1)*gap; return c; }

function attachTip(scene, target, text, opt){
  opt=opt||{}; if(!target.input) target.setInteractive({useHandCursor:opt.cursor!==false});
  let tip=null;
  const show=(p)=>{ if(tip) tip.destroy(); const ac=accent(opt.accent||'gold');
    const t=txt(scene,0,0,text,opt.size||11,UI.text,0).setWordWrapWidth(opt.width||220); const w=Math.min(opt.width||220,t.width)+18, h=t.height+14;
    tip=scene.add.container(0,0).setDepth(200); const g=scene.add.graphics();
    g.fillStyle(0x000000,0.5); g.fillRoundedRect(2,4,w,h,8); g.fillStyle(UI.panelHiN,0.98); g.fillRoundedRect(0,0,w,h,8); g.lineStyle(1.5,ac.num,0.9); g.strokeRoundedRect(0,0,w,h,8);
    t.setPosition(9,7); tip.add([g,t]);
    let tx=(p?p.worldX:target.x)+14, ty=(p?p.worldY:target.y)+14; tx=Math.min(tx, scene.scale.width-w-6); ty=Math.min(ty, scene.scale.height-h-6);
    tip.setPosition(tx,ty); };
  target.on('pointerover',show); target.on('pointermove',show); target.on('pointerout',()=>{ if(tip){tip.destroy(); tip=null;} });
}

function buildTextures(scene){
  for(const key in SPRITES){
    if(scene.textures.exists(key)) continue;
    const grid=SPRITES[key], hh=grid.length, ww=Math.max(...grid.map(r=>r.length));
    const tex=scene.textures.createCanvas(key,ww,hh), ctx=tex.getContext();
    for(let y=0;y<hh;y++){ const row=grid[y]; for(let x=0;x<row.length;x++){ const col=PAL[row[x]]; if(!col) continue; ctx.fillStyle=col; ctx.fillRect(x,y,1,1);} }
    tex.refresh();
  }
  if(!scene.textures.exists('wall')){
    const t=scene.textures.createCanvas('wall',32,32), c=t.getContext();
    c.fillStyle='#161228'; c.fillRect(0,0,32,32);
    for(let row=0;row<4;row++){ const y=row*8; for(let bx=-1;bx<3;bx++){ const x=bx*16+(row%2?8:0);
      c.fillStyle=((row+bx)%2)?'#2a2346':'#221b3c'; c.fillRect(x+1,y+1,14,6); c.fillStyle='#39306a'; c.fillRect(x+1,y+1,14,1);} }
    t.refresh();
  }
  if(!scene.textures.exists('floor')){
    const t=scene.textures.createCanvas('floor',32,32), c=t.getContext();
    c.fillStyle='#100c20'; c.fillRect(0,0,32,32);
    c.fillStyle='#1b1636'; c.fillRect(1,1,30,14); c.fillRect(1,17,14,14); c.fillRect(17,17,14,14);
    c.fillStyle='#241d42'; c.fillRect(1,1,30,2); c.fillRect(1,17,14,2); c.fillRect(17,17,14,2);
    t.refresh();
  }
}

function pixelNum(scene,x,y,str,color,big){
  const s=big?6:4, cw=3*s, gap=s, total=str.length*(cw+gap)-gap, h=5*s;
  const cont=scene.add.container(x,y).setDepth(80);
  const draw=(off,col)=>{ let cx=-total/2; for(const ch of str){ const pat=GLYPH[ch];
    if(pat){ for(let ry=0;ry<5;ry++)for(let rx=0;rx<3;rx++){ if(pat[ry][rx]==='1') cont.add(scene.add.rectangle(cx+rx*s+off,ry*s+off-h/2,s,s,col).setOrigin(0)); } }
    cx+=cw+gap; } };
  draw(big?3:s,0x000000); draw(0,color);
  cont.setScale(big?0.4:0.6);
  scene.tweens.add({targets:cont,scale:big?1.35:1,duration:150,ease:'Back.out'});
  scene.tweens.add({targets:cont,y:y-(big?62:48),alpha:0,duration:big?950:800,delay:big?170:120,ease:'Quad.out',onComplete:()=>cont.destroy()});
}
