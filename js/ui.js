// ========================= 共用繪圖 =========================
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
    c.fillStyle='#1d1528'; c.fillRect(0,0,32,32);
    for(let row=0;row<4;row++){ const y=row*8; for(let bx=-1;bx<3;bx++){ const x=bx*16+(row%2?8:0);
      c.fillStyle=((row+bx)%2)?'#352843':'#2c2038'; c.fillRect(x+1,y+1,14,6); c.fillStyle='#3f3150'; c.fillRect(x+1,y+1,14,1);} }
    t.refresh();
  }
  if(!scene.textures.exists('floor')){
    const t=scene.textures.createCanvas('floor',32,32), c=t.getContext();
    c.fillStyle='#140f1d'; c.fillRect(0,0,32,32);
    c.fillStyle='#211a30'; c.fillRect(1,1,30,14); c.fillRect(1,17,14,14); c.fillRect(17,17,14,14);
    c.fillStyle='#2a2240'; c.fillRect(1,1,30,2); c.fillRect(1,17,14,2); c.fillRect(17,17,14,2);
    t.refresh();
  }
}
function txt(scene,x,y,s,size,color,origin){
  return scene.add.text(x,y,s,{fontFamily:'"Noto Sans TC",sans-serif',fontSize:size+'px',color:color||TH.text}).setOrigin(origin===undefined?0.5:origin);
}
function pixelNum(scene,x,y,str,color,big){
  const s=big?6:4, cw=3*s, gap=s, total=str.length*(cw+gap)-gap, h=5*s;
  const cont=scene.add.container(x,y).setDepth(80);  // 置中於 (x,y)，方便彈跳縮放
  const draw=(off,col)=>{ let cx=-total/2; for(const ch of str){ const pat=GLYPH[ch];
    if(pat){ for(let ry=0;ry<5;ry++)for(let rx=0;rx<3;rx++){ if(pat[ry][rx]==='1') cont.add(scene.add.rectangle(cx+rx*s+off,ry*s+off-h/2,s,s,col).setOrigin(0)); } }
    cx+=cw+gap; } };
  draw(big?3:s,0x000000); draw(0,color);
  cont.setScale(big?0.4:0.6);
  scene.tweens.add({targets:cont,scale:big?1.35:1,duration:150,ease:'Back.out'});           // 彈出放大
  scene.tweens.add({targets:cont,y:y-(big?62:48),alpha:0,duration:big?950:800,delay:big?170:120,ease:'Quad.out',onComplete:()=>cont.destroy()}); // 上浮淡出
}
function button(scene,x,y,w,h,label,onClick,opt){
  opt=opt||{};
  const g=scene.add.container(x,y);
  const bg=scene.add.rectangle(0,0,w,h,opt.fill??0x4a3f63).setStrokeStyle(2,opt.stroke??0x7a6f93);
  const t=txt(scene,0,0,label,opt.size||16,opt.color||'#fff');
  g.add([bg,t]);
  bg.setInteractive({useHandCursor:true})
    .on('pointerover',()=>bg.setFillStyle(opt.hover??0x6a5d8a))
    .on('pointerout',()=>bg.setFillStyle(opt.fill??0x4a3f63))
    .on('pointerdown',onClick);
  g.bg=bg; g.label=t;
  return g;
}
