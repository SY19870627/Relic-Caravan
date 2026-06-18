// ========================= 角色所（技能說明・職業裝備）v0.9 =========================
class CharacterHall extends Phaser.Scene {
  constructor(){ super('CharacterHall'); }
  create(data){
    if(!RUN) initRun();
    syncDiscovered();
    this.from=(data&&data.from)||'GuildHall';
    const W=this.scale.width;
    sceneBg(this,{glow:0x56d6c6});
    sceneHeader(this,'角 色 所','',{accent:'teal'});
    button(this, 70, 20, 120, 28, this.from==='Map'?'返回地城':'返回大廳', ()=>this.scene.start(this.from), {variant:'info', size:12, icon:'home', iconSize:13});
    button(this, W-92, 20, 160, 28, '作弊：全隊 +1 級', ()=>{ ROSTER.forEach(r=>r.level++); saveGuild(); this.selectHero(this.selHero); this.toast('全隊職業等級 +1'); }, {size:11, fill:UI.lineSoftN, stroke:0x6b4a6b, color:UI.dim, icon:'bug', iconSize:12, radius:8});

    this.selHero=0; this.heroCards=[];
    const n=RUN.heroes.length, cw=Math.min(150,Math.floor((760-(n-1)*12)/n)), x0=(W-(n*cw+(n-1)*12))/2+cw/2;
    RUN.heroes.forEach((h,i)=>{ this.heroCards.push(this.heroTab(h,i, x0+i*(cw+12), 78, cw)); });

    this.pSkill=panel(this, 232, 350, 432, 372, {accent:'teal', title:'技能 ・ 裝備特性', icon:'person', titleSize:15});
    this.pGear =panel(this, 668, 350, 432, 372, {accent:'gold', title:'裝備調整（依職業）', icon:'sword', titleSize:15});
    this.selectHero(0);
  }
  heroTab(h,i,x,y,w){
    const top=y-30, L=x-w/2;
    const g=this.add.graphics(); const c=this.add.container(0,0); c.add(g);
    const spr=this.add.image(L+24, y, h.sprite).setScale(2.0);
    const nm=txt(this, L+44, y-8, h.name, 13, UI.gold, 0);
    const lv=txt(this, L+44, y+9, '', 10.5, UI.dim, 0);
    c.add([spr,nm,lv]);
    c.add(this.add.rectangle(x,y,w,60,0xffffff,0.001).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.selectHero(i)));
    return {c,g,L,y,w,lv,redraw:(sel)=>{ g.clear(); g.fillStyle(sel?UI.hoverN:UI.raisedN,1); g.fillRoundedRect(L,top,w,60,10);
      g.fillStyle(0xffffff,sel?0.10:0.05); g.fillRoundedRect(L,top,w,30,10); g.lineStyle(2, sel?UI.tealN:UI.lineN, sel?1:0.6); g.strokeRoundedRect(L,top,w,60,10); }};
  }
  selectHero(i){
    this.selHero=i;
    this.heroCards.forEach((card,k)=>{ card.redraw(k===i); card.lv.setText('Lv'+heroStat(RUN.heroes[k]).level); });
    this.renderDetail();
    this.buildGearButtons();
  }
  renderDetail(){
    if(this._detail) this._detail.forEach(o=>o.destroy());
    this._detail=[]; const add=o=>{this._detail.push(o);return o;};
    const h=RUN.heroes[this.selHero], s=heroStat(h), lv=s.level, p=this.pSkill;
    const ax=p.left+18; let y=p.bodyTop+10;
    const stats=[{label:'HP '+(s.maxHp-(h.armor.hp||0)), accent:'green', icon:'heart'},
                 {label:'ATK '+s.atkSeq.join('/'), accent:'gold', icon:'sword'},
                 {label:'DEF '+s.def+(s.heal?' 治療'+s.heal:''), accent:'blue', icon:'shield'}];
    let cx=ax;
    stats.forEach((st,k)=>{ const c=add(chip(this, cx, y, Object.assign({size:11,h:23}, st)));
      if(k>0 && (cx-ax)+c.w > p.w-34){ cx=ax; y+=30; c.setX(cx); c.setY(y); } cx+=c.w+8; });
    y+=32;
    add(txt(this, ax, y, 'EXP', 10, UI.dim, 0)); add(statBar(this, ax+32, y, p.w-92, 8, ROSTER[h.idx].xp, xpNeed(lv), {accent:'violet'}));
    add(txt(this, p.right-16, y, 'Lv'+lv, 11, UI.gold, 1));
    y+=18; add(divider(this, p.cx, y, p.w-36, UI.lineN, 0.5)); y+=14;
    const rolled=ROSTER[h.idx].skills;
    let skills=(SKILLS[h.sprite]||[]); if(Array.isArray(rolled)) skills=skills.filter(sk=>rolled.includes(sk.name));
    add(txt(this, ax, y, '技能（角色實際擁有）', 12, UI.teal, 0)); y+=20;
    skills.forEach(sk=>{ y=this.skillCard(ax, y, p.w-36, sk, lv>=sk.lv, add); });
    const traits=[]; if(h.weapon.traitDesc) traits.push(['武器 '+h.weapon.name, h.weapon.traitDesc]); if(h.armor.traitDesc) traits.push(['防具 '+h.armor.name, h.armor.traitDesc]);
    if(traits.length){ y+=2; add(txt(this, ax, y, '裝備特性', 12, UI.gold, 0)); y+=18;
      traits.forEach(t=>{ add(txt(this, ax, y, t[0], 10.5, UI.text, 0)); add(txt(this, ax+116, y, t[1], 10.5, UI.dim, 0).setWordWrapWidth(p.w-150)); y+=17; }); }
  }
  skillCard(x,y,w,sk,unlocked,add){
    const active=sk.cd!==undefined, sv=skillVisual(sk), acc=unlocked?accent(sv.accent):accent('slate');
    const tx=x+52, inner=w-66, perLine=Math.floor(inner/11), lines=Math.max(1, Math.ceil((sk.desc||'').length/perLine)), h=50+lines*16;
    const g=add(this.add.graphics());
    g.fillStyle(UI.raisedN, unlocked?1:0.5); g.fillRoundedRect(x,y,w,h,9);
    g.lineStyle(1.5, acc.num, unlocked?0.85:0.4); g.strokeRoundedRect(x,y,w,h,9);
    g.fillStyle(acc.num, unlocked?1:0.4); g.fillRoundedRect(x,y,4,h,{tl:9,bl:9,tr:0,br:0});
    g.fillStyle(acc.deep, unlocked?0.55:0.3); g.fillCircle(x+28,y+h/2,16); g.lineStyle(1.5,acc.num,unlocked?0.8:0.35); g.strokeCircle(x+28,y+h/2,16);
    add(icon(this, x+28, y+h/2, sv.icon, 20, unlocked?acc.num:UI.faint));
    add(txt(this, tx, y+15, sk.name, 14, unlocked?acc.hex:UI.faint, 0, 0.5));
    const badge = unlocked? '已習得' : 'Lv'+sk.lv+' 解鎖';
    add(chip(this, x+w-10-this._badgeW(badge), y+15, {label:badge, accent: unlocked?'green':'slate', size:9, h:18, filled:unlocked, textColor: unlocked?UI.white:undefined}));
    add(txt(this, tx, y+33, active?('主動 ・ CD '+(sk.cd/1000)+' 秒 ・ 每場 '+sk.uses+' 次'):'被動 ・ 自動觸發', 10, UI.dim, 0, 0.5));
    add(txt(this, tx, y+46, sk.desc||'', 10.5, unlocked?UI.text:UI.faint, 0).setWordWrapWidth(inner));
    return y+h+8;
  }
  _badgeW(s){ return s.length*10+22; }
  buildGearButtons(){
    if(this._gearObjs) this._gearObjs.forEach(o=>o.destroy());
    if(this._gdet) this._gdet.forEach(o=>o.destroy());
    this._gearObjs=[]; this._gdet=[]; this._gadd=o=>{this._gearObjs.push(o);return o;};
    const h=RUN.heroes[this.selHero], p=this.pGear, gx=p.left+18, sz=42, pitch=50, lx=gx, sx=gx+52, add=this._gadd;
    // 已擁有且本職業可用的裝備（武器/防具皆唯一，不分起手或掉落）
    const weapons=WEAPONS.filter(w=>gearOwned(w.name)&&weaponClassOK(h.sprite,w));
    const armors =ARMORS.filter(a=>gearOwned(a.name)&&armorClassOK(h.sprite,a));
    add(txt(this, gx, p.bodyTop+10, '目前：'+h.weapon.name+'　/　'+h.armor.name, 12, UI.gold, 0, 0.5));
    let y=p.bodyTop+52;
    add(txt(this, lx, y, '武器', 13, UI.teal, 0, 0.5));
    weapons.forEach((w,i)=> this.gearSlot(sx+sz/2+i*pitch, y, sz, w, '武器')); y+=62;
    add(txt(this, lx, y, '防具', 13, UI.blue, 0, 0.5));
    armors.forEach((a,i)=> this.gearSlot(sx+sz/2+i*pitch, y, sz, a, '防具')); y+=62;
    add(divider(this, p.cx, y, p.w-36, UI.lineN, 0.5)); this.gdetY=y+14;
    this.showGearDetail(h.weapon, '武器');
  }
  gearSlot(x,y,sz,item,kind){
    const h=RUN.heroes[this.selHero], s=heroStat(h), v=itemVisual(item.name), ac=accent(v.accent);
    const equipped = kind==='武器'? h.weapon.name===item.name : h.armor.name===item.name;
    const lvOK = s.level>=item.lvReq, curW=h.weapon, curA=h.armor;
    const better = kind==='武器' ? (item.heal>0?(item.heal>curW.heal||Math.max(...item.atkSeq)>Math.max(...curW.atkSeq)):Math.max(...item.atkSeq)>Math.max(...curW.atkSeq))
                                 : ((item.def+item.hp/4)>(curA.def+curA.hp/4));
    const g=this._gadd(this.add.graphics());
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,9);
    g.fillStyle(equipped?ac.deep:UI.raisedN, lvOK?1:0.5); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    g.fillStyle(0xffffff, equipped?0.14:0.05); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz*0.5,9);
    g.lineStyle(equipped?3:2, equipped?UI.goldN:(!lvOK?0x8a3a3a:ac.num), lvOK?0.95:0.5); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    this._gadd(icon(this, x, y-3, v.icon, sz*0.5, lvOK?ac.num:UI.faint));
    if(!lvOK) this._gadd(txt(this, x, y+sz/2-7, 'Lv'+item.lvReq, 9, UI.red));
    else if(better){ const tg=this._gadd(this.add.graphics()); tg.fillStyle(UI.greenN,1); tg.fillTriangle(x+sz/2-13,y-sz/2+5,x+sz/2-3,y-sz/2+5,x+sz/2-8,y-sz/2-4); }
    const hit=this._gadd(this.add.rectangle(x,y,sz,sz,0xffffff,0.001).setInteractive({useHandCursor:true}));
    hit.on('pointerover',()=>this.showGearDetail(item,kind));
    hit.on('pointerdown',()=>{ if(!lvOK){ this.toast(h.name+' 職業等級不足，需 Lv'+item.lvReq); this.showGearDetail(item,kind); return; }
      const oldMax=heroStat(h).maxHp; if(kind==='武器') h.weapon=item; else h.armor=item; const newMax=heroStat(h).maxHp;
      if(h.hp>0) h.hp=Math.max(1, Math.min(newMax, h.hp+(newMax-oldMax)));
      persistLoadout(); this.selectHero(this.selHero); });
  }
  showGearDetail(item,kind){
    if(this._gdet) this._gdet.forEach(o=>o.destroy()); this._gdet=[];
    const p=this.pGear, h=RUN.heroes[this.selHero], s=heroStat(h), y=this.gdetY, gx=p.left+20, add=o=>{this._gdet.push(o);return o;};
    const v=itemVisual(item.name), ac=accent(v.accent);
    add(this.add.graphics().fillStyle(ac.deep,0.5).fillRoundedRect(gx,y,46,46,9));
    add(icon(this, gx+23, y+23, v.icon, 26, ac.num));
    add(txt(this, gx+58, y+8, item.name, 14, ac.hex, 0, 0.5));
    const stat = kind==='武器' ? ('傷害 '+item.atkSeq.join('/')+(item.heal?'　治療 '+item.heal:'')+'　需求 Lv'+item.lvReq)
                              : ('防禦 '+item.def+'　護盾 +'+item.hp+'　需求 Lv'+item.lvReq);
    add(txt(this, gx+58, y+26, stat, 11, UI.text, 0, 0.5));
    const equipped = kind==='武器'? h.weapon.name===item.name : h.armor.name===item.name, lvOK=s.level>=item.lvReq;
    const hint = equipped?'● 裝備中':(lvOK?'▶ 點擊裝備':'✕ 職業等級不足');
    add(txt(this, gx+58, y+44, (item.traitDesc?('特效：'+item.traitDesc+'　'):'')+hint, 10.5, equipped?UI.gold:(lvOK?UI.green:UI.red), 0, 0.5));
  }
  toast(msg){ if(this._toast) this._toast.destroy(); this._toast=txt(this,this.scale.width/2,52,msg,13,UI.red).setDepth(99);
    this.tweens.add({targets:this._toast,alpha:0,delay:900,duration:600,onComplete:()=>{ if(this._toast){this._toast.destroy(); this._toast=null;} }}); }
}
