// ========================= 倉庫 ・ 收藏（格狀圖鑑）v0.9 =========================
class WarehouseHall extends Phaser.Scene {
  constructor(){ super('WarehouseHall'); }
  create(){
    if(!RUN) initRun();
    syncDiscovered();
    const W=this.scale.width;
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'圖 鑑 ・ 收 藏','',{accent:'gold'});
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});


    const cats=[
      {label:'武器', accent:'teal', items:WEAPONS, kind:'武器'},
      {label:'防具', accent:'blue', items:ARMORS, kind:'防具'},
      {label:'道具', accent:'green', items:LOOT.consum.map(n=>({name:n})), kind:'道具'},
      {label:'貴重', accent:'gold', items:LOOT.valuable.map(n=>({name:n})), kind:'貴重物品'},
    ];
    let total=0, got=0;
    cats.forEach(c=>{ c.items.forEach(it=>{ total++; if(this.lit(c.kind,it.name)) got++; }); });
    const pc=chip(this, 0, 20, {label:'收藏 '+got+' / '+total, accent:'gold', icon:'bag', size:12, h:26}); pc.setX(W-14-pc.w);

    // 三區段固定格位
    const sz=44, pitch=56, x0=35+sz/2;
    const rowsY=[114,186,258,330], labelY=[78,150,222,294];
    cats.forEach((c,ci)=>{
      const gotC=c.items.filter(it=>this.lit(c.kind,it.name)).length;
      const lb=txt(this, 35, labelY[ci], c.label, 13, accent(c.accent).hex, 0, 0.5);
      txt(this, 35+lb.width+12, labelY[ci], gotC+' / '+c.items.length, 11, UI.dim, 0, 0.5);
      c.items.forEach((it,i)=>{ this.slot(x0+i*pitch, rowsY[ci], sz, it, c.kind); });
    });

    // 詳細面板
    this.det=panel(this, W/2, 462, 866, 138, {accent:'gold', title:'物品資訊', icon:'bag', titleSize:14});
    this._det=[];
    this.showDetail(null,null,false);
  }
  lit(kind,name){ return (kind==='武器'||kind==='防具')? gearOwned(name) : itemDiscovered(name); }
  slot(x,y,sz,item,kind){
    const disc=this.lit(kind,item.name), v=disc?itemVisual(item.name):null, ac=disc?accent(v.accent):accent('slate');
    const g=this.add.graphics();
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,9);
    g.fillStyle(disc?UI.raisedN:UI.panelN, disc?1:0.55); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(disc){ g.fillStyle(ac.deep,0.4); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz*0.5,9); }
    g.lineStyle(2, disc?ac.num:UI.lineN, disc?0.9:0.35); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(disc){ icon(this, x, y-2, v.icon, sz*0.52, ac.num); }
    else { txt(this, x, y, '?', sz*0.42, UI.faint); }
    const hit=this.add.rectangle(x,y,sz,sz,0xffffff,0.001).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>this.showDetail(item,kind,disc));
  }
  showDetail(item,kind,disc){
    if(this._det) this._det.forEach(o=>o.destroy());
    this._det=[]; const p=this.det, add=o=>{this._det.push(o);return o;};
    const ix=p.left+50, tx=p.left+96, ty=p.bodyTop+2;
    if(!item){ add(txt(this, p.cx, p.bodyTop+34, '把游標移到物品格上，查看詳細資訊', 13, UI.dim)); return; }
    if(!disc){
      add(icon(this, ix, p.bodyTop+34, 'box', 40, UI.lineN));
      add(txt(this, tx, ty+8, '？？？（尚未取得）', 16, UI.faint, 0));
      add(txt(this, tx, ty+34, '繼續探險地城，取得後就會在此解鎖並顯示完整資訊。', 12, UI.dim, 0));
      return;
    }
    const v=itemVisual(item.name), ac=accent(v.accent);
    add(this.add.graphics().fillStyle(ac.deep,0.5).fillRoundedRect(ix-30,p.bodyTop+8,60,60,10));
    add(icon(this, ix, p.bodyTop+38, v.icon, 42, ac.num));
    add(txt(this, tx, ty+10, item.name, 18, ac.hex, 0));
    if(kind==='武器'){
      add(txt(this, tx, ty+38, '武器 ・ '+weaponClassLabel(item)+'　|　傷害 '+item.atkSeq.join(' / ')+(item.heal?'　|　治療 '+item.heal:'')+'　|　需求 Lv'+item.lvReq, 12, UI.text, 0));
      if(item.traitDesc) add(txt(this, tx, ty+62, '特效：'+item.traitDesc, 12, UI.gold, 0));
    } else if(kind==='防具'){
      add(txt(this, tx, ty+38, '防具 ・ '+armorClassLabel(item)+'　|　防禦 '+item.def+'　|　護盾 +'+item.hp+'　|　需求 Lv'+item.lvReq, 12, UI.text, 0));
      if(item.traitDesc) add(txt(this, tx, ty+62, '特效：'+item.traitDesc, 12, UI.gold, 0));
    } else if(kind==='貴重物品'){
      add(txt(this, tx, ty+38, '貴重物品 ・ 探險中可在地城商店變賣為 💰（每趟）', 12, UI.text, 0));
      add(txt(this, tx, ty+62, '越深的地城、階級越高的貴重物品越值錢', 12, UI.gold, 0));
    } else {
      add(txt(this, tx, ty+38, '道具 ・ 探險中使用', 12, UI.text, 0));
      add(txt(this, tx, ty+62, (CONSUM_INFO[item.name]||''), 12, UI.green, 0));
    }
    if(kind==='武器'||kind==='防具'){ add(txt(this, p.right-20, ty+10, '已擁有', 12, UI.green, 1)); }
    else { add(txt(this, p.right-20, ty+10, disc?'已發現':'未發現', 12, disc?UI.green:UI.dim, 1)); }
  }
}
