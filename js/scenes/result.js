// ========================= 結算 =========================
class Result extends Phaser.Scene {
  constructor(){ super('Result'); }
  create(data){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.4);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.55).setOrigin(0);
    const o=data.outcome;
    let title,color,note,keep;
    if(o==='clear'){ title='完整通關！'; color=TH.gold; note='抵達遺物室並擊敗守護者，滿載而歸'; keep=true; }
    else if(o==='retreat'){ title='撤退收工'; color=TH.cyan; note='見好就收，平安帶著沿途戰利品返回'; keep=true; }
    else { title='全員倒下'; color=TH.red; note='傳送卷軸啟動 — 平安歸來，但貨車戰利品全失，僅保留身上裝備'; keep=false; }
    txt(this,W/2,80,title,40,color).setStroke('#000',6);
    txt(this,W/2,128,note,15,TH.text);

    if(!keep){
      // 全滅：貨車戰利品全失
      txt(this,W/2,250,'貨車上的一切都留在了地城深處…',16,TH.red);
      txt(this,W/2,290,`（損失 ${RUN.cargo.length} 件戰利品）`,13,TH.dim);
      txt(this,W/2,350,'隊員身上的武器與防具得以保留，下次再來。',14,TH.text);
      button(this,W/2,470,220,44,'⟳ 回公會大廳',()=>{ initRun(); this.scene.start('GuildHall'); },{size:18,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c});
      return;
    }
    // 完整通關／撤退：逐項勾選保留 or 賣出
    const relics=RUN.cargo.filter(i=>i.kind==='遺物');
    const resources=RUN.cargo.filter(i=>i.kind==='素材'||i.kind==='食材');   // 自動入庫
    const rank=it=>(it.kind==='武器'||it.kind==='防具')?0:(it.kind==='貴重物品'?1:2);
    this.others=RUN.cargo.filter(i=>i.kind!=='遺物'&&i.kind!=='素材'&&i.kind!=='食材').sort((a,b)=> rank(a)-rank(b) || b.value-a.value);
    // 預設：武器/防具保留，其餘賣出
    this.others.forEach(it=>{ if(it._keep===undefined) it._keep=(it.kind==='武器'||it.kind==='防具'); });
    this.add.rectangle(W/2,360,690,376,TH.panel).setStrokeStyle(2,0x3a3150);
    txt(this,W/2,182,'── 戰利品結算（勾選要保留的，其餘賣成資金）──',14,TH.gold);
    const relicVal=relics.reduce((a,b)=>a+(b.value||0),0);
    txt(this,W/2,206, relics.length?`🏛 遺物 ×${relics.length}（${relics.map(r=>r.name).join('、')}）自動入收藏 → 即時生效`:'（本趟沒有帶回遺物）',13, relics.length?TH.cyan:TH.dim).setWordWrapWidth(660);
    if(resources.length){ const rc={}; resources.forEach(r=>rc[r.icon+r.name]=(rc[r.icon+r.name]||0)+1);
      txt(this,W/2,252,'🛠 素材／食材 '+Object.keys(rc).map(k=>k+'×'+rc[k]).join('　')+' 自動入庫',12,'#cdeecd').setWordWrapWidth(660); }
    // 一鍵全保留 / 全賣出
    button(this, W/2-150, 232, 150, 26, '全部保留 ✓', ()=>{ this.others.forEach(it=>it._keep=true); this.renderList(); }, {size:12,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c});
    button(this, W/2+150, 232, 150, 26, '全部賣出 ＄', ()=>{ this.others.forEach(it=>it._keep=false); this.renderList(); }, {size:12,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c});
    this.listGroup=[];
    this.renderList();
    button(this,W/2,524,240,40,'✓ 帶回公會',()=>{
      RUN.cargo.forEach(it=>{ if(it.kind==='遺物'){ if(it.relicId && !GUILD.relics.includes(it.relicId)) GUILD.relics.push(it.relicId); }
        else if(it.kind==='素材'){ addMaterial(it.matId); }
        else if(it.kind==='食材'){ addIngredient(it.ingId); }
        else if(it._keep) GUILD.stash.push(it); else GUILD.funds+=it.value; });
      saveGuild(); initRun(); this.scene.start('GuildHall');
    },{size:17,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c});
  }
  renderList(){
    const W=this.scale.width;
    if(this.listGroup) this.listGroup.forEach(o=>o.destroy());
    this.listGroup=[];
    let y=266; const cap=7;
    if(!this.others.length) this.listGroup.push(txt(this,W/2,286,'沒有其他雜物',13,TH.dim));
    this.others.slice(0,cap).forEach(it=>{
      const gear=(it.kind==='武器'||it.kind==='防具');
      this.listGroup.push(txt(this,W/2-300,y,`${it.icon} ${it.name}`,14, gear?'#9fe8ff':TH.text,0));
      this.listGroup.push(txt(this,W/2-110,y,it.kind,12,TH.dim,0));
      this.listGroup.push(txt(this,W/2+10,y,`價值 ${it.value}`,12,'#cdeecd',0));
      const b=button(this, W/2+200, y, 120,26, it._keep?'保留 ✓':'賣出 ＄', ()=>{ it._keep=!it._keep; this.renderList(); },
        {size:13, fill: it._keep?0x3a6b3a:0x6b5a3a, stroke: it._keep?0x5ad06a:0xd0b05a});
      this.listGroup.push(b);
      y+=28;
    });
    if(this.others.length>cap){ this.listGroup.push(txt(this,W/2,y,`…及其餘 ${this.others.length-cap} 件（依目前設定處理；可用上方一鍵全保留/全賣出）`,11,TH.dim)); }
    const sell=this.others.filter(i=>!i._keep).reduce((a,b)=>a+b.value,0);
    const kept=this.others.filter(i=>i._keep);
    const keptVal=kept.reduce((a,b)=>a+b.value,0);
    this.listGroup.push(txt(this,W/2, 490, `💰 賣出得 ＄${sell}（公會現有 ＄${GUILD.funds}）　🎒 保留 ${kept.length} 件（價值 ${keptVal}）`,14,TH.green));
  }
}
