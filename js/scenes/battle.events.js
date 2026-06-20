// ========================= 戰鬥 · 非戰鬥遭遇（擴充 Battle.prototype） =========================
Object.assign(Battle.prototype, {
  encMeta(t){ return ({
    chest:{spr:'chest', title:'發現寶箱', icon:'🧰', glow:0xffe08a},
    camp :{spr:'campfire', title:'前方有營火', icon:'🔥', glow:0xff9a3a},
    shop :{spr:'merchant', title:'遇見商人', icon:'🧙', glow:0xffe08a},
    event:{spr:'mystery', title:'神秘事件', icon:'❓', glow:0x9fe8ff},
  })[t]; }
,
  // 非戰鬥遭遇：先在路上「演出」遇到的物件，再開互動浮窗（讓選項不再憑空出現）
  playEncounterIntro(t, cb){
    const W=this.scale.width, m=this.encMeta(t);
    if(!m){ if(cb) cb(); return; }
    if(this.encIntro){ this.encIntro.destroy(); this.encIntro=null; }
    if(this.encCap){ this.encCap.destroy(); this.encCap=null; }
    const cx=Math.round(W*0.6), gy=320;
    const cont=this.add.container(cx,gy).setDepth(42); this.encIntro=cont;
    const glow=this.add.circle(0,-4,56,m.glow,0), shadow=this.add.ellipse(0,52,66,16,0x000000,0), spr=this.add.image(0,0,m.spr).setScale(SCALE);
    cont.add([glow,shadow,spr]);
    const cap=txt(this,cx,gy-90,m.icon+' '+m.title,18,'#fff').setDepth(43).setStroke('#000',5).setAlpha(0).setScale(0.9); this.encCap=cap;
    const reveal=()=>{ this.tweens.add({targets:shadow,alpha:0.4,duration:220});
      this.tweens.add({targets:cap,alpha:1,scale:1,y:gy-100,duration:260,ease:'Back.out'});
      this.time.delayedCall(780,()=>{ this.tweens.add({targets:cap,alpha:0,delay:120,duration:240,onComplete:()=>{ if(this.encCap){this.encCap.destroy(); this.encCap=null;} }}); if(cb) cb(); }); };
    if(t==='shop'){
      spr.setFlipX(true); cont.x=W+70;
      this.tweens.add({targets:glow,alpha:0.32,duration:640});
      this.tweens.add({targets:cont,x:cx,duration:640,ease:'Quad.out',onComplete:()=>{ this.tweens.add({targets:spr,y:-4,duration:520,yoyo:true,repeat:-1,ease:'Sine.inOut'}); this.spark(cx,gy,m.glow); reveal(); }});
    } else if(t==='chest'){
      spr.y=-150; spr.setAlpha(0);
      this.tweens.add({targets:spr,y:0,alpha:1,duration:560,ease:'Bounce.out',onComplete:()=>{ this.shake(160,0.008); this.spark(cx,gy+6,m.glow); this.screenFlash(m.glow,0.14,200); this.tweens.add({targets:glow,alpha:0.32,duration:200,yoyo:true}); reveal(); }});
    } else if(t==='camp'){
      spr.setScale(0); this.screenFlash(m.glow,0.12,260);
      this.tweens.add({targets:glow,alpha:0.42,duration:440,onComplete:()=>{ this.tweens.add({targets:glow,alpha:0.2,duration:600,yoyo:true,repeat:-1,ease:'Sine.inOut'}); }});
      this.tweens.add({targets:spr,scale:SCALE,duration:440,ease:'Back.out',onComplete:()=>{ this.tweens.add({targets:spr,scaleY:SCALE*0.9,scaleX:SCALE*1.06,duration:240,yoyo:true,repeat:-1,ease:'Sine.inOut'}); this.spark(cx,gy-8,m.glow); reveal(); }});
    } else {
      spr.setScale(SCALE*0.5).setAlpha(0);
      this.tweens.add({targets:glow,alpha:0.34,duration:520,onComplete:()=>{ this.tweens.add({targets:glow,alpha:0.14,duration:700,yoyo:true,repeat:-1,ease:'Sine.inOut'}); }});
      this.tweens.add({targets:spr,scale:SCALE,alpha:1,duration:560,ease:'Back.out',onComplete:()=>{ this.tweens.add({targets:spr,y:-8,duration:900,yoyo:true,repeat:-1,ease:'Sine.inOut'}); this.spark(cx,gy-6,m.glow); reveal(); }});
    }
  }
,
  openEncounter(t){ if(t==='chest') this.evChest(); else if(t==='camp') this.evCamp(); else if(t==='shop') this.evShop(); else if(t==='event') this.evEvent(); else this.advanceStep(); }
,
  mkOverlay(o){ o=o||{}; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } const W=this.scale.width,H=this.scale.height; const c=this.add.container(0,0).setDepth(96);
    c.add(this.add.rectangle(0,0,W,H,0x000000,0.55).setOrigin(0).setInteractive());
    c.add(panel(this,W/2,H/2,o.w||440,o.h||220,{accent:o.accent||'gold'})); this.overlay=c; return c; }
,
  evChest(){ const W=this.scale.width,H=this.scale.height; const di=RUN.destIndex||0, _r=Math.random();
    const it = _r<0.22 ? (makeIngredientItem(di)||rollItem(2,'武器')) : _r<0.40 ? (makeMaterialItem(di)||rollItem(2,'防具')) : rollItem(2, Math.random()<0.55?'武器':'防具');
    const o=this.mkOverlay({accent:'gold',h:180});
    let msg; if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(it); discover(it.name); if(it.gear) ownGear(it.name); msg='獲得 '+it.icon+' '+it.name+'（'+it.kind+'）'; } else msg='貨車已滿，放棄 '+it.icon+' '+it.name;
    o.add(txt(this,W/2,H/2-24,'🧰 發現寶箱！',20,TH.gold)); o.add(txt(this,W/2,H/2+14,msg,14,it.kind==='遺物'?TH.cyan:TH.text));
    this.time.delayedCall(1250,()=>this.advanceStep()); }
,
  evCamp(){ let n=0;
    RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; const b=h.hp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.5)); if(h.hp>b)n++; } });
    this.heroes.forEach(c=>{ if(c.ref){ c.hp=c.ref.hp; this.bar(c);} });
    this._campHealed=n; this._renderCamp(); }
,
  _renderCamp(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'ember',w:480,h:300});
    o.add(txt(this,W/2,H/2-116,'🔥 營火休息',20,'#f0975a'));
    o.add(txt(this,W/2,H/2-86,'存活成員回復 50% HP（'+(this._campHealed||0)+' 人）',13,TH.text));
    const nItem=RUN.cargo.filter(it=>it.kind==='道具').length, nGear=RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具').length;
    const nIng=RUN.cargo.filter(it=>it.kind==='食材').length, canCookHere=(hasLeader()||hasCampstove());
    o.add(button(this,W/2,H/2-44,330,38, canCookHere?('🍳 料理（食材 '+nIng+'）'):'🍳 料理（需領隊或隨車鍋）',()=>this.evCook(),{variant:canCookHere?'go':'info',size:14}));
    o.add(button(this,W/2-86,H/2+4,160,40,'整裝（'+nGear+'）',()=>{ this._gearFrom='camp'; this.evGear(); },{variant:'info',size:13}));
    o.add(button(this,W/2+86,H/2+4,160,40,'用道具（'+nItem+'）',()=>this.evItems(),{variant:'go',size:13}));
    o.add(button(this,W/2-86,H/2+56,160,40,'繼續前進',()=>this.advanceStep(),{variant:'go',size:14}));
    o.add(button(this,W/2+86,H/2+56,160,40,'撤退收工',()=>{ this.scene.start('Result',{outcome:'retreat'}); },{variant:'danger',size:14})); }
,
  evCook(){ this._cookMsg=null; this._renderCook(); }
,
  _renderCook(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'ember', w:600, h:430});
    o.add(txt(this,W/2,H/2-184,'🍳 營火料理',20,'#f0975a'));
    const enabled=(hasLeader()||hasCampstove());
    o.add(txt(this,W/2,H/2-156, enabled?'消耗隨身食材，立即補血或獲得下一場戰鬥的增益':'需「領隊」或工匠強化「隨車鍋」才能料理',12, enabled?TH.text:TH.red));
    RECIPES.forEach((r,i)=>{ const y=H/2-104+i*62, rx=W/2-250, have=enabled&&canCook(r);
      o.add(this.add.rectangle(W/2,y,540,54,0x241a30,0.9).setStrokeStyle(2, have?0x5ad06a:0x3a3150));
      o.add(txt(this,rx,y-12,r.name,14, enabled?TH.gold:TH.dim,0));
      o.add(txt(this,rx,y+10, r.desc+'　·　需 '+recipeNeedText(r),10.5, have?'#cfe8c0':TH.text,0).setWordWrapWidth(360));
      o.add(button(this,W/2+205,y,100,40, have?'料理':(enabled?'食材不足':'未解鎖'),()=>{ if(!have) return; const msg=cook(r); if(msg) this._cookMsg=msg; this.heroes.forEach(c=>{ if(c.ref){ c.hp=c.ref.hp; this.bar(c);} }); this._renderCook(); },{variant:have?'go':'info',size:11}));
    });
    if(this._cookMsg) o.add(txt(this,W/2,H/2+150,this._cookMsg,12,'#9fe8a0').setWordWrapWidth(560));
    o.add(button(this,W/2,H/2+182,160,38,'返回營火',()=>this._renderCamp(),{variant:'info',size:14})); }
,
  evGear(){ this._gearHero=0; this._gearWSel=0; this._gearASel=0; this._renderGear(); }
,
  _renderGear(){ const W=this.scale.width,H=this.scale.height;
    if(this.overlay){ this.overlay.destroy(); this.overlay=null; }
    if(this.banner) this.banner.setText('').setAlpha(0);
    const o=this.add.container(0,0).setDepth(96); this.overlay=o; const add=x=>{ o.add(x); return x; };
    add(this.add.rectangle(0,0,W,H,0x000000,0.66).setOrigin(0).setInteractive());
    const heroes=RUN.heroes||[]; if(this._gearHero==null||this._gearHero>=heroes.length) this._gearHero=0;
    add(txt(this,W/2,20,'🎒 整裝 — 角色 · 技能 · 裝備',16,'#9fd0ff'));
    add(button(this,W-66,22,116,30, this._gearFrom==='pause'?'返回':'返回營火',()=>{ if(this._gearFrom==='pause'){ this._gearFrom=null; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } this._renderPause(); } else this._renderCamp(); },{variant:'info',size:12}));
    const n=heroes.length, tw=Math.min(150,Math.floor((840-(n-1)*10)/Math.max(1,n))), th=46, ty=62, tx0=W/2-(n*tw+(n-1)*10)/2+tw/2;
    heroes.forEach((hh,i)=>{ const x=tx0+i*(tw+10), sel=i===this._gearHero, hs=heroStat(hh), g=this.add.graphics(); add(g);
      g.fillStyle(sel?0x26324c:0x161122, sel?1:0.85); g.fillRoundedRect(x-tw/2,ty-th/2,tw,th,9);
      g.lineStyle(sel?3:1.5, sel?0x6aa6f0:0x46406a, sel?1:0.7); g.strokeRoundedRect(x-tw/2,ty-th/2,tw,th,9);
      add(this.add.image(x-tw/2+22,ty,hh.sprite).setScale(1.7));
      add(txt(this,x-tw/2+42,ty-8,hh.name,12.5,sel?'#fff':TH.dim,0));
      add(txt(this,x-tw/2+42,ty+9,'Lv'+hs.level,10.5,sel?'#9fd0ff':TH.dim,0));
      const hit=this.add.rectangle(x,ty,tw,th,0,0).setInteractive({useHandCursor:true}); add(hit);
      hit.on('pointerdown',()=>{ this._gearHero=i; this._gearWSel=0; this._gearASel=0; this._renderGear(); }); });
    const h=heroes[this._gearHero]; if(!h) return; const s=heroStat(h);
    const LP=panel(this,236,322,432,448,{accent:'blue',title:'基本數值 ／ 技能',icon:'person',titleSize:13}); add(LP);
    const lx=LP.left+22; let ly=LP.bodyTop+6;
    add(this.add.image(LP.left+44,ly+22,h.sprite).setScale(3));
    add(txt(this,LP.left+82,ly+6,h.name,16,TH.gold,0)); add(txt(this,LP.left+82,ly+28,'Lv '+s.level,12,'#9fd0ff',0));
    add(txt(this,LP.left+82,ly+47,'EXP',9,TH.dim,0)); add(statBar(this,LP.left+112,ly+50,184,7,(ROSTER[h.idx]&&ROSTER[h.idx].xp)||0,xpNeed(s.level),{accent:'violet'}));
    ly+=72; const c2=lx+205, armorHp=h.armor.hp||0;
    add(icon(this,lx+6,ly,'heart',13,UI.greenN)); add(txt(this,lx+20,ly,'HP '+s.maxHp+(armorHp?'（盾'+armorHp+'）':''),12,TH.text,0));
    add(icon(this,c2+6,ly,'sword',13,UI.goldN)); add(txt(this,c2+20,ly,'ATK '+s.atkSeq.join('/'),12,TH.text,0));
    ly+=22; add(icon(this,lx+6,ly,'shield',13,UI.blueN)); add(txt(this,lx+20,ly,'DEF '+s.def,12,TH.text,0));
    if(s.heal){ add(icon(this,c2+6,ly,'heal',13,0x6ee29a)); add(txt(this,c2+20,ly,'治療 '+s.heal,12,TH.text,0)); }
    ly+=30;
    const perks=[]; Object.keys(PERKS).forEach(k=>{ if(s.level>=+k) perks.push((PERKS[k].label||'').split('：')[0]); });
    if(perks.length){ add(icon(this,lx+6,ly,'star',12,0xf2c14e)); add(txt(this,lx+20,ly,'能力：'+perks.join('・'),11,TH.cyan,0).setWordWrapWidth(372)); ly+=24; }
    add(txt(this,lx,ly,'技能',12,TH.gold,0)); ly+=20;
    const sk=s.skills||[];
    if(!sk.length) add(txt(this,lx,ly,'尚無技能 — 升級時習得',11,TH.dim,0));
    sk.slice(0,4).forEach(skill=>{ const sv=skillVisual(skill), ac=accent(sv.accent), g=this.add.graphics(); add(g);
      g.fillStyle(0x07060f,0.45); g.fillRoundedRect(lx,ly,386,40,8); g.lineStyle(1.5,ac.num,0.55); g.strokeRoundedRect(lx,ly,386,40,8);
      add(icon(this,lx+20,ly+20,sv.icon,17,ac.num));
      add(txt(this,lx+40,ly+9,skill.name+(skill.plus?' +'+skill.plus:''),12,ac.hex,0));
      add(txt(this,lx+40,ly+25,skill.desc||'',9,TH.dim,0).setWordWrapWidth(336));
      ly+=44; });
    const RP=panel(this,682,322,416,448,{accent:'gold',title:'裝備清單',icon:'bag',titleSize:13}); add(RP);
    const rl=RP.left;
    const wList=[{gear:h.weapon,name:h.weapon.name,cur:true}].concat(RUN.cargo.filter(it=>it.kind==='武器').map(it=>({gear:it.gear,name:it.name,item:it})));
    const aList=[{gear:h.armor,name:h.armor.name,cur:true}].concat(RUN.cargo.filter(it=>it.kind==='防具').map(it=>({gear:it.gear,name:it.name,item:it})));
    if(this._gearWSel==null||this._gearWSel>=wList.length) this._gearWSel=0;
    if(this._gearASel==null||this._gearASel>=aList.length) this._gearASel=0;
    const slotGrid=(list,selKey,kind,startY)=>{ const isW=kind==='武器', per=8, pitch=50, sz=40, gx=rl+42, gy=startY;
      list.forEach((e,k)=>{ const x=gx+(k%per)*pitch, y=gy+Math.floor(k/per)*pitch, sel=this[selKey]===k;
        const v=itemVisual(e.name), iac=accent(v.accent);
        const lvReq=(e.gear&&e.gear.lvReq)||1, clsOK=gearClassOK(h.sprite,e.item||{kind,gear:e.gear}), ok=!e.cur&&clsOK&&s.level>=lvReq;
        const bord=sel?0xffffff:(e.cur?(isW?0xf2c14e:0x6aa6f0):(ok?0x5ad06a:0x5a5470));
        const g=this.add.graphics(); add(g);
        g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,8);
        g.fillStyle(UI.raisedN,1); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,8);
        g.fillStyle(iac.deep,0.45); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz*0.5,8);
        g.lineStyle((sel||e.cur)?3:2, bord, 1); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,8);
        add(icon(this,x,y-2,v.icon,sz*0.54,iac.num));
        if(e.cur){ g.fillStyle(isW?0xf2c14e:0x6aa6f0,1); g.fillCircle(x+sz/2-5,y-sz/2+5,3.5); }
        const lbl=isW?(''+Math.max.apply(null,(e.gear&&e.gear.atkSeq)||[0])):(''+((e.gear&&e.gear.def)||0));
        add(txt(this,x,y+sz/2+7,lbl,9,e.cur?'#9fd0ff':(ok?'#9fe8a0':TH.dim)));
        const hit=this.add.rectangle(x,y,pitch-2,pitch+2,0xffffff,0.001).setInteractive({useHandCursor:true}); add(hit);
        hit.on('pointerdown',()=>{ this[selKey]=k; this._renderGear(); }); });
      return gy + Math.max(1,Math.ceil(list.length/per))*pitch; };
    const descBox=(e,kind,y)=>{ const isW=kind==='武器', ac=accent(isW?'gold':'blue'), g=this.add.graphics(); add(g);
      g.fillStyle(0x07060f,0.5); g.fillRoundedRect(rl+18,y,384,56,8); g.lineStyle(1.5,ac.num,0.5); g.strokeRoundedRect(rl+18,y,384,56,8);
      if(!e){ add(txt(this,rl+30,y+20,'（無）',11,TH.dim,0)); return; }
      const gear=e.gear, v=itemVisual(e.name), iac=accent(v.accent), lvReq=(gear&&gear.lvReq)||1, clsOK=gearClassOK(h.sprite,e.item||{kind,gear}), ok=!e.cur&&clsOK&&s.level>=lvReq;
      g.fillStyle(iac.deep,0.5); g.fillRoundedRect(rl+28,y+9,38,38,8); add(icon(this,rl+47,y+28,v.icon,22,iac.num));
      const tx=rl+80;
      add(txt(this,tx,y+9,(e.cur?'★ ':'')+e.name,12.5,iac.hex,0));
      add(txt(this,tx,y+27,isW?('傷害 '+((gear&&gear.atkSeq)?gear.atkSeq.join(' / '):'?')+(gear&&gear.heal?'　治療 '+gear.heal:'')):('防禦 '+((gear&&gear.def)||0)+(gear&&gear.hp?'　護盾 +'+gear.hp:'')),10.5,TH.text,0));
      if(gear&&gear.traitDesc) add(txt(this,tx,y+42,'✦ '+gear.traitDesc,9.5,'#c9a0ff',0).setWordWrapWidth(205));
      if(e.cur) add(txt(this,rl+392,y+12,'使用中',10,'#9fd0ff',1));
      else if(!clsOK) add(txt(this,rl+392,y+12,'職業不符',10,'#ff8a8a',1));
      else if(s.level<lvReq) add(txt(this,rl+392,y+12,'需 Lv'+lvReq,10,'#ff8a8a',1));
      else add(button(this,rl+360,y+32,76,28,'換上',()=>{ equipSwap(e.item,this._gearHero); this.restatHeroes(); this.refreshHud(); this._gearWSel=0; this._gearASel=0; this._renderGear(); },{variant:'go',size:12})); };
    let y=RP.bodyTop+4;
    add(txt(this,rl+22,y,'⚔ 武器',13,'#f2c14e',0)); y+=20;
    y=slotGrid(wList,'_gearWSel','武器',y+18)+12;
    descBox(wList[this._gearWSel],'武器',y); y+=68;
    add(txt(this,rl+22,y,'🛡 防具',13,'#6aa6f0',0)); y+=20;
    y=slotGrid(aList,'_gearASel','防具',y+18)+12;
    descBox(aList[this._gearASel],'防具',y);
  }
,
  evItems(){ this._lastUse=null; this._renderItems(); }
,
  _renderItems(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'green', w:520, h:380});
    o.add(txt(this,W/2,H/2-160,'🧪 使用道具（回復／復活全隊）',18,'#9fe8a0'));
    const items=RUN.cargo.filter(it=>it.kind==='道具'); const seen={}; let row=0;
    if(!items.length) o.add(txt(this,W/2,H/2-120,'貨車裡沒有道具',13,TH.dim));
    items.forEach(it=>{ if(seen[it.name]) return; seen[it.name]=true; const cnt=items.filter(x=>x.name===it.name).length; const y=H/2-110+row*46; row++;
      o.add(button(this,W/2,y,440,38,(it.icon||'🧪')+it.name+' ×'+cnt+'　'+(CONSUM_INFO[it.name]||''),()=>{ const one=RUN.cargo.find(x=>x.kind==='道具'&&x.name===it.name); if(one){ this._lastUse=useConsumable(one); this.heroes.forEach(c=>{ if(c.ref){ c.hp=c.ref.hp; this.bar(c);} }); this.updatePotions(); } this._renderItems(); },{size:11,fill:0x3a5f3a,stroke:0x5ad06a,hover:0x4c8c4c})); });
    if(this._lastUse) o.add(txt(this,W/2,H/2+130,this._lastUse,12,'#9fe8a0'));
    o.add(button(this,W/2,H/2+162,160,38,'返回營火',()=>this._renderCamp(),{variant:'info',size:14})); }
,
  // 遇見商人：隨機成為「藥水商／武器商／防具商」之一，並用「升級選技能」同款卡片 UI 呈現
  //  藥水商＝治療藥水/聖水（可重複買）｜武器商／防具商＝排除「基礎款」與「已擁有」的隨機 3 種
  //  裝備定價：30 + lvReq×15；購買後標記為已擁有 → 不再出現、也不能再買第二次（避免買重複虧錢）
  _hasGear(name){ return gearOwned(name)
      || (RUN.cargo||[]).some(it=>it.name===name)
      || (RUN.heroes||[]).some(h=>(h.weapon&&h.weapon.name===name)||(h.armor&&h.armor.name===name)); }
,
  evShop(){ const price=g=>30+((g.lvReq||1)*15);
    const wPool=WEAPONS.filter(x=>!x.starter && !this._hasGear(x.name));
    const aPool=ARMORS.filter(x=>!x.starter && !this._hasGear(x.name));
    const r=Math.random(); let type=r<1/3?'potion':(r<2/3?'weapon':'armor');
    if(type==='weapon' && !wPool.length) type = aPool.length?'armor':'potion';   // 該類已無可賣 → 改賣別類
    else if(type==='armor' && !aPool.length) type = wPool.length?'weapon':'potion';
    if(type==='potion'){
      this._shopTitle='🧪 藥水商'; this._shopHint='販售補給藥水（可重複購買）';
      this._shopGoods=[
        {kind:'道具',name:'治療藥水',tag:'藥水',cost:20,value:30,lines:['戰鬥外使用','回復全隊 30% HP']},
        {kind:'道具',name:'聖水',    tag:'藥水',cost:40,value:60,lines:['戰鬥外使用','回復全隊 50% HP']},
      ];
    } else if(type==='weapon'){
      this._shopTitle='⚔ 武器商'; this._shopHint='精煉武器（排除基礎與已擁有）';
      Phaser.Utils.Array.Shuffle(wPool);
      this._shopGoods=wPool.slice(0,3).map(w=>({kind:'武器',name:w.name,tag:'武器',cost:price(w),value:60,gear:w,
        req:'限 '+weaponClassLabel(w)+' · Lv'+(w.lvReq||1),
        lines:['ATK '+w.atkSeq.join('/')+(w.heal?'　治 '+w.heal:''), w.traitDesc||'']}));
    } else {
      this._shopTitle='🛡 防具商'; this._shopHint='堅實防具（排除基礎與已擁有）';
      Phaser.Utils.Array.Shuffle(aPool);
      this._shopGoods=aPool.slice(0,3).map(a=>({kind:'防具',name:a.name,tag:'防具',cost:price(a),value:60,gear:a,
        req:'限 '+armorClassLabel(a)+' · Lv'+(a.lvReq||1),
        lines:['DEF '+a.def+'　HP +'+a.hp, a.traitDesc||'']}));
    }
    this._shopMsg=''; this._shopMsgC='#9fe8a0'; this._renderShop();
  }
,
  _renderShop(){ const W=this.scale.width,H=this.scale.height, goods=this._shopGoods||[];
    const o=this.mkOverlay({accent:'gold', w:640, h:476});
    o.add(txt(this,W/2,H/2-208,this._shopTitle||'🧙 商人',22,TH.gold));
    o.add(txt(this,W/2,H/2-180,'💰 持有 '+(RUN.gold||0)+'　·　'+(this._shopHint||'點選卡片購買'),12,TH.cyan));
    if(!goods.length){
      o.add(txt(this,W/2,H/2-12,'這裡沒有你還缺的款式',15,TH.dim));
      o.add(txt(this,W/2,H/2+16,'（你已擁有所有可購買的裝備）',12,TH.dim));
    } else {
      const cw=178, gap=18, n=goods.length, x0=W/2-((n-1)*(cw+gap))/2, cy=H/2-2;
      goods.forEach((it,i)=>{ this.shopCard(o, x0+i*(cw+gap), cy, cw, 268, it); });
    }
    if(this._shopMsg) o.add(txt(this,W/2,H/2+150,this._shopMsg,13,this._shopMsgC||'#9fe8a0'));
    o.add(button(this,W/2,H/2+196,170,40,'離開商人',()=>this.advanceStep(),{variant:'info',size:14}));
  }
,
  // 商店卡片（與升級選技能同款）；裝備若已擁有則灰階顯示「已擁有」且不可購買
  shopCard(o, x, y, w, h, it){
    const isGear=(it.kind==='武器'||it.kind==='防具'), have=isGear&&this._hasGear(it.name);
    const vis=itemVisual(it.name), ac=have?accent('slate'):accent(vis.accent), top=-h/2;
    const afford=(RUN.gold||0)>=it.cost, full=RUN.cargo.length>=RUN.slots;
    const card=this.add.container(x,y); o.add(card);
    const g=this.add.graphics(); card.add(g);
    const draw=(hov)=>{ g.clear();
      g.fillStyle(0x000000,0.42); g.fillRoundedRect(-w/2,top+5,w,h,14);
      g.fillStyle(hov?UI.hoverN:UI.raisedN, have?0.45:1); g.fillRoundedRect(-w/2,top,w,h,14);
      g.fillStyle(ac.deep, hov?0.55:0.30); g.fillRoundedRect(-w/2,top,w,Math.round(h*0.30),14);
      g.lineStyle(hov?3:2, ac.num, have?0.5:(hov?1:0.85)); g.strokeRoundedRect(-w/2,top,w,h,14);
      g.fillStyle(ac.deep,0.55); g.fillCircle(0,top+62,27); g.lineStyle(2,ac.num,0.9); g.strokeCircle(0,top+62,27);
    };
    draw(false);
    card.add(txt(this,0,top+22,have?'已擁有':(it.tag||'商品'),12,ac.hex));
    card.add(icon(this,0,top+62,vis.icon,34,ac.num));
    card.add(txt(this,0,top+102,it.name,17,ac.hex));
    let ly=top+126;
    if(it.req){ card.add(txt(this,0,ly,it.req,11.5, have?UI.dim:'#9fd0ff')); ly+=20; }   // 職業／等級限制
    (it.lines||[]).forEach(line=>{ if(line){ card.add(txt(this,0,ly,line,11.5,have?UI.dim:UI.text,0.5,0).setWordWrapWidth(w-26).setAlign('center')); ly+=18; } });
    card.add(txt(this,0,top+h-26, have?'　已擁有　':('💰 '+it.cost), 16, have?UI.dim:(afford?UI.gold:UI.red)));
    const hit=this.add.rectangle(0,0,w,h,0xffffff,0.001).setInteractive({useHandCursor:true}); card.add(hit);
    hit.on('pointerover',()=>{ draw(true); if(!have) this.tweens.add({targets:card,y:y-7,duration:110,ease:'Quad.out'}); });
    hit.on('pointerout',()=>{ draw(false); if(!have) this.tweens.add({targets:card,y:y,duration:110,ease:'Quad.out'}); });
    hit.on('pointerdown',()=>{
      if(have){ this._shopMsg='⚠ 已擁有 '+it.name+'，無需重複購買'; this._shopMsgC='#ffd27a'; this._renderShop(); return; }
      if(!afford){ this._shopMsg='⚠ 金幣不足（需 💰'+it.cost+'）'; this._shopMsgC='#ff8a8a'; this._renderShop(); return; }
      if(full){ this._shopMsg='⚠ 貨車已滿，先用掉或捨棄道具'; this._shopMsgC='#ff8a8a'; this._renderShop(); return; }
      spendGold(it.cost);
      const cargoIcon=it.kind==='武器'?'⚔':(it.kind==='防具'?'🛡':'🧪');
      RUN.cargo.push({kind:it.kind,name:it.name,icon:cargoIcon,value:it.value||60,gear:it.gear});
      if(isGear) ownGear(it.name); else discover(it.name);   // 裝備：標記已擁有 → 不再出現、也擋第二次購買
      this.refreshHud();
      this._shopMsg='✓ 已購入 '+it.name; this._shopMsgC='#9fe8a0'; this._renderShop();
    });
    return card;
  }
,
  evEvent(){ const W=this.scale.width,H=this.scale.height;
    const pool=[
      {t:'⛲ 治療之泉',d:'飲下清泉，全隊回復 40% 體力',b:'飲用',auto:true,act:()=>{ RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.4)); } }); }},
      {t:'🧙 流浪商人',d:'花 💰60 購入 2 瓶治療藥水',b:'購買 💰60',cond:()=>(RUN.gold||0)>=60&&RUN.cargo.length<RUN.slots,act:()=>{ spendGold(60); for(let i=0;i<2;i++){ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); discover('治療藥水'); } } }},
      {t:'🏛 古老祭壇',d:'供奉 💰120，換得本關一件未尋得的遺物',b:'供奉 💰120',cond:()=>(RUN.gold||0)>=120&&RUN.cargo.length<RUN.slots&&uncollectedRelicsForDest(RUN.destIndex||0).length>0,act:()=>{ spendGold(120); const it=rollRelicForDest(RUN.destIndex||0); if(it) RUN.cargo.push(it); }},
    ];
    const ev=Phaser.Utils.Array.GetRandom(pool.filter(e=>!e.cond||e.cond()))||pool[0];
    if(ev.auto){   // 治療之泉等：不跳選擇，直接生效後自動前進
      ev.act(); this.refreshHud();
      const oa=this.mkOverlay({accent:'green',w:460,h:184});
      oa.add(txt(this,W/2,H/2-34,ev.t,19,'#9fe8a0'));
      oa.add(txt(this,W/2,H/2+2,ev.d,13,TH.text).setWordWrapWidth(400));
      oa.add(txt(this,W/2,H/2+38,'清泉已飲用，全隊回復',12,'#9fe8a0'));
      this.time.delayedCall(1200,()=>this.advanceStep()); return;
    }
    const o=this.mkOverlay({accent:'green',w:460,h:220});
    o.add(txt(this,W/2,H/2-64,ev.t,19,'#9fe8a0')); o.add(txt(this,W/2,H/2-28,ev.d,13,TH.text).setWordWrapWidth(400));
    o.add(button(this,W/2-92,H/2+40,156,40,ev.b,()=>{ ev.act(); this.refreshHud(); this.advanceStep(); },{variant:'go',size:13}));
    o.add(button(this,W/2+92,H/2+40,156,40,'離開',()=>this.advanceStep(),{variant:'info',size:13})); }
});
