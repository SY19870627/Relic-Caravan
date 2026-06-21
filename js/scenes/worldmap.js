// ========================= 世界地圖（v2.2：多世界・左右切換）=========================
let WORLDMAP_VIEW = 0;   // 目前檢視的世界索引（跨場景記住）
class WorldMap extends Phaser.Scene {
  constructor(){ super('WorldMap'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    const w=Phaser.Math.Clamp(WORLDMAP_VIEW,0,WORLD_COUNT-1); WORLDMAP_VIEW=w;
    const wt=worldTheme(w), meta=WORLD_META[w]||{name:'世界 '+(w+1),sub:'',accent:wt.accent};
    sceneBg(this,{top:wt.top, bottom:wt.bottom, glow:wt.glow});
    sceneHeader(this,'世 界 地 圖','選擇目的地：越遠越危險、遺物階級越高',{accent:meta.accent});

    // 世界標題 + 進度點
    const wac=accent(meta.accent);
    const titleChip=chip(this, W/2, 84, {label:meta.name+'　·　'+meta.sub, accent:meta.accent, size:14, h:30, filled:true, textColor:UI.white});
    titleChip.setX(W/2 - titleChip.w/2);
    for(let i=0;i<WORLD_COUNT;i++){ const dx=W/2-(WORLD_COUNT-1)*9 + i*18;
      const dot=this.add.graphics(); dot.fillStyle(i===w?wac.num:UI.lineN, i===w?1:0.5); dot.fillCircle(dx,108,4); }

    const rep=repEarned();
    const dests=destsOfWorld(w);   // 該世界的地城全域索引（0-3 或 4-7）
    dests.forEach((di,i)=>{
      const d=DESTINATIONS[di], cy=150+i*92, ac=accent(tierAccentName(d.tier));
      const lockedRep=rep<d.repReq, ok=!lockedRep;
      const L=W/2-380, ww=760, h=82, top=cy-h/2;
      const g=this.add.graphics();
      g.fillStyle(0x000000,0.34); g.fillRoundedRect(L,top+4,ww,h,12);
      g.fillStyle(ok?UI.raisedN:UI.panelN, ok?1:0.7); g.fillRoundedRect(L,top,ww,h,12);
      g.fillStyle(UI.panelHiN,0.4); g.fillRoundedRect(L,top,ww,h*0.4,12);
      g.lineStyle(2, ac.num, ok?0.9:0.4); g.strokeRoundedRect(L,top,ww,h,12);
      g.fillStyle(ac.num, ok?1:0.4); g.fillRoundedRect(L,top,5,h,{tl:12,bl:12,tr:0,br:0});
      icon(this, L+34, cy, 'pin', 24, ok?ac.num:UI.lineN);
      txt(this, L+62, top+18, d.name, 17, ok?ac.hex:UI.faint, 0);
      txt(this, L+62, top+42, d.desc, 11, UI.dim, 0).setWordWrapWidth(440);
      txt(this, L+62, top+64, '危險/遺物', 10.5, UI.faint, 0);
      pips(this, L+140, top+64, d.tier, ac.num);
      if(ok){
        button(this, L+ww-90, cy, 150, 44, '前 往', ()=>this.go(di), {variant:'go', size:16, icon:'play', iconSize:15});
      } else {
        const cc=chip(this, 0, cy, {label:'需聲望 '+d.repReq, accent:'red', size:13, h:30, filled:true, textColor:UI.white}); cc.setX(L+ww-90-cc.w/2);
      }
    });

    // 左右世界切換箭頭（端點顯示為灰色不可按）
    if(w>0) this.worldArrow(46, H/2-6, -1, WORLD_META[w-1]); else this.arrowGhost(46, H/2-6, -1);
    if(w<WORLD_COUNT-1) this.worldArrow(W-46, H/2-6, 1, WORLD_META[w+1]); else this.arrowGhost(W-46, H/2-6, 1);

    button(this, 100, H-34, 170, 38, '返回整備', ()=>this.scene.start('Outfit'), {variant:'info', size:13, icon:'home', iconSize:13});
  }
  worldArrow(x,y,dir,meta){
    const ac=accent((meta&&meta.accent)||'gold');
    const c=this.add.container(x,y);
    const g=this.add.graphics(); c.add(g);
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(-26,-31,52,68,12);
    g.fillStyle(UI.raisedN,1); g.fillRoundedRect(-26,-34,52,68,12);
    g.lineStyle(2,ac.num,0.9); g.strokeRoundedRect(-26,-34,52,68,12);
    g.fillStyle(ac.num,1);
    const tip=dir<0?-9:9, back=dir<0?9:-9;
    g.beginPath(); g.moveTo(tip,0); g.lineTo(back,-14); g.lineTo(back,14); g.closePath(); g.fillPath();
    const hit=this.add.rectangle(x,y,54,70,0xffffff,0.001).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>c.setScale(1.08)); hit.on('pointerout',()=>c.setScale(1));
    hit.on('pointerdown',()=>{ WORLDMAP_VIEW = Phaser.Math.Clamp(w_dir(WORLDMAP_VIEW,dir),0,WORLD_COUNT-1); this.scene.restart(); });
    if(meta) txt(this, x, y+48, '切換 · '+meta.name, 10, UI.dim);
  }
  arrowGhost(x,y,dir){
    const g=this.add.graphics();
    g.fillStyle(UI.panelN,0.4); g.fillRoundedRect(x-26,y-34,52,68,12);
    g.lineStyle(2,UI.lineN,0.3); g.strokeRoundedRect(x-26,y-34,52,68,12);
    g.fillStyle(UI.lineN,0.5);
    const tip=dir<0?x-9:x+9, back=dir<0?x+9:x-9;
    g.beginPath(); g.moveTo(tip,y); g.lineTo(back,y-14); g.lineTo(back,y+14); g.closePath(); g.fillPath();
  }
  go(di){
    const d=DESTINATIONS[di];
    RUN.destTier = d.tier; RUN.destName = d.name; RUN.destIndex = di;
    initExpedition();          // v1.0：單一戰鬥畫面的遠征，探險 % 推進
    this.scene.start('Battle');
  }
}
function w_dir(v,dir){ return (v||0)+dir; }   // 箭頭方向位移（封頂由呼叫端 Clamp 處理）
