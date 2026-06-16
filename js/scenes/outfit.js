// ========================= 整備 =========================
class Outfit extends Phaser.Scene {
  constructor(){ super('Outfit'); }
  create(){
    if(!RUN) initRun();
    const W=this.scale.width;
    this.add.tileSprite(0,0,W,this.scale.height,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,this.scale.height,0x0e0a14,0.35).setOrigin(0);
    txt(this,W/2,28,'出 發 整 備',24,TH.gold);
    txt(this,W/2,50,'檢視隊伍，選一台貨車後出發（裝備請到公會大廳「角色所」調整）',12,TH.dim);
    const bl=relicEffects();
    const blAny=(bl.atk||bl.def||bl.hp||bl.heal||bl.drop||bl.extraLoot||bl.firstHitCrit||bl.reviveOnce||bl.noFoodDrain||bl.fullHealAfterBattle);
    txt(this,W/2,70,`公會資金 ＄${GUILD.funds}　🎒 倉庫 ${GUILD.stash.length} 件　🏛 遺物 ${GUILD.relics.length}/${relicTotalCount()}`+(blAny?`　✨ ${relicSummary(bl)}`:''),12,TH.gold);
    // 返回公會大廳
    button(this, 96, 28, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});

    this.selHero = 0;
    { const n=RUN.heroes.length, cw=n>=5?166:180, gap=n>=5?6:20, total=n*cw+(n-1)*gap, x0=(W-total)/2;
      this.heroCards = RUN.heroes.map((h,i)=>this.makeHeroCard(h,i, x0+i*(cw+gap), 110, cw)); }
    this.powerText = txt(this,W/2,92,'',12,TH.green);
    this.refreshHeroCards();

    // 本趟馬車（在「馬車工坊」換馬／強化）
    const ws=wagonStats();
    txt(this,W/2,300,'── 本趟馬車 ──',13,TH.gold);
    this.add.rectangle(W/2,362,340,92,TH.panel).setStrokeStyle(2,0x5a8cd0);
    txt(this,W/2,338,`${ws.name}　🐴 ${ws.horse}`,15,TH.gold);
    txt(this,W/2,362,`🍖 食物 ${ws.food} 天　📦 貨格 ${ws.slots}`,13,TH.text);
    txt(this,W/2,384,'在「馬車工坊」可換馬與項目化強化',11,TH.dim);

    this.goBtn = button(this, W/2, 472, 240, 44, '▶ 出 發 探 險', ()=>this.depart(), {size:18,fill:0x3a6b3a,stroke:0x5ad06a,hover:0x4c8c4c});
  }

  makeHeroCard(h,i,x,y,w){
    w=w||180;
    const c=this.add.container(x,y);
    const bg=this.add.rectangle(0,0,w,128,TH.panel).setStrokeStyle(2,0x3a3150).setOrigin(0);
    const spr=this.add.image(36,64,h.sprite).setScale(3.0);
    const name=txt(this,72,10,h.name,15,TH.gold,0);
    const stat=txt(this,72,30,'',11,TH.text,0);
    const wp=txt(this,72,80,'',11,'#9fe8ff',0);
    const ar=txt(this,72,98,'',11,'#9fd0a0',0);
    const sh=txt(this,72,116,'',11,'#ffd24a',0);
    c.add([bg,spr,name,stat,wp,ar,sh]);
    bg.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ this.selHero=i; this.refreshHeroCards(); });
    c.bg=bg; c.name=name; c.stat=stat; c.wp=wp; c.ar=ar; c.sh=sh;
    return c;
  }
  refreshHeroCards(){
    RUN.heroes.forEach((h,i)=>{
      const card=this.heroCards[i], s=heroStat(h);
      card.bg.setStrokeStyle(i===this.selHero?3:2, i===this.selHero?0xe7c14a:0x3a3150);
      const armorHp=h.armor.hp||0;
      const wAtk=h.weapon.atkSeq, atkBonus=s.atkSeq[0]-wAtk[0], defBonus=s.def-h.armor.def;
      card.name.setText(`${h.name}  Lv${s.level}`);
      card.stat.setText(`HP ${s.maxHp-armorHp}`+(s.heal?`　治療 ${s.heal}`:'')+`\nEXP ${ROSTER[i].xp}/${xpNeed(s.level)}`);
      // 武器/防具顯示「本身數值」（與武器欄一致），額外加成（羈絆/祝福/技能）用 +N 標出
      card.wp.setText(`武器 ${h.weapon.name}　${wAtk.join('/')}`+(atkBonus?` ${atkBonus>0?'+':''}${atkBonus}`:''));
      card.ar.setText(`防具 ${h.armor.name}　${h.armor.def}`+(defBonus?` ${defBonus>0?'+':''}${defBonus}`:''));
      card.sh.setText(`🛡 護盾 ${armorHp}`);
    });
    // 隊伍戰力總覽（整備資訊量）
    if(this.powerText){
      let hp=0,atk=0,def=0,heal=0;
      RUN.heroes.forEach(h=>{ const s=heroStat(h); hp+=s.maxHp; atk+=s.atkSeq[0]; def+=s.def; heal+=s.heal; });
      const power=Math.round(hp*0.5+atk*6+def*8+heal*4);
      this.powerText.setText(`🛡 隊伍戰力 ${power}　|　總HP ${hp}・前段ATK ${atk}・總DEF ${def}${heal?'・治療 '+heal:''}`);
    }
    this.refreshEquip();
  }
  refreshEquip(){
    const h=RUN.heroes[this.selHero]; if(!h) return; const s=heroStat(h);
    const curW=h.weapon, curWmax=Math.max(...curW.atkSeq), curA=h.armor;
    const mark=(g,state)=>{ if(!g) return;
      const col = state==='lock'?0x8a3a3a : state==='equip'?0xe7c14a : state==='up'?0x5ad06a : 0x55476b;
      g.bg.setStrokeStyle(state==='equip'||state==='up'?3:2, col); g.setAlpha(state==='lock'?0.5:1);
    };
    (this.wpBtns||[]).forEach(({b,w})=>{
      if(s.level<w.lvReq) return mark(b,'lock');
      if(w===curW) return mark(b,'equip');
      const better = w.heal>0 ? (w.heal>curW.heal||Math.max(...w.atkSeq)>curWmax) : Math.max(...w.atkSeq)>curWmax;
      mark(b, better?'up':'norm');
    });
    (this.arBtns||[]).forEach(({b,a})=>{
      if(s.level<a.lvReq) return mark(b,'lock');
      if(a===curA) return mark(b,'equip');
      mark(b, (a.def+a.hp/4)>(curA.def+curA.hp/4)?'up':'norm');
    });
    (this.stashBtns||[]).forEach(({b,it})=>{
      const req=it.gear.lvReq||1, slot=it.kind==='武器'?'weapon':'armor';
      if(s.level<req) return mark(b,'lock');
      if(it.gear===h[slot]) return mark(b,'equip');
      const better = slot==='weapon' ? (it.gear.heal>0?it.gear.heal>curW.heal:Math.max(...it.gear.atkSeq)>curWmax)
                                     : (it.gear.def+it.gear.hp/4)>(curA.def+curA.hp/4);
      mark(b, better?'up':'norm');
    });
  }
  toast(msg){
    if(this._toast) this._toast.destroy();
    this._toast=txt(this,this.scale.width/2,232,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._toast,alpha:0,delay:900,duration:600,onComplete:()=>{ if(this._toast){this._toast.destroy(); this._toast=null;} }});
  }
  depart(){
    const ws=wagonStats(), sp=sponsorship();
    RUN.wagon={name:ws.name, horse:ws.horse};
    RUN.food = ws.food + sp.food + (relicEffects().food||0);   // 馬匹(含工匠強化) + 聲望贊助 + 遺物食物效果
    RUN.slots = ws.slots;
    RUN.cargo=[];
    if(sp.funds){ GUILD.funds += sp.funds; saveGuild(); }  // 贊助資金入帳
    RUN.heroes.forEach(h=>{ h.hp=heroStat(h).maxHp; });
    this.scene.start('WorldMap');   // 先到世界地圖選目的地（地城在那裡才生成）
  }
}
