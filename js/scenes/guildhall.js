// ========================= 公會大廳 =========================
class GuildHall extends Phaser.Scene {
  constructor(){ super('GuildHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'公 會 大 廳',24,TH.gold);
    txt(this,W/2,48,'供奉遺物獲得神殿祝福 ・ 用資金升級設施 ・ 聲望帶來開局贊助',12,TH.dim);
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[];
    const W=this.scale.width,H=this.scale.height, add=o=>{this._ui.push(o);return o;};
    const bl=guildBlessing(), sp=sponsorship();
    add(txt(this,W/2,72,`公會資金 ＄${GUILD.funds}　🏛 神殿遺物 ${GUILD.relics.length}　🎒 倉庫 ${GUILD.stash.length} 件　⭐ 聲望 ${reputation()}`,13,TH.gold));
    add(txt(this,W/2,94,`⚔ 目前隊形：${currentFormation().name}（${currentFormation().desc}）`,11,'#ffc0d0'));

    // 神殿
    add(this.add.rectangle(245,300,400,322,TH.panel).setStrokeStyle(2,0x5a8cd0).setOrigin(0.5));
    add(txt(this,245,158,'🏛 神 殿',18,TH.cyan));
    add(txt(this,245,184,`等級 ${GUILD.facilities.temple}　遺物槽 ${templeSlots()}`,13,TH.text));
    add(txt(this,245,208,'供奉中（自動取價值最高的遺物）：',12,TH.dim));
    let y=230; const ens=enshrinedRelics(), showN=5;
    if(!ens.length){ add(txt(this,245,y,'（尚無遺物可供奉）',12,TH.dim)); }
    ens.slice(0,showN).forEach(r=>{ add(txt(this,245,y,`🏛 ${r.name}〔${BOON_LABEL[relicBoonType(r)]}〕`,12,TH.cyan)); y+=20; });
    if(ens.length>showN){ add(txt(this,245,y,`…及其餘 ${ens.length-showN} 件一同供奉`,12,TH.dim)); }
    add(txt(this,245,368,`神殿祝福：${blessingSummary(bl)}`,12,TH.green));
    const tc=templeCost(), tok=GUILD.funds>=tc;
    add(button(this,245,438,280,38,`升級神殿 ＄${tc}（+1 遺物槽）`,()=>{
      if(GUILD.funds<tc){ this.flash('資金不足'); return; }
      GUILD.funds-=tc; GUILD.facilities.temple++; saveGuild(); this.render();
    },{size:13, fill:tok?0x3a6b3a:0x33323a, stroke:tok?0x5ad06a:0x55555f, hover:tok?0x4c8c4c:0x33323a}));

    // 整備所
    add(this.add.rectangle(655,300,400,322,TH.panel).setStrokeStyle(2,0x5a8cd0).setOrigin(0.5));
    add(txt(this,655,158,'🛠 整 備 所',18,'#ffd24a'));
    add(txt(this,655,186,`等級 ${GUILD.facilities.outfit}`,13,TH.text));
    add(txt(this,655,214,`每台貨車：🍖 食物 +${outfitFoodBonus()}　📦 貨格 +${outfitSlotBonus()}`,13,TH.green));
    add(txt(this,655,240,'提升補給與收穫上限，能去更遠、帶更多',11,TH.dim));
    add(txt(this,655,288,`⭐ 聲望贊助（Tier ${reputationTier()}）`,13,TH.gold));
    add(txt(this,655,312,`出發時 🍖 食物 +${sp.food}　＄ 資金 +${sp.funds}`,12,TH.cyan));
    add(txt(this,655,336,'供奉越多遺物 → 聲望越高 → 贊助越豐厚',11,TH.dim));
    const oc=outfitCost(), ook=GUILD.funds>=oc;
    add(button(this,655,438,300,38,`升級整備所 ＄${oc}（+1 食物/貨格）`,()=>{
      if(GUILD.funds<oc){ this.flash('資金不足'); return; }
      GUILD.funds-=oc; GUILD.facilities.outfit++; saveGuild(); this.render();
    },{size:13, fill:ook?0x3a6b3a:0x33323a, stroke:ook?0x5ad06a:0x55555f, hover:ook?0x4c8c4c:0x33323a}));

    // 作弊（測試用）：給資源
    add(button(this, W-110, 26, 190, 26, '🐞 作弊：+資源', ()=>{
      GUILD.funds+=300;
      GUILD.relics.push({kind:'遺物',name:'測試神器',icon:'🏛',value:300+Math.floor(Math.random()*300)});
      const w=Phaser.Utils.Array.GetRandom(WEAPONS);
      GUILD.stash.push({kind:'武器',name:w.name,icon:'⚔',value:50,gear:w});
      saveGuild(); this.render();
    },{size:11,fill:0x6b3a5a,stroke:0xd05a9a,hover:0x8c4c7a}));
    add(button(this, 96, 26, 150, 26, '🗑 重置存檔', ()=>{
      try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
      GUILD={funds:0,stash:[],relics:[],facilities:{temple:1,outfit:1},wagon:0,wagonUp:[0,0,0],formation:0,mageHired:false};
      ROSTER=[{level:1,xp:0},{level:1,xp:0},{level:1,xp:0},{level:1,xp:0}];
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
