// ========================= 世界地圖（v0.9 重塑）=========================
class WorldMap extends Phaser.Scene {
  constructor(){ super('WorldMap'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'世 界 地 圖','選擇目的地：越遠越危險、遺物階級越高；旅途會先消耗食物',{accent:'gold'});

    const specs=[
      {label:'本趟食物 '+RUN.food, accent:'green', icon:'flame', size:12, h:25},
      {label:'貨格 '+RUN.slots, accent:'teal', icon:'box', size:12, h:25},
      {label:'聲望 '+reputation(), accent:'gold', icon:'star', size:12, h:25},
    ];
    const chips=specs.map(s=>chip(this,0,0,s)); let tot=chips.reduce((a,c)=>a+c.w,0)+10*(chips.length-1); let cx=W/2-tot/2; chips.forEach(c=>{c.setX(cx);c.setY(74);cx+=c.w+10;});

    const rep=repEarned(), accs=['teal','gold','violet','red'];
    DESTINATIONS.forEach((d,i)=>{
      const cy=120+i*98, ac=accent(accs[d.tier-1]||'teal');
      const lockedRep=rep<d.repReq, lockedFood=false, ok=!lockedRep;   // v0.9：食物改逐段扣，不在上路前先扣
      const L=W/2-380, w=760, h=86, top=cy-h/2;
      const g=this.add.graphics();
      g.fillStyle(0x000000,0.34); g.fillRoundedRect(L,top+4,w,h,12);
      g.fillStyle(ok?UI.raisedN:UI.panelN, ok?1:0.7); g.fillRoundedRect(L,top,w,h,12);
      g.fillStyle(UI.panelHiN,0.4); g.fillRoundedRect(L,top,w,h*0.4,12);
      g.lineStyle(2, ac.num, ok?0.9:0.4); g.strokeRoundedRect(L,top,w,h,12);
      g.fillStyle(ac.num, ok?1:0.4); g.fillRoundedRect(L,top,5,h,{tl:12,bl:12,tr:0,br:0});
      icon(this, L+34, cy, 'pin', 24, ok?ac.num:UI.lineN);
      txt(this, L+62, top+20, d.name, 17, ok?ac.hex:UI.faint, 0);
      txt(this, L+62, top+44, d.desc, 11, UI.dim, 0).setWordWrapWidth(440);
      // 風險/遺物階級 pips + 旅途
      txt(this, L+62, top+66, '危險/遺物', 10.5, UI.faint, 0);
      pips(this, L+140, top+66, d.tier, ac.num);
      const fc=chip(this, L+250, top+66, {label:'旅途 -'+d.travel+' 天 → 剩 '+Math.max(0,RUN.food-d.travel)+' 糧', accent: lockedFood?'red':'green', size:10.5, h:20});
      if(ok){
        button(this, L+w-90, cy, 150, 44, '前 往', ()=>this.go(d), {variant:'go', size:16, icon:'play', iconSize:15});
      } else {
        const cc=chip(this, 0, cy, {label: lockedRep?'需聲望 '+d.repReq:'食物不足', accent:'red', size:13, h:30, filled:true, textColor:UI.white}); cc.setX(L+w-90-cc.w/2);
      }
    });

    button(this, 100, H-34, 170, 38, '返回整備', ()=>this.scene.start('Outfit'), {variant:'info', size:13, icon:'home', iconSize:13});
  }
  go(d){
    const di = DESTINATIONS.indexOf(d);
    RUN.destTier = d.tier; RUN.destName = d.name; RUN.destIndex = di;
    RUN.map = genWorld(d.tier, GUILD.partySize||1);   // 每趟重畫；食物逐段扣
    this.scene.start('Map');
  }
}
