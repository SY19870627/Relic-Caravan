// ========================= 戰鬥 =========================
class Battle extends Phaser.Scene {
  constructor(){ super('Battle'); }
  // v1.0：常駐遠征場景。create 只做一次性佈景＋探險%條，之後 beginStep 迴圈跑每場遭遇。
  create(){
    this.over=false; this.paused=false; this.infoUI=null; this.hitstopUntil=0; this.entering=false;
    // 場景重啟（第二趟遠征）沿用同一 scene 實例：清掉上一趟殘留(已銷毀)的戰鬥物件參照，
    // 否則 beginStep 會誤判 this.heroes 還在而走 refreshHeroes() 去動已銷毀精靈 → null frame 'cut' 崩潰。
    this.heroes=null; this.enemies=null; this.all=null; this.overlay=null; this.encIntro=null; this.encCap=null; this._sipUntil=0; this._menuPaused=false; this.pauseUI=null; this._gearFrom=null; this.partyHud=null;
    const W=this.scale.width, H=this.scale.height;
    // v1.1：依目的地切換戰鬥背景主題（牆／地板／火把色），各區視覺區隔
    const di=(RUN&&RUN.destIndex)||0;
    const wallKey=this.textures.exists('battleWall'+di)?('battleWall'+di):(this.textures.exists('wall'+di)?('wall'+di):'wall');
    const floorKey=this.textures.exists('battleFloor'+di)?('battleFloor'+di):(this.textures.exists('floor'+di)?('floor'+di):'floor');
    this.bgWall=this.add.tileSprite(0,0,W,360,wallKey).setOrigin(0).setTileScale(2,2);
    this.bgFloor=this.add.tileSprite(0,360,W,H-360,floorKey).setOrigin(0).setTileScale(2,2);
    this.add.rectangle(0,360,W,3,0x0a0710).setOrigin(0);
    const _hb=this.add.graphics().setDepth(59); _hb.fillStyle(UI.bg2,0.8); _hb.fillRoundedRect(8,8,W-16,62,10); _hb.lineStyle(1.5,UI.lineN,0.6); _hb.strokeRoundedRect(8,8,W-16,62,10);
    const TORCH=[[0xffb347,0xffe08a],[0x9be0a0,0xe6ffe0],[0x6fd0e0,0xbff0f5],[0xc46bff,0xe8b0ff],
      [0xffd27a,0xfff0c0],[0x5fe0d0,0xc0fff5],[0xa8da4e,0xe6ffb0],[0x9be0a0,0xd0b0ff]][di]||[0xffb347,0xffe08a];   // v2.2：4-7 為第二世界光暈
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
    this.targetBtn = button(this, W-176, 50, 100, 26, this._targetTopLabel(), ()=>this.openTargetOrder(), {size:12,fill:0x335b48,stroke:0x5ad08c,hover:0x46996a});
    this.targetBtn.setDepth(60);
    this.sipBtn = button(this, W-64, 50, 100, 26, '💧 喝水 '+autoSipLabel(), ()=>{ cycleAutoSip(); this.sipBtn.label.setText('💧 喝水 '+autoSipLabel()); }, {size:11,fill:0x2f5a6b,stroke:0x5ab0d0,hover:0x40788c});
    this.sipBtn.setDepth(60);
    if(this.input&&this.input.keyboard){ this.input.keyboard.on('keydown-ESC',()=>this.togglePause()); this.input.keyboard.on('keydown-P',()=>this.togglePause()); }
    // v2.3：探險%／錢／藥水 同列靠左（接在進度條下方）
    this.goldText = txt(this, 104, 50, '💰 '+((RUN&&RUN.gold)||0), 12, '#ffe08a', 0, 0.5).setDepth(62);
    this.potText = txt(this, 170, 50, '🧪 藥水 ×'+this.healPotCount(), 12, '#9fe8a0', 0, 0.5).setDepth(62);
    this.cargoText = txt(this, 270, 50, this.cargoStockText(), 12, '#9fd0ff', 0, 0.5).setDepth(62);
    this.waveText = txt(this,W/2,40,'',12,UI.gold).setDepth(60);
    this.banner = txt(this,W/2,H/2,'',34,'#fff').setStroke('#000',6).setDepth(90);   // 90<浮窗96：選單開啟時不會被戰鬥橫幅蓋住
    if(!RUN.exped) initExpedition();
    this.beginStep();
  }
  buildPctBar(){
    const W=this.scale.width, x=18, y=16, w=W-250, h=12; this._pctBox={x,y,w,h};
    const g=this.add.graphics().setDepth(60); g.fillStyle(UI.inkN,0.9); g.fillRoundedRect(x,y,w,h,6); g.lineStyle(1.5,UI.lineN,0.7); g.strokeRoundedRect(x,y,w,h,6);
    this._pctFill=this.add.graphics().setDepth(61);
    this._pctText=txt(this,18,50,'探險 0%',12,UI.gold,0,0.5).setDepth(62);
  }
  updatePctBar(){
    if(!this._pctFill||!RUN.exped) return; const {x,y,w,h}=this._pctBox, p=Math.max(0,Math.min(1,(RUN.exped.pct||0)/100));
    this._pctFill.clear(); if(p>0){ this._pctFill.fillStyle(p>=0.99?UI.redN:UI.goldN,1); this._pctFill.fillRoundedRect(x,y,Math.max(h,w*p),h,6); }
    this._pctText.setText('探險 '+(RUN.exped.pct||0)+'%');   // v2.3：移除「守衛者現身！」提示
  }
  updateGold(){ if(this.goldText) this.goldText.setText('💰 '+((RUN&&RUN.gold)||0)); }
  healPotCount(){ const HP={'治療藥水':1,'聖水':1,'回復卷軸':1}; return (RUN&&RUN.cargo)? RUN.cargo.filter(it=>it.kind==='道具'&&HP[it.name]).length : 0; }
  cargoStockText(){ const n=(RUN&&RUN.cargo)?RUN.cargo.length:0, cap=(RUN&&RUN.slots)||0; return '📦 '+n+'/'+cap; }
  updateCargo(){ if(this.cargoText) this.cargoText.setText(this.cargoStockText()); }
  updatePotions(){ if(this.potText) this.potText.setText('🧪 藥水 ×'+this.healPotCount()); this.updateCargo(); }
  refreshHud(){ (this.heroes||[]).forEach(c=>{ if(c&&c.ref){ c.hp=c.ref.hp; this.bar(c);} }); this.updateGold(); this.updatePotions(); this.updateCargo(); }
  // 換裝後即時把新裝備數值套到場上戰鬥單位（不重置冷卻/站位）
  restatHeroes(){ (this.heroes||[]).forEach(c=>{ if(!c||!c.ref) return; const s=heroStat(c.ref); c.maxHp=s.maxHp; c.atkSeq=s.atkSeq.map(a=>Math.max(1,a+(this._heroAtkMod||0))); c.def=s.def+(this._heroDefMod||0); c.heal=s.heal; c.weaponTrait=s.weaponTrait; c.armorTrait=s.armorTrait; c.hp=Math.max(0,Math.min(c.maxHp,c.ref.hp)); this.bar(c); this.setCardGear(c); }); }   // 換裝後即時重畫卡片裝備圖示
  // 開始一場遭遇：戰鬥→生成敵人；非戰鬥→秀互動浮窗。英雄每場由 RUN.heroes 重建（HP 延續）。
  beginStep(){
    this.over=false; this.entering=false; this.waveClearing=false; this.waveIndex=0; this.hitstopUntil=0; this._advancing=false;
    if(this.overlay){ this.overlay.destroy(); this.overlay=null; }
    if(this.encIntro){ this.encIntro.destroy(); this.encIntro=null; } if(this.encCap){ this.encCap.destroy(); this.encCap=null; }
    const _re=relicEffects();
    this._title=titleEffects();   // v2.0 裝備中稱號效果（spawnStun/dmgVs 由戰鬥讀取）
    this._firstHitCrit=!!_re.firstHitCrit; this._reviveOnce=!!_re.reviveOnce; this.reviveUsed=false; this._firstHitBlock=!!_re.firstHitBlock;
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
    const _gb=(RUN&&RUN.heroes)?RUN.heroes.map(h=>({w:(h.weapon&&h.weapon.name)||'',a:(h.armor&&h.armor.name)||''})):[];   // 換裝偵測：autoEquip 前快照
    autoEquipRun();   // 自動裝備：入手新裝／升級後，每場開始前換上最佳裝備
    this._pendingGearGains=[];
    { ((RUN&&RUN.heroes)||[]).forEach((h,i)=>{ if(!_gb[i]) return; const gains=[];
        const wn=(h.weapon&&h.weapon.name)||'', an=(h.armor&&h.armor.name)||'';
        if(_gb[i].w && wn && wn!==_gb[i].w) gains.push('裝備'+wn);
        if(_gb[i].a && an && an!==_gb[i].a) gains.push('裝備'+an);
        if(gains.length) this._pendingGearGains.push({idx:h.idx, gains}); }); }   // 換裝訊息改推到角色卡下方
    activeRoster().forEach(idx=>syncPlannedSkills(idx));   // 大改版：依最新配置表＋目前等級重建技能（修正：配置常在 initRun 之後才改）
    if(!this.heroes || !this.heroes.length) this.buildHeroes(); else this.refreshHeroes();
    if(this._pendingGearGains&&this._pendingGearGains.length) this.showCardGearGains(this._pendingGearGains);
    this._pendingGearGains=null;
    this.enemies=[]; this.summons=[]; this.all=[...this.heroes];
    this.updatePctBar(); this.updateGold(); this.updatePotions(); this.updateCargo();
    if(combat){ this.waves=(stype==='boss')?buildBoss():buildEncounter(node); this.totalWaves=this.waves.length; this.spawnWave(); if(RUN){ RUN.cookShield=0; RUN.cookFirstCrit=false; } }
    else { this.over=true; this.playEncounterIntro(stype, ()=>this.openEncounter(stype)); }
  }
  buildHeroes(){
    this.heroes=RUN.heroes.map((h)=>{ const s=heroStat(h), fs=formationSlot(h.sprite);
      const atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)), def=s.def+this._heroDefMod;
      const pk=heroPerks(h.idx);
      const interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1)));
      const useBonus=(pk.useBonus||0);
      const startShield=(this._startShield||0)+(pk.startShield||0)+(s.armorShield||0)+((RUN&&RUN.cookShield)||0)+(s.skills||[]).reduce((a,sk)=>a+(sk.type==='startShield'?(sk.amt||0):0),0);   // 大改版・熊皮護盾
      const c=this.makeCombatant({sprite:h.sprite,name:`${h.name} Lv${s.level}`,maxHp:s.maxHp,hp:Math.max(0,h.hp),atkSeq,def,heal:s.heal,interval,ranged:h.ranged,healer:h.healer,aoe:h.aoe,skills:s.skills,row:fs.row,ref:h, weaponTrait:s.weaponTrait, armorTrait:s.armorTrait, useBonus}, 'hero', fs.x, fs.y);
      c.maxShield=startShield; c.shield=startShield; this.bar(c); return c;   // 每場開場：護盾補滿（與 HP 分開）
    });
    this.heroes.forEach(c=>{ if(c.hp<=0){ c.alive=false; c.container.setAlpha(0.25); c.spr.setTint(0x555555);} });
    this.buildPartyHud();
  }
  refreshHeroes(){
    this.heroes.forEach(c=>{ const h=c.ref, s=heroStat(h), fs=formationSlot(h.sprite), pk=heroPerks(h.idx);
      c.maxHp=s.maxHp; c.atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)); c.def=s.def+this._heroDefMod; c.heal=s.heal;
      c.interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1))); c.useBonus=(pk.useBonus||0);
      c.skills=s.skills; c.weaponTrait=s.weaponTrait; c.armorTrait=s.armorTrait; c.aoe=h.aoe; c.ranged=h.ranged; c.healer=h.healer;
      c.hp=Math.max(0,h.hp); c.alive=c.hp>0;
      const _ss=(this._startShield||0)+(pk.startShield||0)+(s.armorShield||0)+((RUN&&RUN.cookShield)||0)+(s.skills||[]).reduce((a,sk)=>a+(sk.type==='startShield'?(sk.amt||0):0),0);   // 大改版・熊皮護盾
      c.maxShield=_ss; c.shield=_ss;   // 每場開場：護盾補滿（與 HP 分開）
      c.atkI=0; c.firstHitDone=false; c.firstStrikeDone=false; c.killCrit=false; c.markCrit=false; c.deathSaveUsed=false; c.firstBlockUsed=false; c._proc=null;
      c.form=null; c.formUntil=0; c.formAtk=0; c.formPierce=0; c.formDef=0; c.formReduce=0; c.atkBuffUntil=0; c.tauntUntil=0; c.berserkUntil=0; c.buffUntil=0; c.buffAtk=0; c.buffDef=0; c.baseScale=SCALE; if(c.spr){ c.spr.setTexture(c.sprite); c.spr.setScale(SCALE); }   // 大改版：每場重置變身/buff/吸引/狂暴/體型
      c.stunned=false; c.stunUntil=0; c.invulnUntil=0; c.lastAttack=-Math.random()*800;
      if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
      if(c.stunLabel){ c.stunLabel.destroy(); c.stunLabel=null; }
      c.skillCD={}; (c.skills||[]).forEach(sk=>{ if(sk.cd!==undefined) c.skillCD[sk.name]={last:-1e9,left:sk.uses+(c.useBonus||0)}; });
      c.baseX=fs.x; c.baseY=fs.y; c.row=fs.row; c.container.setPosition(fs.x,fs.y).setDepth(fs.y/200).setAngle(0).setAlpha(c.alive?1:0.25);
      c.spr.clearTint(); if(!c.alive) c.spr.setTint(0x555555);
      c.name=`${h.name} Lv${s.level}`; if(c.nameText) c.nameText.setText(c.name);   // v2.3：同步更新 c.name，讓上方卡片等級跟著升級
      this.bar(c);
    });
    this.buildPartyHud();
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
    // v2.1 稱號・開場震懾：對每隻敵人取「所有生效稱號中最高的震懾秒數」施加開場暈眩
    // 首波在 create() 內觸發，this.time.now 尚未就緒(=0) → 延後一拍以有效時鐘計算 stunUntil（敵人此時仍在走位進場，視覺無差）。
    const _te=this._title;
    if(_te && _te.spawnStuns && _te.spawnStuns.length){ this.time.delayedCall(60, ()=>{ if(this.over) return;
      fresh.forEach(en=>{ if(!en||!en.alive) return; const d=titleSpawnStunFor(en.sprite,_te); if(d>0) this.stun(en,{name:'震懾',dur:d},null); }); }); }
    // 馬匹・均衡馬（先攻）：第一波敵人慢半拍出手，給我方一個開場
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
    const obj={...d,side,container:cont,spr,barFill,shieldFill,nameText,alive:true,facing,baseX:x,baseY:y,lastAttack:-Math.random()*800,atkI:0,shield:0,maxShield:0,baseScale:(scl||SCALE)};
    obj.skillCD={};
    (obj.skills||[]).forEach(s=>{ if(s.cd!==undefined) obj.skillCD[s.name]={last:-1e9,left:s.uses+(d.useBonus||0)}; });
    // v2.3：技能格不再畫在頭頂；由 buildPartyHud() 統一畫進上方隊員卡片
    spr.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.showInfo(obj));
    return obj;
  }
  // v2.3：上方隊員狀態卡片列（職業名＋HP條/數值＋技能格）。技能格由角色頭頂移到此處。
  buildPartyHud(){
    if(this.partyHud){ this.partyHud.destroy(); this.partyHud=null; }
    const heroes=this.heroes||[]; const n=heroes.length; if(!n) return;
    const hud=this.add.container(0,0).setDepth(60); this.partyHud=hud;
    const cardW=170, cardH=52, gap=6, cardY=72;
    const totalW=n*cardW+(n-1)*gap, startX=Math.round((this.scale.width-totalW)/2);
    heroes.forEach((c,i)=>{
      const left=startX+i*(cardW+gap);
      const card=this.add.container(left,cardY); hud.add(card);
      const acc=accent(c.healer?'green':(c.ranged?'blue':'gold'));
      const g=this.add.graphics();
      g.fillStyle(0x000000,0.34); g.fillRoundedRect(2,4,cardW,cardH,9);
      g.fillStyle(UI.panelN,0.96); g.fillRoundedRect(0,0,cardW,cardH,9);
      g.fillStyle(UI.panelHiN,0.5); g.fillRoundedRect(0,0,cardW,Math.round(cardH*0.42),9);
      g.lineStyle(1.5, acc.num, 0.85); g.strokeRoundedRect(0,0,cardW,cardH,9);
      g.fillStyle(acc.num,0.9); g.fillRoundedRect(0,0,4,cardH,{tl:9,bl:9,tr:0,br:0});
      card.add(g);
      card.add(txt(this,11,8,c.name,11,acc.hex,0,0));
      const hpText=txt(this,cardW-9,8,'',10,'#9fd0a0',1,0); card.add(hpText);
      const hbW=cardW-19;
      card.add(this.add.rectangle(9,27,hbW,7,0x000000,0.6).setOrigin(0,0.5));
      const hpFill=this.add.rectangle(9,27,hbW,5,0x5ad06a).setOrigin(0,0.5); card.add(hpFill);
      const shFill=this.add.rectangle(9,27,0,5,0x6fd6ff).setOrigin(0,0.5).setVisible(false); card.add(shFill);
      c.card={cont:card, left, top:cardY, cx:left+cardW/2, w:cardW, h:cardH, hpFill, hpBarW:hbW, shFill, hpText, pipY:42, dpsZone:50};
      this.setCardGear(c);   // 名稱與 HP 中間：當前裝備武器/防具的像素圖示（換裝會即時重畫）
      // DPS（每秒平均傷害）：技能格左側挪出一塊，caption + 數字
      card.add(txt(this,11,37,'DPS',8,'#8a7f9a',0,0.5));
      const dpsText=txt(this,11,47,'0',12,'#ffd27a',0,0.5); card.add(dpsText); c.card.dpsText=dpsText;
      this.buildSkillPips(c);
      this.bar(c);
    });
  }
  showCardGearGains(list){ if(!list||!list.length||!this.heroes) return;
    const byIdx={}; list.forEach(it=>{ if(it&&it.gains&&it.gains.length) byIdx[it.idx]=it.gains; });
    this.heroes.forEach((c)=>{
      const gains=byIdx[c.ref&&c.ref.idx]; if(!gains||!c.card||!c.card.cont) return;
      if(c.card.gearGain){ c.card.gearGain.destroy(); c.card.gearGain=null; }
      const label=gains.slice(0,2).join('\n');
      const cont=this.add.container(c.card.w/2,c.card.h+2).setAlpha(0);
      const t=txt(this,0,0,label,13,UI.text,0.5,0.5).setStroke('#000',3);
      t.setAlign('center'); if(t.setLineSpacing) t.setLineSpacing(2);
      const fit=Math.min(1,(c.card.w-22)/Math.max(1,t.width)); t.setScale(fit);
      cont.add(t); c.card.cont.add(cont); c.card.gearGain=cont;
      this.tweens.add({targets:cont, y:c.card.h+15, alpha:1, duration:240, ease:'Back.out'});
      this.tweens.add({targets:cont, y:c.card.h+2, alpha:0, delay:2200, duration:520, ease:'Quad.in',
        onComplete:()=>{ if(c.card&&c.card.gearGain===cont) c.card.gearGain=null; cont.destroy(); }});
    });
  }
  // 卡片中段：武器/防具像素圖示。讀 c.ref（RUN.heroes）的當前裝備，換裝即時重畫
  setCardGear(c){ if(!c.card||!c.card.cont) return;
    if(c.card.wIcon){ c.card.wIcon.destroy(); c.card.wIcon=null; }
    if(c.card.aIcon){ c.card.aIcon.destroy(); c.card.aIcon=null; }
    const wo=(c.ref&&c.ref.weapon)||null, ao=(c.ref&&c.ref.armor)||null;
    const wn=(wo&&wo.name)||'', an=(ao&&ao.name)||'';
    // 與「上次畫的裝備」比對（存在持久的 c.ref，跨場有效）→ 換裝就閃一下
    const changed=(c.ref && c.ref._cardW!==undefined && (c.ref._cardW!==wn || c.ref._cardA!==an));
    if(c.ref){ c.ref._cardW=wn; c.ref._cardA=an; }
    c.card.wName=wn; c.card.aName=an;   // 供 updateSkillPips 偵測換裝
    c.card.wIcon=icon(this,76,14,weaponIconKey(wn),13,gearTierColor(wo)); c.card.cont.add(c.card.wIcon);   // 顏色＝稀有度，同類型升級也看得出
    c.card.aIcon=icon(this,92,14,armorIconKey(an),13,gearTierColor(ao)); c.card.cont.add(c.card.aIcon);
    if(changed){ this.tweens.add({targets:[c.card.wIcon,c.card.aIcon], scaleX:1.7, scaleY:1.7, yoyo:true, duration:200, ease:'Quad.out'}); } }   // 換裝瞬間放大脈動，醒目
  // 技能格：畫進該員的上方卡片（亮=可用、暗=冷卻/用盡）。資料結構同舊版，只是位置改到卡片。
  buildSkillPips(c){
    const sk=(c.skills||[]).filter(s=>s.cd!==undefined); c.skillPips=null; if(!c.card || !sk.length) return;   // 角色卡技能格只顯示主動技能（有 CD），被動不顯示
    c.skillPips={};
    const ps=16, gap=4, total=sk.length*ps+(sk.length-1)*gap;
    const dz=c.card.dpsZone||50;   // 左側 DPS 區，技能格置中於剩餘空間
    const cont=this.add.container(dz + (c.card.w-dz)/2 - total/2 + ps/2, c.card.pipY); c.card.cont.add(cont);
    let cx=0;
    sk.forEach(s=>{ const sv=skillVisual(s), ac=accent(sv.accent), active=s.cd!==undefined;
      const pc=this.add.container(cx,0); const g=this.add.graphics();
      g.fillStyle(0x07060f,0.9); g.fillRoundedRect(-ps/2,-ps/2,ps,ps,5);
      g.lineStyle(1.5, ac.num, 0.95); g.strokeRoundedRect(-ps/2,-ps/2,ps,ps,5);
      pc.add([g, icon(this,0,0,sv.icon,ps*0.64,ac.num)]); cont.add(pc);
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
    // 每 ~250ms：刷新 DPS ＋ 偵測換裝（名稱變了就重畫裝備圖示，免於任何時序漏更新）
    if(now-(this._dpsTick||0) > 250){ this._dpsTick=now; const sec=((RUN&&RUN.combatMs)||0)/1000;
      this.heroes.forEach(c=>{ if(!c.card) return;
        if(c.card.dpsText){ const d=(c.ref&&c.ref.dmgDealt)||0; c.card.dpsText.setText(sec>0.2 ? ''+Math.round(d/sec) : '0'); }
        const wn=(c.ref&&c.ref.weapon&&c.ref.weapon.name)||'', an=(c.ref&&c.ref.armor&&c.ref.armor.name)||'';
        if(c.card.wName!==wn || c.card.aName!==an) this.setCardGear(c);
      }); }
    this.heroes.forEach(c=>{
      if(c.card&&c.card.cont) c.card.cont.setAlpha(c.alive?1:0.5);   // v2.3：陣亡淡化整張卡片
      if(!c.skillPips) return;
      for(const name in c.skillPips){ const p=c.skillPips[name]; let alpha=1;
        if(!c.alive) alpha=0.18;
        else if(p.active){ const st=c.skillCD[name]; if(st){ alpha = st.left<=0 ? 0.32 : (now-st.last < p.skill.cd/this.speed ? 0.5 : 1); } }
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
    if(c.side==='hero' && c.ref){ const lv=(ROSTER[c.ref.idx]&&ROSTER[c.ref.idx].level)||1; const pk=[]; Object.keys(PERKS).forEach(k=>{ if(lv>=+k) pk.push((PERKS[k].label||'').split('：')[0]); });
      ui.add(txt(this,px+20,py+42,'能力：'+(pk.length?pk.join('・'):'尚無（Lv3 疾行・Lv5 護身・Lv7 熟練）'),11,'#9fe0ff',0)); }
    ui.add(txt(this,px,py+66,BIO[c.sprite]||'',12,TH.cyan,0.5));
    ui.add(button(this,px,py+98,120,32,'關閉',()=>{ ui.destroy(); this.infoUI=null; this.paused=false; },{size:14,fill:0x4a3f63,stroke:0x7a6f93}));
  }
  // v2.0 震懾狀態文字：每幀更新剩餘秒數並跟隨單位位置（star 之上）
  updateStunLabels(){
    const now=this.time.now;
    for(const c of (this.all||[])){
      if(!c||!c.stunLabel) continue;
      const rem=Math.max(0,((c.stunUntil||0)-now)/1000*(c.stunSpeed||1));   // stunUntil 已依倍率縮短 → 乘回倍率顯示「遊戲秒數」
      c.stunLabel.setText((c.stunName||'暈眩')+' '+rem.toFixed(1)+'s');
      if(c.container) c.stunLabel.setPosition(c.container.x, c.baseY-80);
    }
  }
  update(time, delta){
    this.updateSkillPips();
    this.updateStunLabels();
    this.tickCampIdle(delta);   // 營火閒置倒數（營火時 over=true，需在提前 return 之前處理）
    if(this.over||this.paused) return;
    if(this.entering) return;              // 敵人走位進場中，雙方都先不出手
    if(this.time.now < this.hitstopUntil) return;   // 命中停頓（用場景時鐘，與速度一致）
    // DPS 分母：累計「實際交戰中」的遊戲秒數（×speed → 與戰鬥倍率無關）。只在尚有敵人存活時計時
    if(RUN && this.enemies && this.aliveOf('enemy').length){ RUN.combatMs=(RUN.combatMs||0)+(delta||16)*this.speed; }
    this.autoSip();
    for(const c of this.all){ if(!c.alive) continue; if(this.time.now < (c.stunUntil||0)) continue;
      if(time>c.lastAttack+c.interval/this.speed){ c.lastAttack=time; this.act(c); } }
  }
  // 戰鬥中自動喝水：最低血隊員 < 門檻時自動喝「最弱的補血藥水」（保留強藥），整隊回復；有冷卻避免狂喝
  autoSip(){
    const frac=autoSipFrac(); if(frac<=0) return;
    const alive=this.aliveOf('hero'); if(!alive.length) return;
    const cd=(CFG.autoSip&&CFG.autoSip.cooldownMs)||2500;
    // 每名隊員各自的喝水冷卻：挑「低於門檻、且自己冷卻已過」的最虛弱者，一瓶只補他一人
    let target=null,lowest=9;
    alive.forEach(c=>{ const fr=c.hp/c.maxHp; if(fr<frac && this.time.now>=(c._sipUntil||0) && fr<lowest){ lowest=fr; target=c; } });
    if(!target) return;
    const HEAL={'治療藥水':0.3,'聖水':0.5,'回復卷軸':0.6};
    let best=null,bp=9;
    RUN.cargo.forEach(it=>{ if(it.kind==='道具' && HEAL[it.name]!=null && HEAL[it.name]<bp){ best=it; bp=HEAL[it.name]; } });
    if(!best) return;
    const pct=HEAL[best.name], idx=RUN.cargo.indexOf(best); if(idx>=0) RUN.cargo.splice(idx,1); discover(best.name); logItem('use', best, '自動喝水');
    const h=Math.round(target.maxHp*pct); target.hp=Math.min(target.maxHp,target.hp+h); if(target.ref)target.ref.hp=target.hp; this.bar(target);
    pixelNum(this,target.container.x,target.container.y-34,'+'+h,0x7dff9a);
    this.floatLabel(target.baseX,target.baseY-58,'喝下 '+(best.icon||'🧪')+best.name,'#9fe8a0');
    this.updatePotions();
    target._sipUntil=this.time.now+cd/this.speed;   // v2.2：依倍率縮放
  }
  aliveOf(side){ return this.all.filter(c=>c.alive&&c.side===side&&!c.isSummon); }   // 召喚精靈不算「存活成員」：不被鎖定、不影響勝負判定
  // 防溢殺：估算「即將落在某敵人身上、尚未結算」的我方傷害（排除自己）
  _incoming(f, exclude){ let s=0; const now=this.time.now;
    for(const h of (this.heroes||[])){ if(!h.alive||h===exclude) continue;
      if(h._aimTarget===f && now < (h._aimUntil||0)) s+=(h._estDmg||0); }
    return s; }
  _estDamage(c, f){ const seq=(c.atkSeq&&c.atkSeq.length)?c.atkSeq:[1]; const avg=seq.reduce((a,b)=>a+b,0)/seq.length;
    let tdef=f.def||0;
    return Math.max(1, Math.round(avg - tdef)); }
  // 我方鎖定：依玩家排定的 TARGET_ORDER 做字典序挑目標（由上到下逐條比較，先決定者勝）
  pickTarget(c,foes){ if(!foes||!foes.length) return null;
    let order=(typeof TARGET_ORDER!=='undefined'&&TARGET_ORDER&&TARGET_ORDER.length)?TARGET_ORDER:['lowHp','healer','back','front','lowDef','status'];
    // 智慧鎖定：帶條件暴擊的角色，自動把「能觸發暴擊的目標」排到最前（只對該角色、覆蓋全隊順序）
    const smart=[];
    if(this.hasSkillType(c,'critVsFull')) smart.push('fullHp');      // 鷹眼：偏好滿血敵
    if(this.hasSkillType(c,'critVsStunned')) smart.push('status');   // 致命：偏好被暈敵
    order=smart.concat(['overkill'], order);   // 智慧鎖定 > 防溢殺 > 玩家順序
    const rank={front:0,mid:1,back:2};
    const key=(f,crit)=>{ switch(crit){
      case 'lowHp':  return f.hp;                          // 目前血量最低（低血優先）
      case 'lowDef':    return f.def||0;                   // 防禦最低（對其輸出最高）
      case 'status':    return f.stunned?0:1;              // 有狀態(暈眩)者優先
      case 'fullHp':    return (f.hp>=f.maxHp)?0:1;        // 滿血優先（鷹眼智慧鎖定）
      case 'overkill':  return (f.hp - this._incoming(f,c) > 0) ? 0 : 1;   // 已被預定打死者排後（防溢殺）
      case 'healer': return f.healer?0:1;          // 敵方治療者優先
      case 'back':   return 2-(rank[f.row]||1);    // 後排優先（back→0 最佳）
      case 'front':  return (rank[f.row]||1);      // 前排優先（front→0 最佳）
      default: return 0; } };
    let best=foes[0];
    for(let i=1;i<foes.length;i++){ const f=foes[i];
      for(const crit of order){ const a=key(f,crit), b=key(best,crit); if(a<b){ best=f; break; } if(a>b) break; } }
    return best; }
  pickByRow(foes){ const _now=this.time.now; const tt=foes.filter(f=>f.tauntUntil&&_now<f.tauntUntil); if(tt.length) foes=tt;   // 大改版・挑釁/熊人變身：強制吸引火力
    const w=foes.map(f=>ROW_WEIGHT[f.row]||1.5); let total=w.reduce((a,b)=>a+b,0), r=Math.random()*total;
    for(let i=0;i<foes.length;i++){ r-=w[i]; if(r<=0) return foes[i]; } return foes[foes.length-1]; }
  getSkill(c,type){ return (c.skills||[]).find(s=>s.type===type); }
  hasSkillType(c,type){ return (c.skills||[]).some(s=>s.type===type); }
  cutPriestCd(){ this.heroes.forEach(h=>{ if(h.sprite==='priest'&&h.alive){ for(const k in h.skillCD){ h.skillCD[k].last-=1500; } } }); }   // 羈絆・神諭指引
  trySkill(c,type){
    const s=(c.skills||[]).find(k=>k.type===type); if(!s || s.cd===undefined) return null;
    const st=c.skillCD[s.name]; if(!st || st.left<=0) return null;
    if(this.time.now - st.last < s.cd/this.speed) return null;   // v2.2：技能 CD 依倍率縮放
    st.last=this.time.now; st.left--; this.skillCast(c,s); return s;
  }
  // 大改版：每次行動嘗試觸發主動大招/小招（變身/戰吼/挑釁/大吼），各自 CD＋次數
  tryActiveBuffs(c){
    const now=this.time.now;
    const tf=this.trySkill(c,'transform'); if(tf) this.doTransform(c,tf);
    const ab=this.trySkill(c,'atkBuff'); if(ab){ c.atkBuffUntil=now+(ab.dur||4000)/this.speed; c.atkBuffAmt=(ab.amt||8); this.floatLabel(c.baseX,c.baseY-58,'戰吼!','#ffd24a'); }
    const tt=this.trySkill(c,'taunt'); if(tt){ c.tauntUntil=now+(tt.dur||2500)/this.speed; this.floatLabel(c.baseX,c.baseY-58,'挑釁!','#ffb347'); }
    const sa=this.trySkill(c,'stunAll'); if(sa){ this.aliveOf(c.side==='hero'?'enemy':'hero').forEach(f=>{ if(f.alive) this.stun(f,sa,c); }); this.floatLabel(c.baseX,c.baseY-58,(sa.name||'大吼')+'!','#ffd24a'); if(c.sprite==='mage') this.castBurst(c,0xc46bff); }
    const sm=this.trySkill(c,'summon'); if(sm) this.doSummon(c,sm);   // 召喚實體精靈（場上單位）
    const tb=this.trySkill(c,'teamBuff'); if(tb){ const amt=(tb.amt||6)+(tb.plus||0)*3, until=now+(tb.dur||6000)/this.speed;   // 阿加托斯：全隊強化
      this.aliveOf('hero').forEach(h=>{ h.buffAtk=amt; h.buffDef=amt; h.buffUntil=until; this.holyLight(h,0xffe27a); });
      this.floatLabel(c.baseX,c.baseY-58,'聖光庇佑!','#ffe27a'); this.screenFlash(0xffe27a,0.18,300); }
    const db=this.trySkill(c,'debuffAll'); if(db){ const amt=(db.amt||6)+(db.plus||0)*3, until=now+(db.dur||6000)/this.speed;   // 卡科斯：全敵弱化
      this.aliveOf('enemy').forEach(e=>{ e.buffAtk=-amt; e.buffDef=-amt; e.buffUntil=until; this.holyLight(e,0x9a5fd0); });
      this.floatLabel(c.baseX,c.baseY-58,'惡靈詛咒!','#c46bff'); this.screenFlash(0x9a5fd0,0.18,300); }
    const bz=this.trySkill(c,'berserk'); if(bz){ const d=(bz.dur||6000)+(bz.plus||0)*1500; c.berserkUntil=now+d/this.speed;   // 盜賊狂暴化：每擊連擊2段＋染紅，升級延長
      if(c.spr) c.spr.setTint(0xff5050); this.floatLabel(c.baseX,c.baseY-58,'狂暴化!','#ff5a4a'); this.screenFlash(0xff5050,0.2,300);
      this.time.delayedCall(d, ()=>{ c.berserkUntil=0; if(c.alive&&c.spr&&!c.stunned) c.spr.clearTint(); }); }
  }
  // 聖光/暗光特效：升起光柱＋光圈＋上飄粒子
  holyLight(t,colNum){
    const x=t.container?t.container.x:t.baseX, y=t.baseY;
    const ring=this.add.circle(x,y+8,10,colNum,0.5).setDepth(70); this.tweens.add({targets:ring,radius:34,alpha:0,duration:520,onComplete:()=>ring.destroy()});
    const pillar=this.add.rectangle(x,y-6,24,72,colNum,0.30).setDepth(69); this.tweens.add({targets:pillar,alpha:0,scaleY:1.4,duration:540,ease:'Quad.out',onComplete:()=>pillar.destroy()});
    for(let i=0;i<5;i++){ const px=x+(Math.random()-0.5)*28; const p=this.add.rectangle(px,y+12,3,3,colNum).setDepth(71);
      this.tweens.add({targets:p,y:y-40-Math.random()*22,alpha:0,duration:520+Math.random()*200,ease:'Quad.out',onComplete:()=>p.destroy()}); }
  }
  // 大招施放爆發特效：擴張環＋閃光＋粒子（法師等用）
  castBurst(c,colNum){
    const x=c.container?c.container.x:c.baseX, y=c.baseY;
    const ring=this.add.circle(x,y,16,colNum,0.45).setDepth(72); this.tweens.add({targets:ring,radius:120,alpha:0,duration:420,ease:'Quad.out',onComplete:()=>ring.destroy()});
    const ring2=this.add.circle(x,y,10,0xffffff,0.6).setDepth(72); this.tweens.add({targets:ring2,radius:70,alpha:0,duration:360,ease:'Quad.out',onComplete:()=>ring2.destroy()});
    this.screenFlash(colNum,0.22,260); this.shake(180,0.01);
    for(let i=0;i<8;i++){ const a=Math.random()*Math.PI*2,d=30+Math.random()*40; const p=this.add.rectangle(x,y,4,4,colNum).setDepth(73);
      this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:380+Math.random()*200,ease:'Quad.out',onComplete:()=>p.destroy()}); }
  }
  // 召喚精靈：用 makeCombatant 生一個我方單位，加入 this.all（自動進攻擊迴圈）＋ this.summons，計時消失
  doSummon(c,sk){
    if(!this.summons) this.summons=[];
    const sx=c.baseX+38, sy=c.baseY-18, plus=sk.plus||0, scl=3+plus*0.7;   // 精靈隨升級變大（+0.7/級）
    const atk=(sk.atkSeq||[16,20]).map(a=>a+plus*5);   // 精靈隨升級增傷（+5/級）
    const sp=this.makeCombatant({sprite:sk.form, name:sk.name, maxHp:30, hp:30, atkSeq:atk, def:0, heal:0, interval:(sk.interval||1100), ranged:true, healer:false, aoe:!!sk.aoe, isSummon:true}, 'hero', sx, sy, scl);
    sp.ownerRef=c.ref;   // 召喚精靈的傷害計入召喚者的 DPS
    sp.container.setAlpha(0).setScale(0.4);
    this.tweens.add({targets:sp.container, alpha:1, scaleX:1, scaleY:1, duration:240, ease:'Back.out'});
    this.summons.push(sp); this.all.push(sp);
    this.screenFlash(0xffd24a,0.14,200);
    const dur=sk.dur||8000;
    sp._dieTimer=this.time.delayedCall(dur, ()=>this.removeSummon(sp));
  }
  removeSummon(sp){ if(!sp || sp._removed) return; sp._removed=true; sp.alive=false;
    const i=this.all?this.all.indexOf(sp):-1; if(i>=0) this.all.splice(i,1);
    const j=this.summons?this.summons.indexOf(sp):-1; if(j>=0) this.summons.splice(j,1);
    if(sp.container){ this.tweens.add({targets:sp.container, alpha:0, scaleX:0.4, scaleY:0.4, duration:280, ease:'Quad.in', onComplete:()=>{ if(sp.container) sp.container.destroy(); }}); }
  }
  // 變身（大招）：換 sprite＋型態增益，計時還原
  doTransform(c,sk){
    const now=this.time.now; c.form=sk.form; c.formUntil=now+(sk.dur||6000)/this.speed;
    c.formToken=(c.formToken||0)+1; const tok=c.formToken;   // 每次變身一個 token：還原計時器只還原自己這次
    if(sk.form==='minotaur'){ c.formAtk=(sk.amt||12); c.formPierce=(sk.frac||0.5); c.formDef=0; c.formReduce=0; }
    else { c.formDef=(sk.amt||8); c.formReduce=(sk.frac||0.25); c.formAtk=0; c.formPierce=0; c.tauntUntil=c.formUntil; }   // 熊人：防禦＋嘲諷
    const big=(SCALE*1.3)+(sk.plus||0)*0.8; c._preScale=c.baseScale; c.baseScale=big;   // 變身放大，隨升級更大（+0.8/級）
    if(c.spr && this.textures.exists(sk.form)){ c.spr.setTexture(sk.form); c.spr.setScale(big); }
    this.screenFlash(0xffb347,0.2,260); this.shake(160,0.01);
    this.time.delayedCall(sk.dur||6000,()=>{ if(!c.form || c.formToken!==tok) return;   // 只還原自己這次的變身（避免上一場殘留計時器提前還原）
      c.form=null; c.formUntil=0; c.formAtk=0; c.formPierce=0; c.formDef=0; c.formReduce=0; c.baseScale=c._preScale||SCALE;
      if(c.alive && c.spr){ c.spr.setTexture(c.sprite); c.spr.setScale(c.baseScale); this.skillProc(c, '變回戰士'); } });
  }
  // 變身瞬間的狀態徽章：頭頂彈出（放大→定住→停留→上浮淡出），比一般浮字更醒目
  formBadge(c,label,colNum){
    const cont=this.add.container(c.container.x, c.baseY-78).setDepth(88);
    const t=txt(this,0,0,label,16,'#ffffff').setStroke('#000',3); const w=Math.max(60, t.width+24);
    const g=this.add.graphics(); g.fillStyle(0x07060f,0.95); g.fillRoundedRect(-w/2,-16,w,32,10);
    g.lineStyle(3,colNum,1); g.strokeRoundedRect(-w/2,-16,w,32,10);
    g.fillStyle(colNum,0.18); g.fillRoundedRect(-w/2,-16,w,32,10);
    cont.add([g,t]); cont.setScale(0.3);
    this.tweens.add({targets:cont, scale:1.2, duration:200, ease:'Back.out'});
    this.tweens.add({targets:cont, scale:1, duration:160, delay:200, ease:'Quad.out'});
    this.tweens.add({targets:cont, y:cont.y-26, alpha:0, duration:560, delay:1000, ease:'Quad.in', onComplete:()=>cont.destroy()});
  }
  act(c){
    if(c.isSummon){ const foes=this.aliveOf('enemy'); if(!foes.length) return;   // 召喚精靈：只攻擊，不做英雄專屬行為
      if(c.aoe){ this.aoeCast(c); } else { this.ranged(c, this.pickTarget(c,foes), false); } return; }
    // 遺物・殘缺護符（生機）：非治療成員每次行動回復少量 HP
    if(c.side==='hero' && this._regen>0 && !c.healer && c.alive && c.hp>0 && c.hp<c.maxHp){ const h=Math.max(1,Math.round(c.maxHp*this._regen)); c.hp=Math.min(c.maxHp,c.hp+h); this.bar(c); pixelNum(this,c.container.x,c.container.y-34,'+'+h,0x7dff9a); }
    if(c.side==='hero') this.tryActiveBuffs(c);   // 大改版：主動大招/buff（變身/戰吼/挑釁/大吼）自動觸發
    if(c.healer){ const al=this.aliveOf(c.side); const low=al.reduce((a,b)=>(b.hp/b.maxHp<a.hp/a.maxHp?b:a),al[0]);
      if(low&&low.hp/low.maxHp<CFG.battle.healThreshold){ this.heal(c,low); return; } }
    const foes=this.aliveOf(c.side==='hero'?'enemy':'hero'); if(!foes.length) return;
    // 遺物・星辰碎核（墜星）：我方本場第一次攻擊改為打全體
    if(c.side==='hero' && this._firstStrikeAoe && !c.firstStrikeDone){ c.firstStrikeDone=true; c.firstHitDone=true;
      this.floatLabel(c.baseX,c.baseY-58,'墜星!','#ffd24a'); this.screenFlash(0xffd24a,0.16,200);
      foes.forEach(f=>{ if(f.alive) this.damage(c,f,{aoeHit:true}); }); return; }
    if(c.aoe){ this.aoeCast(c); }
    else {
      const target = c.side==='enemy' ? this.pickByRow(foes) : this.pickTarget(c,foes);
      if(c.side==='hero' && target){ c._aimTarget=target; c._aimUntil=this.time.now+450/this.speed; c._estDmg=this._estDamage(c,target); }   // 防溢殺：登記這一擊的預定傷害
      if(c.ranged) this.ranged(c,target,c.healer); else this.melee(c,target);
    }
    // 連射／連環施法：追加一擊（CD＋次數）
    if(this.trySkill(c,'doubleHit')){
      this.time.delayedCall(300,()=>{ if(!c.alive||this.over) return; const fs=this.aliveOf(c.side==='hero'?'enemy':'hero');
        if(fs.length){ if(c.aoe){ this.aoeCast(c); } else { const t=(c.side==='enemy'?this.pickByRow(fs):this.pickTarget(c,fs)); c.ranged?this.ranged(c,t,false):this.melee(c,t);} } }); }
    if(c.berserkUntil && this.time.now<c.berserkUntil){   // 狂暴化：每次攻擊都追加一擊
      this.time.delayedCall(200,()=>{ if(!c.alive||this.over) return; const fs=this.aliveOf(c.side==='hero'?'enemy':'hero');
        if(fs.length){ if(c.aoe){ this.aoeCast(c); } else { const t=(c.side==='enemy'?this.pickByRow(fs):this.pickTarget(c,fs)); c.ranged?this.ranged(c,t,false):this.melee(c,t);} } }); }
  }
  // 全滅 → 結算（撤退/全滅都走 Result）
  finish(win){
    if(this.over) return; this.over=true;
    this.heroes.forEach(c=>{ c.ref.hp = c.alive? c.hp : 0; });
    this.time.delayedCall(700,()=>{ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); });
  }
  // 升級獲得 perk（疾行/護身/熟練）浮字提示：把原本被丟棄的 gainXP 回傳接回來顯示
  _showPerkGains(msgs){ if(!msgs||!msgs.length) return; const W=this.scale.width;
    msgs.forEach((m,i)=>{ const y=100+i*30;
      const t=txt(this,W/2,y+14,m,16,'#ffe08a').setDepth(141).setStroke('#000',5).setAlpha(0);
      this.tweens.add({targets:t,alpha:1,y:y,duration:260,ease:'Back.out'});
      this.tweens.add({targets:t,alpha:0,y:y-24,delay:2000+i*250,duration:650,onComplete:()=>t.destroy()}); }); }
  // 統一戰後獲得提示：右下角同一欄、同樣式、由上到下依序（戰利品 → 技能），右側滑入、停留後左滑淡出
  showGains(list){ if(!list||!list.length) return;
    const W=this.scale.width, H=this.scale.height, x=W-18, lineH=24, baseY=H-22-(list.length-1)*lineH;
    list.forEach((it,i)=>{ const y=baseY+i*lineH;
      const t=txt(this, x+22, y, it.t, 14, it.c||'#ffe08a', 1, 0.5).setDepth(120).setStroke('#000',4).setAlpha(0);
      this.tweens.add({targets:t, x:x, alpha:1, duration:240, delay:i*90, ease:'Quad.out'});
      this.tweens.add({targets:t, alpha:0, x:x-18, delay:1900+i*120, duration:600, ease:'Quad.in', onComplete:()=>t.destroy()}); }); }
  // 本場清空：結算經驗/掉落，推進探險%，王→通關，否則行軍到下一場
  clearStep(){
    if(this.over) return; this.over=true;
    this.heroes.forEach(c=>{ c.ref.hp = c.alive? c.hp : 0; });
    const wasBoss=RUN.isBoss, node=RUN.node;
    this.time.delayedCall(700,()=>{
      const xp = wasBoss?CFG.battleXp.boss:(CFG.battleXp.base+(node?node.risk:1)*CFG.battleXp.perRisk);
      const _ups=gainXP(xp); saveGuild();
      const skillMsgs=(_ups||[]).filter(u=>typeof u==='string' && (u.indexOf('✨')>=0 || u.indexOf('🎓')>=0));   // ✨能力 ＋ 🎓技能（稍後與戰利品一起在右下角顯示）
      const re=relicEffects();
      RUN.heroes.forEach(h=>{ const mx=heroStat(h).maxHp;
        if(re.fullHealAfterBattle){ h.hp=mx; }
        else { h.hp = h.hp>0? Math.min(mx,h.hp+Math.round(mx*CFG.battle.postHealAlive)) : Math.round(mx*CFG.battle.postHealRevive); } });
      if(wasBoss){
        const rel=rollRelicForDest(RUN.destIndex||0);
        const drop = rel || {kind:'貴重物品',name:'守護者寶藏',icon:'💎',value:CFG.battle.bossRelicValue};
        if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(drop); if(drop.kind!=='遺物') discover(drop.name); logItem('gain', drop, '王戰掉落'); }
        RUN.exped.pct=100; this.updatePctBar();
        this.scene.start('Result',{outcome:'clear'}); return;
      }
      const gains=[]; if(RUN) RUN._pendingResourceGains=gains;   // 統一戰後獲得：右下角同一欄、由上到下（戰利品 → 技能）
      if(node&&node.type==='elite'){
        if(hasDeck2() && !RUN.deckExpanded){ RUN.slots+=3; RUN.deckExpanded=true; }
        const count = 2 + (re.extraLoot||0);
        for(let k=0;k<count;k++){ const it=rollItem(node?node.risk:1);
          if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(it); discover(it.name); if(it.gear) ownGear(it.name); logItem('gain', it, '戰利品'); gains.push({t:(it.icon||'')+' '+it.name, c:'#9fd0ff'}); } }
      } else {
        const gc=CFG.gold||{}, g=Math.max(1, Math.round(((gc.battleBase||16)+(node?node.risk:1)*(gc.battlePerRisk||12))*(1+(((RUN.destTier||1)-1)*0.25))));
        addGold(g); this.updateGold(); gains.push({t:'💰 +'+g, c:'#ffe08a'});
        if(hasLeader()){ const ing=forageIngredient(RUN.destIndex||0); const nt=resourceGainNotice(ing,1); if(nt) gains.push(nt); }   // 領隊沿途採集（入持久食材庫存）
        // v1.6：一般戰鬥也有機率掉裝備（偏武器），避免整趟拿不到武器
        const _lc=CFG.loot||{};
        if(Math.random()<(_lc.battleGearChance!=null?_lc.battleGearChance:0.30) && RUN.cargo.length<RUN.slots){
          const wantW=Math.random()<(_lc.battleGearWeaponBias!=null?_lc.battleGearWeaponBias:0.60);
          const git=rollItem(node?node.risk:1, wantW?'武器':'防具');
          if(git){ RUN.cargo.push(git); discover(git.name); if(git.gear) ownGear(git.name); logItem('gain', git, '戰利品'); gains.push({t:(git.icon||'')+' '+git.name, c:'#9fd0ff'}); }
        }
      }
      skillMsgs.forEach(m=>gains.push({t:m, c:'#ffe08a'}));
      this.updateCargo();
      this.showGains(gains);
      if(RUN) RUN._pendingResourceGains=null;
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
      (this.summons||[]).forEach(s=>{ if(s){ s._removed=true; s.alive=false; if(s.container) s.container.destroy(); } }); this.summons=[];   // 換場：清掉殘留召喚精靈
      if(this.encIntro){ this.encIntro.destroy(); this.encIntro=null; } if(this.encCap){ this.encCap.destroy(); this.encCap=null; }
      if(this._envText){ this._envText.destroy(); this._envText=null; }
      this.enemies=[]; this.all=[...(this.heroes||[])];
      this.beginStep();
    });
  }
  advanceStep(){ if(this._advancing) return; this._advancing=true; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } RUN.exped.i++; RUN.exped.pct=Math.min(99, Math.round(RUN.exped.i/RUN.exped.plan.length*99)); this.marchNext(); }
}

