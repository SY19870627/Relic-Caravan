// ========================= 公會大廳 =========================
class GuildHall extends Phaser.Scene {
  constructor(){ super('GuildHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'公 會 大 廳',24,TH.gold);
    txt(this,W/2,48,'收集遺物即時生效 ・ 用資金升級設施 ・ 聲望（遺物種類）帶來開局贊助與解鎖',12,TH.dim);
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[];
    const W=this.scale.width,H=this.scale.height, add=o=>{this._ui.push(o);return o;};
    const bl=relicEffects(), sp=sponsorship();
    add(txt(this,W/2,72,`公會資金 ＄${GUILD.funds}　🏛 遺物 ${GUILD.relics.length}/${relicTotalCount()}　🎒 倉庫 ${GUILD.stash.length} 件　⭐ 聲望 ${reputation()}`,13,TH.gold));
    add(txt(this,W/2,94,`⚔ 目前隊形：${currentFormation().name}（${currentFormation().desc}）`,11,'#ffc0d0'));
    if(activeRoster().length<3){ add(txt(this,W/2,116,`👉 隊伍只有 ${activeRoster().length} 人！先到「招募所」免費招募遊俠與牧師，湊滿 3 人再出發`,12,'#ffd24a')); }

    // 遺物收藏（取代神殿：收集即時生效）
    add(this.add.rectangle(245,300,400,322,TH.panel).setStrokeStyle(2,0x5a8cd0).setOrigin(0.5));
    add(txt(this,245,158,'🏛 遺 物 收 藏',18,TH.cyan));
    add(txt(this,245,182,`已收集 ${GUILD.relics.length} / ${relicTotalCount()} 件（即時生效）`,13,TH.text));
    add(txt(this,245,204,`效果：${relicSummary(bl)}`,11,TH.green).setWordWrapWidth(380));
    let y=234; const ids=GUILD.relics||[], showN=7;
    if(!ids.length){ add(txt(this,245,y,'（尚無遺物——去地城帶回吧）',12,TH.dim)); }
    ids.slice(0,showN).forEach(id=>{ const r=RELIC_BY_ID[id]; if(!r) return; add(txt(this,245,y,`${r.icon} ${r.name}`,12,TH.cyan)); y+=20; });
    if(ids.length>showN){ add(txt(this,245,y,`…及其餘 ${ids.length-showN} 件`,12,TH.dim)); }
    add(txt(this,245,430,'每關有固定遺物清單，收齊為止；已得不再掉落',11,TH.dim).setWordWrapWidth(380));

    // 馬車・補給（項目化強化在「馬車工坊」）
    const ws=wagonStats();
    add(this.add.rectangle(655,300,400,322,TH.panel).setStrokeStyle(2,0x5a8cd0).setOrigin(0.5));
    add(txt(this,655,158,'🛠 馬 車 ・ 補 給',18,'#ffd24a'));
    add(txt(this,655,188,`馬匹：${ws.horse}`,13,TH.text));
    add(txt(this,655,212,`本趟 🍖 食物 ${ws.food}　📦 貨格 ${ws.slots}`,13,TH.green));
    add(txt(this,655,236,`工匠：${['未聘僱','學徒','師傅','大師'][craftsmanTier()]}　已強化 ${Object.keys(GUILD.upgrades||{}).length} 項`,12,TH.cyan));
    add(txt(this,655,288,`⭐ 聲望贊助（Tier ${reputationTier()}）`,13,TH.gold));
    add(txt(this,655,312,`出發時 🍖 食物 +${sp.food}　＄ 資金 +${sp.funds}`,12,TH.cyan));
    add(txt(this,655,338,'收集越多遺物 → 聲望越高 → 贊助越豐厚',11,TH.dim));
    add(button(this,655,438,320,38,'🛠 前往馬車工坊（選馬・強化）',()=>this.scene.start('WagonHall'),{size:13,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c}));

    // 作弊（測試用）：給資源
    add(button(this, W-110, 26, 190, 26, '🐞 作弊：+資源', ()=>{
      GUILD.funds+=500;
      const left=RELIC_CATALOG.filter(r=>!GUILD.relics.includes(r.id));
      if(left.length) GUILD.relics.push(Phaser.Utils.Array.GetRandom(left).id);
      const w=Phaser.Utils.Array.GetRandom(WEAPONS);
      GUILD.stash.push({kind:'武器',name:w.name,icon:'⚔',value:50,gear:w});
      saveGuild(); this.render();
    },{size:11,fill:0x6b3a5a,stroke:0xd05a9a,hover:0x8c4c7a}));
    add(button(this, 96, 26, 150, 26, '🗑 重置存檔', ()=>{
      resetSave();
      initRun();   // 重建隊伍，裝備回到預設（否則整備畫面會沿用舊 RUN 的裝備）
      this.render();
    },{size:11,fill:0x6b5a3a,stroke:0xd0b05a,hover:0x8c7a4c}));

    // 建築入口（兩排）
    const bs={size:11,fill:0x4a3f63,stroke:0x9a7fd0,hover:0x6a5d8a};
    add(button(this,  96, 482, 110, 30, '🧑 角色所',     ()=>this.scene.start('CharacterHall'), bs));
    add(button(this, 213, 482, 110, 30, '🧑‍🤝‍🧑 招募所',   ()=>this.scene.start('RecruitHall'),    bs));
    add(button(this, 320, 482,  88, 30, '⚔ 隊形',        ()=>this.scene.start('FormationHall'),  bs));
    add(button(this, 432, 482,  96, 30, '🏋 訓練所',      ()=>this.scene.start('TrainingHall'),   bs));
    add(button(this,  98, 516, 150, 30, '🛒 馬車強化所',   ()=>this.scene.start('WagonHall'),      bs));
    add(button(this, 213, 516,  80, 30, '📦 倉庫',        ()=>this.scene.start('WarehouseHall'),  bs));
    add(button(this, 320, 516,  96, 30, '💰 商會',        ()=>this.scene.start('MerchantHall'),   bs));
    add(button(this, W/2+150, 499, 240, 44, '▶ 前往整備出發', ()=>{ this.scene.start('Outfit'); }, {size:15,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c}));
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,492,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:800,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
