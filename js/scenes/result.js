// ========================= 結算（v0.9 重塑）=========================
class Result extends Phaser.Scene {
  constructor(){ super('Result'); }
  create(data){
    const W=this.scale.width,H=this.scale.height;
    const o=data.outcome;
    let title,acc,note,keep;
    if(o==='clear'){ title='完整通關！'; acc='gold'; note='抵達遺物室並擊敗守護者，滿載而歸'; keep=true; }
    else if(o==='retreat'){ title='撤退收工'; acc='teal'; note='見好就收，平安帶著沿途戰利品返回'; keep=true; }
    else { title='全員倒下'; acc='red'; note='傳送卷軸啟動 — 平安歸來，但貨車戰利品全失，僅保留身上裝備'; keep=false; }
    const A=accent(acc);
    sceneBg(this,{glow:A.num});
    const t=txt(this,W/2,72,title,38,A.hex).setStroke('#07060f',6).setShadow(0,3,'#000',8,false,true);
    txt(this,W/2,118,note,14,UI.text);

    if(!keep){
      const p=panel(this,W/2,300,560,150,{accent:'red',title:'貨車戰利品全失',icon:'skull',titleSize:15});
      txt(this,W/2,p.bodyTop+18,'貨車上的一切都留在了地城深處…',15,UI.red);
      txt(this,W/2,p.bodyTop+44,'（損失 '+RUN.cargo.length+' 件戰利品）',12,UI.dim);
      txt(this,W/2,p.bodyTop+74,'隊員身上的武器與防具得以保留，下次再來。',13,UI.text);
      button(this,W/2,470,240,46,'回公會大廳',()=>{ initRun(); this.scene.start('GuildHall'); },{variant:'go',size:17,icon:'home',iconSize:16});
      return;
    }
    const relics=RUN.cargo.filter(i=>i.kind==='遺物');
    const resources=RUN.cargo.filter(i=>i.kind==='素材'||i.kind==='食材');
    // 武器/防具：唯一擁有——新裝備納入收藏、重複只能賣出
    const gear=RUN.cargo.filter(i=>i.kind==='武器'||i.kind==='防具');
    this.gearNew=gear.filter(it=>!gearOwned(it.name)); this.gearDup=gear.filter(it=>gearOwned(it.name));
    this.others=RUN.cargo.filter(i=>i.kind==='道具'||i.kind==='貴重物品').sort((a,b)=> (a.kind==='貴重物品'?1:0)-(b.kind==='貴重物品'?1:0) || b.value-a.value);
    this.others.forEach(it=>{ if(it._keep===undefined) it._keep=(it.kind==='道具'); });

    const pnl=panel(this,W/2,346,720,356,{accent:acc,title:'戰利品結算　·　勾選保留，其餘賣成資金',icon:'chest',titleSize:15});
    this.bodyTop=pnl.bodyTop;
    let yy=pnl.bodyTop+4;
    if(relics.length){ const rc=chip(this,0,yy+8,{label:'遺物 ×'+relics.length+'　'+relics.map(r=>r.name).join('、')+'　→ 入收藏即時生效',accent:'violet',icon:'relic',size:11,h:24}); rc.setX(W/2-rc.w/2); }
    else txt(this,W/2,yy+8,'（本趟沒有帶回遺物）',12,UI.faint);
    yy+=30;
    if(resources.length){ const rcc={}; resources.forEach(r=>rcc[r.name]=(rcc[r.name]||0)+1);
      const rs=chip(this,0,yy+8,{label:'素材／食材　'+Object.keys(rcc).map(k=>k+'×'+rcc[k]).join('  ')+'　→ 自動入庫',accent:'teal',size:11,h:22}); rs.setX(W/2-rs.w/2); yy+=26; }
    if(this.gearNew.length||this.gearDup.length){ const dupVal=this.gearDup.reduce((a,b)=>a+(b.value||0),0);
      const parts=[]; if(this.gearNew.length)parts.push('新裝備 '+this.gearNew.map(g=>g.name).join('、')+' 納入收藏'); if(this.gearDup.length)parts.push('重複 ×'+this.gearDup.length+' 賣出 ＄'+dupVal);
      const gs=chip(this,0,yy+8,{label:'裝備　'+parts.join('　·　'),accent:'gold',icon:'sword',size:11,h:22}); gs.setX(W/2-gs.w/2); yy+=26; }

    button(this, W/2-180, yy+12, 160, 28, '全部保留', ()=>{ this.others.forEach(it=>it._keep=true); this.renderList(); }, {variant:'go',size:12});
    button(this, W/2+180, yy+12, 160, 28, '全部賣出', ()=>{ this.others.forEach(it=>it._keep=false); this.renderList(); }, {variant:'gold',size:12});
    this.listTop=yy+40;
    this.listGroup=[];
    this.renderList();
    button(this,W/2,524,240,42,'帶回公會',()=>{
      RUN.cargo.forEach(it=>{
        if(it.kind==='遺物'){ if(it.relicId && !GUILD.relics.includes(it.relicId)) GUILD.relics.push(it.relicId); }
        else if(it.kind==='素材'){ addMaterial(it.matId); }
        else if(it.kind==='食材'){ addIngredient(it.ingId); }
        else if(it.kind==='武器'||it.kind==='防具'){ if(gearOwned(it.name)) GUILD.funds+=it.value; else ownGear(it.name); }
        else { discover(it.name); if(it._keep) GUILD.stash.push(it); else GUILD.funds+=it.value; } });
      saveGuild(); initRun(); this.scene.start('GuildHall');
    },{variant:'go',size:17,icon:'home',iconSize:16});
  }
  renderList(){
    const W=this.scale.width;
    if(this.listGroup) this.listGroup.forEach(o=>o.destroy());
    this.listGroup=[];
    let y=this.listTop; const cap=6;
    if(!this.others.length) this.listGroup.push(txt(this,W/2,y+6,'沒有其他雜物',13,UI.dim));
    this.others.slice(0,cap).forEach(it=>{
      const gear=(it.kind==='武器'||it.kind==='防具'), row=this.add.graphics();
      row.fillStyle(it._keep?0x1f2c22:UI.panelN, 0.9); row.fillRoundedRect(W/2-330,y-15,660,30,8);
      row.lineStyle(1.5, it._keep?UI.greenN:UI.lineN, 0.7); row.strokeRoundedRect(W/2-330,y-15,660,30,8);
      this.listGroup.push(row);
      this.listGroup.push(icon(this, W/2-312, y, gear?(it.kind==='武器'?'sword':'shield'):(it.kind==='貴重物品'?'coin':'flame'), 15, gear?UI.tealN:UI.goldN));
      this.listGroup.push(txt(this,W/2-296,y,it.name,13, gear?UI.teal:UI.text,0));
      this.listGroup.push(txt(this,W/2-120,y,it.kind,11,UI.dim,0));
      this.listGroup.push(txt(this,W/2-10,y,'價值 '+it.value,11,UI.green,0));
      this.listGroup.push(button(this, W/2+255, y, 120,26, it._keep?'保留':'賣出', ()=>{ it._keep=!it._keep; this.renderList(); },
        {variant: it._keep?'go':'gold', size:12}));
      y+=36;
    });
    if(this.others.length>cap){ this.listGroup.push(txt(this,W/2,y,'…及其餘 '+(this.others.length-cap)+' 件（依目前設定處理）',11,UI.dim)); y+=22; }
    const sell=this.others.filter(i=>!i._keep).reduce((a,b)=>a+b.value,0);
    const kept=this.others.filter(i=>i._keep); const keptVal=kept.reduce((a,b)=>a+b.value,0);
    this.listGroup.push(txt(this,W/2, 488, '賣出得 ＄'+sell+'（公會現有 ＄'+GUILD.funds+'）　·　保留 '+kept.length+' 件（價值 '+keptVal+'）',13,UI.green));
  }
}
