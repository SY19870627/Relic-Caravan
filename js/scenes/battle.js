// ========================= 戰鬥 =========================
class Battle extends Phaser.Scene {
  constructor(){ super('Battle'); }
  // v1.0：常駐遠征場景。create 只做一次性佈景＋探險%條，之後 beginStep 迴圈跑每場遭遇。
  create(){
    this.over=false; this.paused=false; this.infoUI=null; this.hitstopUntil=0; this.entering=false;
    // 場景重啟（第二趟遠征）沿用同一 scene 實例：清掉上一趟殘留(已銷毀)的戰鬥物件參照，
    // 否則 beginStep 會誤判 this.heroes 還在而走 refreshHeroes() 去動已銷毀精靈 → null frame 'cut' 崩潰。
    this.heroes=null; this.enemies=null; this.all=null; this.overlay=null; this.encIntro=null; this.encCap=null; this._sipUntil=0; this._menuPaused=false; this.pauseUI=null; this._gearFrom=null;
    const W=this.scale.width, H=this.scale.height;
    // v1.1：依目的地切換戰鬥背景主題（牆／地板／火把色），各區視覺區隔
    const di=(RUN&&RUN.destIndex)||0;
    const wallKey=this.textures.exists('wall'+di)?('wall'+di):'wall';
    const floorKey=this.textures.exists('floor'+di)?('floor'+di):'floor';
    this.bgWall=this.add.tileSprite(0,0,W,360,wallKey).setOrigin(0).setTileScale(2,2);
    this.bgFloor=this.add.tileSprite(0,360,W,H-360,floorKey).setOrigin(0).setTileScale(2,2);
    this.add.rectangle(0,360,W,3,0x0a0710).setOrigin(0);
    const _hb=this.add.graphics().setDepth(59); _hb.fillStyle(UI.bg2,0.8); _hb.fillRoundedRect(8,8,W-16,62,10); _hb.lineStyle(1.5,UI.lineN,0.6); _hb.strokeRoundedRect(8,8,W-16,62,10);
    const TORCH=[[0xffb347,0xffe08a],[0x9be0a0,0xe6ffe0],[0x6fd0e0,0xbff0f5],[0xc46bff,0xe8b0ff]][di]||[0xffb347,0xffe08a];
    this.torch(120,150,TORCH[0],TORCH[1]); this.torch(W-120,150,TORCH[0],TORCH[1]);
    this.fxFlash=this.add.rectangle(0,0,W,H,0xffffff,1).setOrigin(0).setDepth(95).setAlpha(0); // 全螢幕閃光層
    this.buildPctBar();
    // 戰鬥速度（跨場記住）
    this.speed = BATTLE_SPEED || 1;
    this.tweens.timeScale = this.speed; this.time.timeScale = this.speed;
    this.speedBtn = button(this, W-64, 20, 100, 28, `速度 x${this.speed}`, ()=>{
      this.speed = this.speed>=4 ? 1 : this.speed*2; BATTLE_SPEED=this.speed;
      this.tweens.timeScale=this.speed; this.time.timeScale=this.speed;
      this.speedBtn.label.setText(`速度 x${this.speed}`);
    }, {size:12,fill:0x33486b,stroke:0x5a8cd0,hover:0x466a9c});
    this.speedBtn.setDepth(60);
    this.pauseBtn = button(this, W-176, 20, 92, 28, '⏸ 暫停', ()=>this.togglePause(), {size:12,fill:0x4a3f63,stroke:0x7a6f93,hover:0x5d5080});
    this.pauseBtn.setDepth(60);
    if(this.input&&this.input.keyboard){ this.input.keyboard.on('keydown-ESC',()=>this.togglePause()); this.input.keyboard.on('keydown-P',()=>this.togglePause()); }
    this.goldText = txt(this, W-22, 50, '💰 '+((RUN&&RUN.gold)||0), 13, '#ffe08a', 1).setDepth(62);
    this.potText = txt(this, 26, 54, '🧪 藥水 ×'+this.healPotCount(), 12, '#9fe8a0', 0).setDepth(62);
    this.waveText = txt(this,W/2,40,'',12,UI.gold).setDepth(60);
    this.banner = txt(this,W/2,H/2,'',34,'#fff').setStroke('#000',6).setDepth(90);   // 90<浮窗96：選單開啟時不會被戰鬥橫幅蓋住
    if(!RUN.exped) initExpedition();
    this.beginStep();
  }
  buildPctBar(){
    const W=this.scale.width, x=18, y=16, w=W-250, h=12; this._pctBox={x,y,w,h};
    const g=this.add.graphics().setDepth(60); g.fillStyle(UI.inkN,0.9); g.fillRoundedRect(x,y,w,h,6); g.lineStyle(1.5,UI.lineN,0.7); g.strokeRoundedRect(x,y,w,h,6);
    this._pctFill=this.add.graphics().setDepth(61);
    this._pctText=txt(this,x+8,y+h+8,'探險 0%',12,UI.gold,0).setDepth(62);
  }
  updatePctBar(){
    if(!this._pctFill||!RUN.exped) return; const {x,y,w,h}=this._pctBox, p=Math.max(0,Math.min(1,(RUN.exped.pct||0)/100));
    this._pctFill.clear(); if(p>0){ this._pctFill.fillStyle(p>=0.99?UI.redN:UI.goldN,1); this._pctFill.fillRoundedRect(x,y,Math.max(h,w*p),h,6); }
    this._pctText.setText('探險 '+(RUN.exped.pct||0)+'%'+((RUN.exped.pct||0)>=99?'　·　守衛者現身！':''));
  }
  updateGold(){ if(this.goldText) this.goldText.setText('💰 '+((RUN&&RUN.gold)||0)); }
  healPotCount(){ const HP={'治療藥水':1,'聖水':1,'回復卷軸':1}; return (RUN&&RUN.cargo)? RUN.cargo.filter(it=>it.kind==='道具'&&HP[it.name]).length : 0; }
  updatePotions(){ if(this.potText) this.potText.setText('🧪 藥水 ×'+this.healPotCount()); }
  refreshHud(){ (this.heroes||[]).forEach(c=>{ if(c&&c.ref){ c.hp=c.ref.hp; this.bar(c);} }); this.updateGold(); this.updatePotions(); }
  // 換裝後即時把新裝備數值套到場上戰鬥單位（不重置冷卻/站位）
  restatHeroes(){ (this.heroes||[]).forEach(c=>{ if(!c||!c.ref) return; const s=heroStat(c.ref); c.maxHp=s.maxHp; c.atkSeq=s.atkSeq.map(a=>Math.max(1,a+(this._heroAtkMod||0))); c.def=s.def+(this._heroDefMod||0); c.heal=s.heal; c.weaponTrait=s.weaponTrait; c.armorTrait=s.armorTrait; c.hp=Math.max(0,Math.min(c.maxHp,c.ref.hp)); this.bar(c); }); }
  // 開始一場遭遇：戰鬥→生成敵人；非戰鬥→秀互動浮窗。英雄每場由 RUN.heroes 重建（HP 延續）。
  beginStep(){
    this.over=false; this.entering=false; this.waveClearing=false; this.waveIndex=0; this.hitstopUntil=0; this._advancing=false;
    if(this.overlay){ this.overlay.destroy(); this.overlay=null; }
    if(this.encIntro){ this.encIntro.destroy(); this.encIntro=null; } if(this.encCap){ this.encCap.destroy(); this.encCap=null; }
    const _re=relicEffects();
    this._firstHitCrit=!!_re.firstHitCrit; this._reviveOnce=!!_re.reviveOnce; this.reviveUsed=false;
    this._splash=!!_re.splash; this._regen=_re.regen||0; this._killCrit=!!_re.killCrit; this._healToShield=!!_re.healToShield;
    this._lastStand=!!_re.lastStand; this._firstDeathHeal=_re.firstDeathHeal||0; this._firstDeathDone=false;
    this._firstStrikeAoe=!!_re.firstStrikeAoe; this._lifesteal=_re.lifesteal||0; this._startShield=_re.startShield||0;
    this._cookFirstCrit=!!(RUN&&RUN.cookFirstCrit);
    this._bondHealInvuln=bondTriggerActive('healInvuln'); this._bondStunMark=bondTriggerActive('stunMark'); this._bondKillCdCut=bondTriggerActive('killCdCut');
    const ex=RUN.exped; const stype=(ex.i>=ex.plan.length)?'boss':ex.plan[ex.i];
    const combat=(stype==='boss'||stype==='battle'||stype==='elite');
    RUN.isBoss=(stype==='boss');
    RUN.node = combat
      ? {type:stype, risk:(stype==='boss'?4:stype==='elite'?3:Math.min(3,1+Math.floor(ex.i/2))), layer:ex.i, weather:(ex.i===0?'clear':Phaser.Utils.Array.GetRandom(WEATHERS).id), done:false}
      : {type:stype, risk:0, layer:ex.i, weather:'clear', done:false};
    const W=this.scale.width; const node=RUN.node; const wx=WEATHER_BY_ID[node.weather];
    this._heroAtkMod=((wx&&wx.eff&&wx.eff.allAtk)||0); this._heroDefMod=0;
    this._enemyAtkMod=((wx&&wx.eff&&wx.eff.allAtk)||0); this._enemyDefMod=((wx&&wx.eff&&wx.eff.enemyDef)||0);
    if(this._envText){ this._envText.destroy(); this._envText=null; }
    if(wx&&wx.eff) this._envText=txt(this,W/2,57,'環境　'+wx.icon+wx.name,11,UI.blue).setDepth(60);
    if(!this.heroes || !this.heroes.length) this.buildHeroes(); else this.refreshHeroes();
    this.enemies=[]; this.all=[...this.heroes];
    this.updatePctBar(); this.updateGold(); this.updatePotions();
    if(combat){ this.waves=(stype==='boss')?buildBoss():buildEncounter(node); this.totalWaves=this.waves.length; this.spawnWave(); if(RUN){ RUN.cookShield=0; RUN.cookFirstCrit=false; } }
    else { this.over=true; this.playEncounterIntro(stype, ()=>this.openEncounter(stype)); }
  }
  buildHeroes(){
    this.heroes=RUN.heroes.map((h)=>{ const s=heroStat(h), fs=formationSlot(h.sprite);
      const atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)), def=s.def+this._heroDefMod;
      const pk=heroPerks(h.idx);
      const interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1)));
      const useBonus=(pk.useBonus||0);
      const startShield=(this._startShield||0)+(pk.startShield||0)+((s.armorTrait&&s.armorTrait.startShield)||0)+((RUN&&RUN.cookShield)||0)+(horseFeature()==='vanguard'?20:0);
      const c=this.makeCombatant({sprite:h.sprite,name:`${h.name} Lv${s.level}`,maxHp:s.maxHp,hp:Math.max(0,h.hp),atkSeq,def,heal:s.heal,interval,ranged:h.ranged,healer:h.healer,aoe:h.aoe,skills:s.skills,row:fs.row,ref:h, weaponTrait:s.weaponTrait, armorTrait:s.armorTrait, useBonus}, 'hero', fs.x, fs.y);
      c.maxShield=startShield; c.shield=startShield; this.bar(c); return c;   // 每場開場：護盾補滿（與 HP 分開）
    });
    this.heroes.forEach(c=>{ if(c.hp<=0){ c.alive=false; c.container.setAlpha(0.25); c.spr.setTint(0x555555);} });
  }
  refreshHeroes(){
    this.heroes.forEach(c=>{ const h=c.ref, s=heroStat(h), fs=formationSlot(h.sprite), pk=heroPerks(h.idx);
      c.maxHp=s.maxHp; c.atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)); c.def=s.def+this._heroDefMod; c.heal=s.heal;
      c.interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1))); c.useBonus=(pk.useBonus||0);
      c.skills=s.skills; c.weaponTrait=s.weaponTrait; c.armorTrait=s.armorTrait; c.aoe=h.aoe; c.ranged=h.ranged; c.healer=h.healer;
      c.hp=Math.max(0,h.hp); c.alive=c.hp>0;
      const _ss=(this._startShield||0)+(pk.startShield||0)+((s.armorTrait&&s.armorTrait.startShield)||0)+((RUN&&RUN.cookShield)||0)+(horseFeature()==='vanguard'?20:0);
      c.maxShield=_ss; c.shield=_ss;   // 每場開場：護盾補滿（與 HP 分開）
      c.atkI=0; c.firstHitDone=false; c.firstStrikeDone=false; c.killCrit=false; c.markCrit=false; c.deathSaveUsed=false; c._proc=null;
      c.stunned=false; c.stunUntil=0; c.invulnUntil=0; c.lastAttack=-Math.random()*800;
      if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
      c.skillCD={}; (c.skills||[]).forEach(sk=>{ if(sk.cd!==undefined) c.skillCD[sk.name]={last:-1e9,left:sk.uses+(c.useBonus||0)}; });
      c.baseX=fs.x; c.baseY=fs.y; c.row=fs.row; c.container.setPosition(fs.x,fs.y).setDepth(fs.y/200).setAngle(0).setAlpha(c.alive?1:0.25);
      c.spr.clearTint(); if(!c.alive) c.spr.setTint(0x555555);
      if(c.nameText) c.nameText.setText(`${h.name} Lv${s.level}`);
      this.bar(c);
      if(c.pipsCont){ c.pipsCont.destroy(); c.pipsCont=null; c.skillPips=null; }
      this.buildSkillPips(c);
    });
  }
  // 後備站位：怪物組未指定 x,y 時，依數量自動排版（最多 9）
  autoEnemyPos(n){
    if(n<=1) return [[660,330]];
    if(n===2) return [[575,245],[575,410]];
    if(n===3) return [[560,205],[560,450],[700,330]];
    const cols=[555,690,815], out=[], per=Math.ceil(n/3); let i=0;
    for(let c=0;c<3 && i<n;c++){ const cnt=Math.min(per,n-i);
      for(let r=0;r<cnt;r++){ const y=(cnt===1)?330:Math.round(175+r*(300/(cnt-1))); out.push([cols[c],y]); i++; } }
    return out;
  }
  spawnWave(){
    const ec=this.waves[this.waveIndex];
    const W=this.scale.width;
    const fb = this.autoEnemyPos(ec.length);   // 後備站位（資料未指定 x,y 時才用）
    const fresh = ec.map((e,idx)=>{ const big=e.boss;
      const px=(e.x!=null)?e.x:fb[idx][0], py=(e.y!=null)?e.y:fb[idx][1];
      const eAtk=e.atkSeq.map(a=>Math.max(1,a+(this._enemyAtkMod||0))), eDef=e.def+(this._enemyDefMod||0);
      const c=this.makeCombatant({sprite:e.sprite,name:e.name,maxHp:e.hp,hp:e.hp,atkSeq:eAtk,def:eDef,heal:e.heal||0,interval:e.interval,ranged:e.ranged,healer:!!e.healer,boss:e.boss,skills:e.skills,row:e.row}, 'enemy', px, py, big?6:SCALE);
      // 從畫面右側走進場，到定位才開打
      c.container.x = W + 80 + idx*70;
      this.tweens.add({targets:c.container, x:c.baseX, duration:640, ease:'Quad.out', delay:idx*90});
      return c;
    });
    this.enemies.push(...fresh); this.all.push(...fresh);
    // 馬匹・均衡馬（先攻）：第一波敵人慢半拍出手，給我方一個開場
    if(this.waveIndex===0 && horseFeature()==='initiative'){ fresh.forEach(e=>{ e.stunUntil=this.time.now+1500; }); }
    // 走位期間禁止行動，全部就定位才開打（用計時器旗標，避免時鐘 epoch 問題）
    this.entering=true;
    this.time.delayedCall(700 + (ec.length-1)*90, ()=>{ this.entering=false; });
    if(this.totalWaves>1) this.waveText.setText(`第 ${this.waveIndex+1} / ${this.totalWaves} 波`);
    const isLast=this.waveIndex===this.totalWaves-1;
    const msg = this.waveIndex===0
      ? (RUN.isBoss ? (this.totalWaves>1?'遺物室守衛攔路！':'守護者現身！') : '遭遇敵人！')
      : (RUN.isBoss&&isLast ? '守護者現身！' : `第 ${this.waveIndex+1} 波來襲！`);
    if(RUN.isBoss && isLast){ this.screenFlash(0xff5a5a,0.34,540); this.shake(540,0.015);
      this.banner.setText(msg).setAlpha(1).setScale(0.5);
      this.tweens.add({targets:this.banner,scale:1.3,duration:430,ease:'Back.out'});
      this.tweens.add({targets:this.banner,alpha:0,delay:1400,duration:520,onComplete:()=>{ this.banner.setScale(1).setText(''); }}); }
    else { this.banner.setText(msg).setAlpha(1);
      this.tweens.add({targets:this.banner,alpha:0,delay:850,duration:450,onComplete:()=>this.banner.setText('')}); }
  }
  torch(x,y,flameCol,coreCol){
    flameCol=(flameCol===undefined)?0xffb347:flameCol; coreCol=(coreCol===undefined)?0xffe08a:coreCol;
    this.add.rectangle(x,y,8,22,0x4d3019).setDepth(5);
    const glow=this.add.circle(x,y-14,30,flameCol,0.12).setDepth(4);
    const flame=this.add.ellipse(x,y-16,12,20,flameCol).setDepth(6);
    const core=this.add.ellipse(x,y-15,6,12,coreCol).setDepth(7);
    this.tweens.add({targets:[flame,core],scaleY:0.78,scaleX:1.15,duration:160,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.tweens.add({targets:glow,alpha:0.05,duration:200,yoyo:true,repeat:-1});
  }
  makeCombatant(d,side,x,y,scl){
    const cont=this.add.container(x,y).setDepth(y/200);   // Y-sort：越靠下(大 y)畫得越前面，重疊時景深自然（範圍 <4，仍在 HUD/火把之下）
    const facing=side==='hero'?1:-1;
    const shadow=this.add.ellipse(0,34,40,12,0x000000,0.4);
    const spr=this.add.image(0,0,d.sprite).setScale(scl||SCALE);
    if(side==='enemy') spr.setFlipX(true);
    const nameText=txt(this,0,-54,d.name,12,'#fff').setStroke('#000',3);
    const barBg=this.add.rectangle(0,-42,52,7,0x000000,0.75).setStrokeStyle(1,0x000000);
    const barFill=this.add.rectangle(-25,-42,50,5,side==='hero'?0x5ad06a:0xd05a5a).setOrigin(0,0.5);
    const shieldFill=this.add.rectangle(-25,-42,0,5,0x6fd6ff).setOrigin(0,0.5).setVisible(false);   // 護盾段（青色）：與 HP 同一條，緊接在 HP 之後
    cont.add([shadow,spr,nameText,barBg,barFill,shieldFill]);
    this.tweens.add({targets:spr,y:-2,duration:550+Math.random()*250,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    const obj={...d,side,container:cont,spr,barFill,shieldFill,nameText,alive:true,facing,baseX:x,baseY:y,lastAttack:-Math.random()*800,atkI:0,shield:0,maxShield:0};
    obj.skillCD={};
    (obj.skills||[]).forEach(s=>{ if(s.cd!==undefined) obj.skillCD[s.name]={last:-1e9,left:s.uses+(d.useBonus||0)}; });
    if(side==='hero') this.buildSkillPips(obj);
    spr.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.showInfo(obj));
    return obj;
  }
  // 角色頭上技能格：顯示擁有的技能，亮=可用、暗=冷卻/用盡
  buildSkillPips(c){
    const sk=c.skills||[]; c.pipsCont=null; c.skillPips=null; if(!sk.length) return;
    c.skillPips={};
    const ps=22, gap=5, total=sk.length*ps+(sk.length-1)*gap, cont=this.add.container(0,-84).setDepth(70); c.container.add(cont); c.pipsCont=cont;
    let cx=-total/2+ps/2;
    sk.forEach(s=>{ const sv=skillVisual(s), ac=accent(sv.accent), active=s.cd!==undefined;
      const pc=this.add.container(cx,0); const g=this.add.graphics();
      g.fillStyle(0x07060f,0.88); g.fillRoundedRect(-ps/2,-ps/2,ps,ps,6);
      g.lineStyle(1.5, ac.num, 0.95); g.strokeRoundedRect(-ps/2,-ps/2,ps,ps,6);
      pc.add([g, icon(this,0,0,sv.icon,ps*0.62,ac.num)]); cont.add(pc);
      c.skillPips[s.name]={c:pc, acc:ac.num, active, skill:s};
      cx+=ps+gap;
    });
  }
  // 技能施放：閃爍對應技能格 + 在頭上彈出技能名
  skillCast(c,s){ this.skillProc(c, s.name); }
  // 顯示技能名稱（主動立即；被動可加 throttle 防洗版）並閃爍對應技能格
  skillProc(c, name, opt){
    opt=opt||{};
    if(opt.throttle){ const now=this.time.now; if(!c._proc)c._proc={}; if(now-(c._proc[name]||-1e9) < opt.throttle) return; c._proc[name]=now; }
    const pip=c.skillPips&&c.skillPips[name];
    if(pip){ this.tweens.add({targets:pip.c,scaleX:1.4,scaleY:1.4,duration:130,yoyo:true,repeat:1,ease:'Quad.out'}); }
    const accNum = c.side==='hero'? (pip?pip.acc:0x6aa6f0) : 0xff6f7a;
    const cont=this.add.container(c.container.x, c.baseY-102).setDepth(86);
    const t=txt(this,0,0,name,13,'#ffffff'); const w=t.width+18;
    const g=this.add.graphics(); g.fillStyle(0x07060f,0.92); g.fillRoundedRect(-w/2,-12,w,24,8); g.lineStyle(2,accNum,1); g.strokeRoundedRect(-w/2,-12,w,24,8);
    cont.add([g,t]); cont.setScale(0.6);
    this.tweens.add({targets:cont,scale:1,duration:140,ease:'Back.out'});
    this.tweens.add({targets:cont,y:cont.y-34,alpha:0,duration:780,delay:240,ease:'Quad.out',onComplete:()=>cont.destroy()});
  }
  // 每幀更新技能格亮暗（冷卻/用盡）
  updateSkillPips(){
    if(!this.heroes) return; const now=this.time.now;
    this.heroes.forEach(c=>{ if(!c.skillPips) return;
      for(const name in c.skillPips){ const p=c.skillPips[name]; let alpha=1;
        if(!c.alive) alpha=0.18;
        else if(p.active){ const st=c.skillCD[name]; if(st){ alpha = st.left<=0 ? 0.32 : (now-st.last < p.skill.cd ? 0.5 : 1); } }
        p.c.setAlpha(alpha);
      }
    });
  }
  showInfo(c){
    this.paused=true;
    if(this.infoUI) this.infoUI.destroy();
    const W=this.scale.width,H=this.scale.height, px=W/2, py=H/2;
    const ui=this.add.container(0,0).setDepth(105); this.infoUI=ui;
    ui.add(this.add.rectangle(0,0,W,H,0x000000,0.55).setOrigin(0).setInteractive());
    ui.add(panel(this,px,py,380,260,{accent: c.side==='hero'?'green':'red'}));
    const img=this.add.image(px-120,py-30,c.sprite).setScale(c.sprite==='guardian'?4.5:5); if(c.side==='enemy') img.setFlipX(true);
    ui.add(img);
    const type=c.boss?'首領':(c.healer?'治療':(c.ranged?'遠程':'近戰'));
    ui.add(txt(this,px+20,py-96,c.name,18, c.side==='hero'?TH.gold:'#ff8a8a',0));
    ui.add(txt(this,px+20,py-64,`陣營：${c.side==='hero'?'我方':'敵方'}　類型：${type}`,12,TH.text,0));
    ui.add(txt(this,px+20,py-40,`HP ${Math.max(0,Math.round(c.hp))} / ${c.maxHp}`+((c.maxShield>0||c.shield>0)?`　🛡 ${Math.round(c.shield||0)} / ${Math.round(c.maxShield||0)}`:''),15,'#9fd0a0',0));
    ui.add(txt(this,px+20,py-16,`ATK ${(c.atkSeq||[]).join(' / ')}　DEF ${c.def}`,14,TH.text,0));
    ui.add(txt(this,px+20,py+2,`出手速度 ${(c.interval/1000).toFixed(1)} 秒/次（傷害依序循環）`,12,TH.dim,0));
    const skTxt=(c.skills&&c.skills.length)? c.skills.map(s=> s.cd!==undefined?`${s.name}(CD${s.cd/1000}s×${s.uses})`:`${s.name}(被動)`).join('、') : '無';
    ui.add(txt(this,px+20,py+24,`技能：${skTxt}`,11,'#ffd24a',0));
    ui.add(txt(this,px,py+54,BIO[c.sprite]||'',12,TH.cyan,0.5));
    ui.add(button(this,px,py+98,120,32,'關閉',()=>{ ui.destroy(); this.infoUI=null; this.paused=false; },{size:14,fill:0x4a3f63,stroke:0x7a6f93}));
  }
  update(time){
    this.updateSkillPips();
    if(this.over||this.paused) return;
    if(this.entering) return;              // 敵人走位進場中，雙方都先不出手
    if(this.time.now < this.hitstopUntil) return;   // 命中停頓（用場景時鐘，與速度一致）
    this.autoSip();
    for(const c of this.all){ if(!c.alive) continue; if(this.time.now < (c.stunUntil||0)) continue;
      if(time>c.lastAttack+c.interval/this.speed){ c.lastAttack=time; this.act(c); } }
  }
  // 戰鬥中自動喝水：最低血隊員 < 門檻時自動喝「最弱的補血藥水」（保留強藥），整隊回復；有冷卻避免狂喝
  autoSip(){
    if(GUILD.settings && GUILD.settings.autoSip===false) return;
    const alive=this.aliveOf('hero'); if(!alive.length) return;
    const frac=(CFG.autoSip&&CFG.autoSip.hpFrac)||0.30;
    const cd=(CFG.autoSip&&CFG.autoSip.cooldownMs)||2500;
    // 每名隊員各自的喝水冷卻：挑「低於門檻、且自己冷卻已過」的最虛弱者，一瓶只補他一人
    let target=null,lowest=9;
    alive.forEach(c=>{ const fr=c.hp/c.maxHp; if(fr<frac && this.time.now>=(c._sipUntil||0) && fr<lowest){ lowest=fr; target=c; } });
    if(!target) return;
    const HEAL={'治療藥水':0.3,'聖水':0.5,'回復卷軸':0.6};
    let best=null,bp=9;
    RUN.cargo.forEach(it=>{ if(it.kind==='道具' && HEAL[it.name]!=null && HEAL[it.name]<bp){ best=it; bp=HEAL[it.name]; } });
    if(!best) return;
    const pct=HEAL[best.name], idx=RUN.cargo.indexOf(best); if(idx>=0) RUN.cargo.splice(idx,1); discover(best.name);
    const h=Math.round(target.maxHp*pct); target.hp=Math.min(target.maxHp,target.hp+h); if(target.ref)target.ref.hp=target.hp; this.bar(target);
    pixelNum(this,target.container.x,target.container.y-34,'+'+h,0x7dff9a);
    this.floatLabel(target.baseX,target.baseY-58,'喝下 '+(best.icon||'🧪')+best.name,'#9fe8a0');
    this.updatePotions();
    target._sipUntil=this.time.now+cd;
  }
  aliveOf(side){ return this.all.filter(c=>c.alive&&c.side===side); }
  pickByRow(foes){ const w=foes.map(f=>ROW_WEIGHT[f.row]||1.5); let total=w.reduce((a,b)=>a+b,0), r=Math.random()*total;
    for(let i=0;i<foes.length;i++){ r-=w[i]; if(r<=0) return foes[i]; } return foes[foes.length-1]; }
  getSkill(c,type){ return (c.skills||[]).find(s=>s.type===type); }
  hasSkillType(c,type){ return (c.skills||[]).some(s=>s.type===type); }
  cutPriestCd(){ this.heroes.forEach(h=>{ if(h.sprite==='priest'&&h.alive){ for(const k in h.skillCD){ h.skillCD[k].last-=1500; } } }); }   // 羈絆・神諭指引
  trySkill(c,type){
    const s=(c.skills||[]).find(k=>k.type===type); if(!s || s.cd===undefined) return null;
    const st=c.skillCD[s.name]; if(!st || st.left<=0) return null;
    if(this.time.now - st.last < s.cd) return null;
    st.last=this.time.now; st.left--; this.skillCast(c,s); return s;
  }
  act(c){
    // 遺物・殘缺護符（生機）：非治療成員每次行動回復少量 HP
    if(c.side==='hero' && this._regen>0 && !c.healer && c.alive && c.hp>0 && c.hp<c.maxHp){ const h=Math.max(1,Math.round(c.maxHp*this._regen)); c.hp=Math.min(c.maxHp,c.hp+h); this.bar(c); pixelNum(this,c.container.x,c.container.y-34,'+'+h,0x7dff9a); }
    if(c.healer){ const al=this.aliveOf(c.side); const low=al.reduce((a,b)=>(b.hp/b.maxHp<a.hp/a.maxHp?b:a),al[0]);
      if(low&&low.hp/low.maxHp<CFG.battle.healThreshold){ this.heal(c,low); return; } }
    const foes=this.aliveOf(c.side==='hero'?'enemy':'hero'); if(!foes.length) return;
    // 遺物・星辰碎核（墜星）：我方本場第一次攻擊改為打全體
    if(c.side==='hero' && this._firstStrikeAoe && !c.firstStrikeDone){ c.firstStrikeDone=true; c.firstHitDone=true;
      this.floatLabel(c.baseX,c.baseY-58,'墜星!','#ffd24a'); this.screenFlash(0xffd24a,0.16,200);
      foes.forEach(f=>{ if(f.alive) this.damage(c,f,{aoeHit:true}); }); return; }
    if(c.aoe){ this.aoeCast(c); }
    else {
      const target = c.side==='enemy' ? this.pickByRow(foes) : Phaser.Utils.Array.GetRandom(foes);
      if(c.ranged) this.ranged(c,target,c.healer); else this.melee(c,target);
    }
    // 連射／連環施法：追加一擊（CD＋次數）
    if(this.trySkill(c,'doubleHit')){
      this.time.delayedCall(300,()=>{ if(!c.alive||this.over) return; const fs=this.aliveOf(c.side==='hero'?'enemy':'hero');
        if(fs.length){ if(c.aoe){ this.aoeCast(c); } else { const t=Phaser.Utils.Array.GetRandom(fs); c.ranged?this.ranged(c,t,false):this.melee(c,t);} } }); }
  }
  // 全滅 → 結算（撤退/全滅都走 Result）
  finish(win){
    if(this.over) return; this.over=true;
    this.heroes.forEach(c=>{ c.ref.hp = c.alive? c.hp : 0; });
    this.time.delayedCall(700,()=>{ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); });
  }
  // 本場清空：結算經驗/掉落，推進探險%，王→通關，否則行軍到下一場
  clearStep(){
    if(this.over) return; this.over=true;
    this.heroes.forEach(c=>{ c.ref.hp = c.alive? c.hp : 0; });
    const wasBoss=RUN.isBoss, node=RUN.node;
    this.time.delayedCall(700,()=>{
      const xp = wasBoss?CFG.battleXp.boss:(CFG.battleXp.base+(node?node.risk:1)*CFG.battleXp.perRisk);
      gainXP(xp); saveGuild();
      const re=relicEffects();
      const rec=horseFeature()==='recovery'?0.12:0;
      RUN.heroes.forEach(h=>{ const mx=heroStat(h).maxHp;
        if(re.fullHealAfterBattle){ h.hp=mx; }
        else { h.hp = h.hp>0? Math.min(mx,h.hp+Math.round(mx*(CFG.battle.postHealAlive+rec))) : Math.round(mx*CFG.battle.postHealRevive); } });
      if(wasBoss){
        const rel=rollRelicForDest(RUN.destIndex||0);
        const drop = rel || {kind:'貴重物品',name:'守護者寶藏',icon:'💎',value:CFG.battle.bossRelicValue};
        if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(drop); if(drop.kind!=='遺物') discover(drop.name); }
        RUN.exped.pct=100; this.updatePctBar();
        this.scene.start('Result',{outcome:'clear'}); return;
      }
      if(node&&node.type==='elite'){
        if(hasDeck2() && !RUN.deckExpanded){ RUN.slots+=3; RUN.deckExpanded=true; }
        const count = 2 + (re.extraLoot||0);
        for(let k=0;k<count;k++){ const it=rollItem(node?node.risk:1);
          if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(it); discover(it.name); if(it.gear) ownGear(it.name); } }
      } else {
        const gc=CFG.gold||{}, g=Math.max(1, Math.round(((gc.battleBase||16)+(node?node.risk:1)*(gc.battlePerRisk||12))*(1+(((RUN.destTier||1)-1)*0.25))));
        addGold(g); this.updateGold();
        const gf=txt(this,this.scale.width-60,66,'💰 +'+g,15,'#ffe08a').setDepth(101).setStroke('#000',4);
        this.tweens.add({targets:gf,y:50,alpha:0,duration:1150,ease:'Quad.out',onComplete:()=>gf.destroy()});
      }
      this.showLevelups();
    });
  }
  marchNext(){
    this.updatePctBar();
    if(this.bgWall) this.tweens.add({targets:[this.bgWall,this.bgFloor], tilePositionX:'+=240', duration:780, ease:'Sine.inOut'});
    if(this.encIntro) this.tweens.add({targets:this.encIntro, x:'-=320', alpha:0, duration:640, ease:'Sine.in'});
    (this.heroes||[]).forEach(c=>{ if(c&&c.alive&&c.container) this.tweens.add({targets:c.container, x:c.baseX+12, duration:190, yoyo:true, repeat:1, ease:'Sine.inOut'}); });
    this.banner.setText('▶ 前進中…').setAlpha(1);
    this.tweens.add({targets:this.banner,alpha:0,delay:600,duration:320,onComplete:()=>this.banner.setText('')});
    this.time.delayedCall(760,()=>{
      (this.enemies||[]).forEach(c=>{ if(c&&c.container) c.container.destroy(); });
      if(this.encIntro){ this.encIntro.destroy(); this.encIntro=null; } if(this.encCap){ this.encCap.destroy(); this.encCap=null; }
      if(this._envText){ this._envText.destroy(); this._envText=null; }
      this.enemies=[]; this.all=[...(this.heroes||[])];
      this.beginStep();
    });
  }
  advanceStep(){ if(this._advancing) return; this._advancing=true; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } RUN.exped.i++; RUN.exped.pct=Math.min(99, Math.round(RUN.exped.i/RUN.exped.plan.length*99)); this.marchNext(); }
}

