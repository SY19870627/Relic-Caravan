// ========================= 角色所（查看技能・調整裝備） =========================
class CharacterHall extends Phaser.Scene {
  constructor(){ super('CharacterHall'); }
  create(){
    if(!RUN) initRun();
    const W=this.scale.width;
    this.add.tileSprite(0,0,W,this.scale.height,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,this.scale.height,0x0e0a14,0.35).setOrigin(0);
    txt(this,W/2,26,'角 色 所',24,TH.gold);
    txt(this,W/2,48,'點隊員選取，查看技能、調整武器/防具',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    button(this, W-110, 26, 190, 28, '🐞 作弊：全隊 +1 級', ()=>{ ROSTER.forEach(r=>r.level++); saveGuild(); this.refreshHeroCards(); this.toast('全隊職業等級 +1'); }, {size:12,fill:0x6b3a5a,stroke:0xd05a9a,hover:0x8c4c7a});

    this.selHero = 0;
    { const n=RUN.heroes.length, cw=n>=5?166:180, gap=n>=5?6:20, total=n*cw+(n-1)*gap, x0=(W-total)/2;
      this.heroCards = RUN.heroes.map((h,i)=>this.makeHeroCard(h,i, x0+i*(cw+gap), 70, cw)); }

    this.skillText = txt(this,W/2,212,'',12,'#ffd24a');

    // 武器
    txt(this,W/2,244,'── 武器（數值＝傷害表・Lv＝等級需求）──',13,TH.cyan);
    this.wpBtns = WEAPONS.filter(w=>w.starter).map((w,i)=>{
      const b=button(this, 90+(i%6)*130, 272, 120, 30, `${w.name} ${w.atkSeq.join('/')}${w.heal?' ♥'+w.heal:''}`, ()=>{ const h=RUN.heroes[this.selHero];
        if(heroStat(h).level < w.lvReq){ this.toast(`${h.name} 職業等級不足，需 Lv${w.lvReq}`); return; }
        h.weapon=w; persistLoadout(); this.refreshHeroCards(); }, {size:11,fill:0x33283f,stroke:0x55476b});
      return {b,w};
    });
    txt(this,W/2,308,'── 防具（D＝防禦・+HP＝護盾・Lv＝等級需求）──',13,TH.cyan);
    this.arBtns = ARMORS.filter(a=>a.starter).map((a,i)=>{
      const b=button(this, 155+i*150, 336, 130, 28, `${a.name} D${a.def} +${a.hp}`, ()=>{ const h=RUN.heroes[this.selHero];
        if(heroStat(h).level < a.lvReq){ this.toast(`${h.name} 職業等級不足，需 Lv${a.lvReq}`); return; }
        h.armor=a; persistLoadout(); this.refreshHeroCards(); }, {size:11,fill:0x33283f,stroke:0x55476b});
      return {b,a};
    });

    // 倉庫裝備
    const stashGear=[], seen={};
    GUILD.stash.forEach(it=>{ if((it.kind==='武器'||it.kind==='防具')&&it.gear&&!seen[it.name]){ seen[it.name]=1; stashGear.push(it); } });
    this.stashBtns=[];
    if(stashGear.length){
      txt(this,W/2,372,'🎒 倉庫裝備（點選 → 裝上目前選取的隊員）',12,'#ffd24a');
      this.stashBtns = stashGear.slice(0,6).map((it,i)=>{
        const b=button(this, 90+(i%6)*135, 398, 125, 24, `${it.icon}${it.name} Lv${(it.gear.lvReq)||1}`, ()=>{
          const h=RUN.heroes[this.selHero], slot=it.kind==='武器'?'weapon':'armor', req=it.gear.lvReq||1;
          if(heroStat(h).level<req){ this.toast(`${h.name} 職業等級不足，需 Lv${req}`); return; }
          h[slot]=it.gear; persistLoadout(); this.refreshHeroCards(); this.toast(`${h.name} 裝上倉庫的 ${it.name}`);
        }, {size:11,fill:0x33283f,stroke:0x55476b});
        return {b,it};
      });
    } else {
      txt(this,W/2,388,'🎒 倉庫暫無可用武器/防具（探險帶回並保留後會出現在這裡）',11,TH.dim);
    }

    this.refreshHeroCards();
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
      card.wp.setText(`武器 ${h.weapon.name}　${wAtk.join('/')}`+(atkBonus?` ${atkBonus>0?'+':''}${atkBonus}`:''));
      card.ar.setText(`防具 ${h.armor.name}　${h.armor.def}`+(defBonus?` ${defBonus>0?'+':''}${defBonus}`:''));
      card.sh.setText(`🛡 護盾 ${armorHp}`);
    });
    // 選取隊員的技能列（解鎖顯示名稱，未解鎖標 LvN）
    if(this.skillText){
      const h=RUN.heroes[this.selHero], lv=heroStat(h).level;
      const rolled=ROSTER[h.idx].skills;
      let all=SKILLS[h.sprite]||[];
      if(Array.isArray(rolled)) all=all.filter(s=>rolled.includes(s.name));
      const parts=all.map(sk=> lv>=sk.lv ? sk.name : `${sk.name}(Lv${sk.lv})`);
      this.skillText.setText(`🎓 ${h.name} 隨機雙技能：`+(parts.length?parts.join('・'):'無'));
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
}
