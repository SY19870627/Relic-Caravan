// ========================= 角色所（技能說明・職業裝備）v0.9 =========================
class CharacterHall extends Phaser.Scene {
  constructor(){ super('CharacterHall'); }
  create(){
    if(!RUN) initRun();
    const W=this.scale.width;
    sceneBg(this,{glow:0x56d6c6});
    sceneHeader(this,'角 色 所','',{accent:'teal'});
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});
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
    this.refreshEquip();
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
    const active=sk.cd!==undefined;
    const acc = active? (sk.type==='stun'?accent('gold'):(sk.type==='groupHeal'?accent('green'):(sk.type==='crit'?accent('red'):accent('blue')))) : accent('slate');
    const inner=w-28, perLine=Math.floor(inner/11), lines=Math.max(1, Math.ceil((sk.desc||'').length/perLine)), h=50+lines*16;
    const g=add(this.add.graphics());
    g.fillStyle(UI.raisedN, unlocked?1:0.5); g.fillRoundedRect(x,y,w,h,9);
    g.lineStyle(1.5, acc.num, unlocked?0.85:0.4); g.strokeRoundedRect(x,y,w,h,9);
    g.fillStyle(acc.num, unlocked?1:0.4); g.fillRoundedRect(x,y,4,h,{tl:9,bl:9,tr:0,br:0});
    add(txt(this, x+14, y+15, sk.name, 14, unlocked?acc.hex:UI.faint, 0, 0.5));
    const badge = unlocked? '已習得' : 'Lv'+sk.lv+' 解鎖';
    add(chip(this, x+w-10-this._badgeW(badge), y+15, {label:badge, accent: unlocked?'green':'slate', size:9, h:18, filled:unlocked, textColor: unlocked?UI.white:undefined}));
    add(txt(this, x+14, y+33, active?('主動 ・ CD '+(sk.cd/1000)+' 秒 ・ 每場 '+sk.uses+' 次'):'被動 ・ 自動觸發', 10, UI.dim, 0, 0.5));
    add(txt(this, x+14, y+46, sk.desc||'', 10.5, unlocked?UI.text:UI.faint, 0).setWordWrapWidth(inner));
    return y+h+8;
  }
  _badgeW(s){ return s.length*10+22; }
  buildGearButtons(){
    if(this._gearObjs) this._gearObjs.forEach(o=>o.destroy());
    this._gearObjs=[]; const gadd=o=>{this._gearObjs.push(o);return o;};
    const h=RUN.heroes[this.selHero], p=this.pGear, gx=p.left+18, bw=Math.floor((p.w-44)/2);
    let y=p.bodyTop+8;
    this.curText=gadd(txt(this, gx, y, '目前：'+h.weapon.name+'　/　'+h.armor.name, 11, UI.gold, 0)); y+=28;
    gadd(txt(this, gx, y, h.name+' 可用武器（數值＝傷害・Lv＝需求）', 10, UI.dim, 0)); y+=22;
    const ws=WEAPONS.filter(w=>w.starter && weaponClassOK(h.sprite,w));
    this.wpBtns=ws.map((w,i)=>{ const bx=gx+(i%2)*(bw+8)+bw/2, by=y+14+Math.floor(i/2)*32;
      const b=gadd(button(this, bx, by, bw, 28, w.name+' '+w.atkSeq.join('/')+(w.heal?' ♥'+w.heal:''), ()=>{ if(heroStat(h).level<w.lvReq){this.toast(h.name+' 需 Lv'+w.lvReq);return;} h.weapon=w; persistLoadout(); this.selectHero(this.selHero); }, {size:10.5,fill:UI.raisedN,stroke:UI.lineN}));
      return {b,w}; });
    y+=Math.ceil(ws.length/2)*32+12;
    gadd(txt(this, gx, y, h.name+' 可用防具（D＝防禦・+＝護盾）', 10, UI.dim, 0)); y+=22;
    const as=ARMORS.filter(a=>a.starter && armorClassOK(h.sprite,a));
    this.arBtns=as.map((a,i)=>{ const bx=gx+(i%2)*(bw+8)+bw/2, by=y+14+Math.floor(i/2)*32;
      const b=gadd(button(this, bx, by, bw, 28, a.name+' D'+a.def+' +'+a.hp, ()=>{ if(heroStat(h).level<a.lvReq){this.toast(h.name+' 需 Lv'+a.lvReq);return;} h.armor=a; persistLoadout(); this.selectHero(this.selHero); }, {size:10.5,fill:UI.raisedN,stroke:UI.lineN}));
      return {b,a}; });
    y+=Math.ceil(as.length/2)*32+12;
    const stashGear=[], seen={}; GUILD.stash.forEach(it=>{ if((it.kind==='武器'||it.kind==='防具')&&it.gear&&!seen[it.name]&&gearClassOK(h.sprite,it)){ seen[it.name]=1; stashGear.push(it); } });
    this.stashBtns=[];
    if(stashGear.length){
      gadd(txt(this, gx, y, '倉庫裝備（本職業可用）', 10, UI.violet, 0)); y+=22;
      this.stashBtns=stashGear.slice(0,6).map((it,i)=>{ const bx=gx+(i%2)*(bw+8)+bw/2, by=y+13+Math.floor(i/2)*30;
        const b=gadd(button(this, bx, by, bw, 26, it.name+' Lv'+((it.gear.lvReq)||1), ()=>{ const slot=it.kind==='武器'?'weapon':'armor', req=it.gear.lvReq||1;
          if(heroStat(h).level<req){this.toast(h.name+' 需 Lv'+req);return;} h[slot]=it.gear; persistLoadout(); this.selectHero(this.selHero); this.toast(h.name+' 裝上 '+it.name); }, {size:10.5,fill:UI.raisedN,stroke:UI.lineN}));
        return {b,it}; });
    }
  }
  refreshEquip(){
    const h=RUN.heroes[this.selHero]; if(!h) return; const s=heroStat(h);
    const curW=h.weapon, curWmax=Math.max(...curW.atkSeq), curA=h.armor;
    const mark=(g,state)=>{ if(!g) return; const col = state==='lock'?0x8a3a3a : state==='equip'?UI.goldN : state==='up'?UI.greenN : UI.lineN;
      g.bg.setStrokeStyle(state==='equip'||state==='up'?3:2, col); g.setAlpha(state==='lock'?0.5:1); };
    (this.wpBtns||[]).forEach(({b,w})=>{ if(s.level<w.lvReq) return mark(b,'lock'); if(w===curW) return mark(b,'equip');
      const better = w.heal>0 ? (w.heal>curW.heal||Math.max(...w.atkSeq)>curWmax) : Math.max(...w.atkSeq)>curWmax; mark(b, better?'up':'norm'); });
    (this.arBtns||[]).forEach(({b,a})=>{ if(s.level<a.lvReq) return mark(b,'lock'); if(a===curA) return mark(b,'equip'); mark(b,(a.def+a.hp/4)>(curA.def+curA.hp/4)?'up':'norm'); });
    (this.stashBtns||[]).forEach(({b,it})=>{ const req=it.gear.lvReq||1, slot=it.kind==='武器'?'weapon':'armor'; if(s.level<req) return mark(b,'lock'); if(it.gear===h[slot]) return mark(b,'equip');
      const better = slot==='weapon' ? (it.gear.heal>0?it.gear.heal>curW.heal:Math.max(...it.gear.atkSeq)>curWmax) : (it.gear.def+it.gear.hp/4)>(curA.def+curA.hp/4); mark(b, better?'up':'norm'); });
  }
  toast(msg){ if(this._toast) this._toast.destroy(); this._toast=txt(this,this.scale.width/2,52,msg,13,UI.red).setDepth(99);
    this.tweens.add({targets:this._toast,alpha:0,delay:900,duration:600,onComplete:()=>{ if(this._toast){this._toast.destroy(); this._toast=null;} }}); }
}
