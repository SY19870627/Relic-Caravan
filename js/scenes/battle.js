// ========================= 戰鬥 =========================
class Battle extends Phaser.Scene {
  constructor(){ super('Battle'); }
  // v1.0：常駐遠征場景。create 只做一次性佈景＋探險%條，之後 beginStep 迴圈跑每場遭遇。
  create(){
    this.over=false; this.paused=false; this.infoUI=null; this.hitstopUntil=0; this.entering=false;
    // 場景重啟（第二趟遠征）沿用同一 scene 實例：清掉上一趟殘留(已銷毀)的戰鬥物件參照，
    // 否則 beginStep 會誤判 this.heroes 還在而走 refreshHeroes() 去動已銷毀精靈 → null frame 'cut' 崩潰。
    this.heroes=null; this.enemies=null; this.all=null; this.overlay=null; this.encIntro=null; this.encCap=null; this._sipUntil=0; this._menuPaused=false; this.pauseUI=null;
    const W=this.scale.width, H=this.scale.height;
    this.bgWall=this.add.tileSprite(0,0,W,360,'wall').setOrigin(0).setTileScale(2,2);
    this.bgFloor=this.add.tileSprite(0,360,W,H-360,'floor').setOrigin(0).setTileScale(2,2);
    this.add.rectangle(0,360,W,3,0x0a0710).setOrigin(0);
    const _hb=this.add.graphics().setDepth(59); _hb.fillStyle(UI.bg2,0.8); _hb.fillRoundedRect(8,8,W-16,62,10); _hb.lineStyle(1.5,UI.lineN,0.6); _hb.strokeRoundedRect(8,8,W-16,62,10);
    this.torch(120,150); this.torch(W-120,150);
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
    this.banner = txt(this,W/2,H/2,'',34,'#fff').setStroke('#000',6).setDepth(100);
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
      c.shield=startShield; return c;
    });
    this.heroes.forEach(c=>{ if(c.hp<=0){ c.alive=false; c.container.setAlpha(0.25); c.spr.setTint(0x555555);} });
  }
  refreshHeroes(){
    this.heroes.forEach(c=>{ const h=c.ref, s=heroStat(h), fs=formationSlot(h.sprite), pk=heroPerks(h.idx);
      c.maxHp=s.maxHp; c.atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)); c.def=s.def+this._heroDefMod; c.heal=s.heal;
      c.interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1))); c.useBonus=(pk.useBonus||0);
      c.skills=s.skills; c.weaponTrait=s.weaponTrait; c.armorTrait=s.armorTrait; c.aoe=h.aoe; c.ranged=h.ranged; c.healer=h.healer;
      c.hp=Math.max(0,h.hp); c.alive=c.hp>0;
      c.shield=(this._startShield||0)+(pk.startShield||0)+((s.armorTrait&&s.armorTrait.startShield)||0)+((RUN&&RUN.cookShield)||0)+(horseFeature()==='vanguard'?20:0);
      c.atkI=0; c.firstHitDone=false; c.firstStrikeDone=false; c.killCrit=false; c.markCrit=false; c.deathSaveUsed=false; c._proc=null;
      c.stunned=false; c.stunUntil=0; c.invulnUntil=0; c.lastAttack=-Math.random()*800;
      if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
      c.skillCD={}; (c.skills||[]).forEach(sk=>{ if(sk.cd!==undefined) c.skillCD[sk.name]={last:-1e9,left:sk.uses+(c.useBonus||0)}; });
      c.baseX=fs.x; c.baseY=fs.y; c.row=fs.row; c.container.setPosition(fs.x,fs.y).setAngle(0).setAlpha(c.alive?1:0.25);
      c.spr.clearTint(); if(!c.alive) c.spr.setTint(0x555555);
      if(c.nameText) c.nameText.setText(`${h.name} Lv${s.level}`);
      this.bar(c);
      if(c.pipsCont){ c.pipsCont.destroy(); c.pipsCont=null; c.skillPips=null; }
      this.buildSkillPips(c);
    });
  }
  spawnWave(){
    const ec=this.waves[this.waveIndex];
    const W=this.scale.width;
    const epos = ec.length===1?[[640,360]] : ec.length===2?[[620,255],[620,440]] : [[600,235],[600,455],[720,350]];
    const fresh = ec.map((e,idx)=>{ const big=e.boss;
      const eAtk=e.atkSeq.map(a=>Math.max(1,a+(this._enemyAtkMod||0))), eDef=e.def+(this._enemyDefMod||0);
      const c=this.makeCombatant({sprite:e.sprite,name:e.name,maxHp:e.hp,hp:e.hp,atkSeq:eAtk,def:eDef,heal:e.heal||0,interval:e.interval,ranged:e.ranged,healer:!!e.healer,boss:e.boss,skills:e.skills}, 'enemy', epos[idx]?epos[idx][0]:640, epos[idx]?epos[idx][1]:300, big?6:SCALE);
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
  torch(x,y){
    this.add.rectangle(x,y,8,22,0x4d3019).setDepth(5);
    const glow=this.add.circle(x,y-14,30,0xffb347,0.12).setDepth(4);
    const flame=this.add.ellipse(x,y-16,12,20,0xffb347).setDepth(6);
    const core=this.add.ellipse(x,y-15,6,12,0xffe08a).setDepth(7);
    this.tweens.add({targets:[flame,core],scaleY:0.78,scaleX:1.15,duration:160,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.tweens.add({targets:glow,alpha:0.05,duration:200,yoyo:true,repeat:-1});
  }
  makeCombatant(d,side,x,y,scl){
    const cont=this.add.container(x,y);
    const facing=side==='hero'?1:-1;
    const shadow=this.add.ellipse(0,34,40,12,0x000000,0.4);
    const spr=this.add.image(0,0,d.sprite).setScale(scl||SCALE);
    if(side==='enemy') spr.setFlipX(true);
    const nameText=txt(this,0,-54,d.name,12,'#fff').setStroke('#000',3);
    const barBg=this.add.rectangle(0,-42,52,7,0x000000,0.75).setStrokeStyle(1,0x000000);
    const barFill=this.add.rectangle(-25,-42,50,5,side==='hero'?0x5ad06a:0xd05a5a).setOrigin(0,0.5);
    cont.add([shadow,spr,nameText,barBg,barFill]);
    this.tweens.add({targets:spr,y:-2,duration:550+Math.random()*250,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    const obj={...d,side,container:cont,spr,barFill,nameText,alive:true,facing,baseX:x,baseY:y,lastAttack:-Math.random()*800,atkI:0,shield:0};
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
    ui.add(txt(this,px+20,py-40,`HP ${Math.max(0,Math.round(c.hp))} / ${c.maxHp}`,15,'#9fd0a0',0));
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
  aoeCast(c){
    const foes=this.aliveOf(c.side==='hero'?'enemy':'hero'); if(!foes.length) return;
    this.tweens.add({targets:c.container,x:c.baseX-c.facing*8,duration:140,yoyo:true});
    const cx=foes.reduce((a,b)=>a+b.container.x,0)/foes.length, cy=foes.reduce((a,b)=>a+b.container.y,0)/foes.length;
    const orb=this.add.circle(c.container.x+c.facing*18, c.container.y-4, 7, 0x9a7fd0).setDepth(50).setStrokeStyle(2,0xffffff,0.7);
    const cs=this.trySkill(c,'crit'); const opt = cs? {crit:true, mult:cs.mult} : {crit:false};
    this.tweens.add({targets:orb,x:cx,y:cy,duration:240,ease:'Quad.in',onComplete:()=>{ orb.destroy();
      const ring=this.add.circle(cx,cy,12,0xc9a0ff,0.5).setDepth(45); this.tweens.add({targets:ring,radius:95,alpha:0,duration:320,onComplete:()=>ring.destroy()});
      this.shake(120,0.008);
      const tg=this.aliveOf(c.side==='hero'?'enemy':'hero'); tg.forEach(f=>{ if(f.alive) this.damage(c,f,Object.assign({aoeHit:true},opt)); });
      // 被動・奧術精通（aoeBonus）：命中 2+ 敵時追加一輪較弱全體傷害
      if(this.hasSkillType(c,'aoeBonus') && tg.length>=2){ const _s=this.getSkill(c,'aoeBonus'); if(_s)this.skillProc(c,_s.name,{throttle:1200}); this.floatLabel(c.baseX,c.baseY-58,'奧術連鎖!','#c9a0ff');
        this.time.delayedCall(160,()=>{ if(this.over||!c.alive) return; this.aliveOf(c.side==='hero'?'enemy':'hero').forEach(f=>{ if(f.alive) this.damage(c,f,{aoeHit:true,weak:0.5}); }); }); }
    }});
  }
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
  floatLabel(x,y,s,color){ const t=txt(this,x,y,s,16,color).setDepth(82).setStroke('#000',4); this.tweens.add({targets:t,y:y-28,alpha:0,duration:850,onComplete:()=>t.destroy()}); }
  stun(target,sk,caster){
    // 遺物・枯骨王徽（不倒）：我方低血免疫暈眩
    if(target.side==='hero' && this._lastStand && target.hp/target.maxHp<0.25){ this.floatLabel(target.baseX,target.baseY-52,'免疫','#9fe8ff'); return; }
    target.stunUntil=this.time.now+sk.dur;
    this.floatLabel(target.baseX,target.baseY-52, (sk.name||'暈眩')+'!','#ffd24a');
    this.screenFlash(0xffd24a,0.10,140);
    target.stunned=true; target.spr.setTint(0x9a9ad0);   // 被暈：偏紫灰
    if(!target.stunStar){ target.stunStar=txt(this,target.baseX,target.baseY-60,'★',16,'#ffd24a').setDepth(70).setStroke('#000',3);
      this.tweens.add({targets:target.stunStar,angle:360,duration:700,repeat:-1}); }
    this.time.delayedCall(sk.dur,()=>{ if(target.stunStar){ target.stunStar.destroy(); target.stunStar=null; } target.stunned=false; if(target.alive) target.spr.clearTint(); });
    // 羈絆・掩護射擊：戰士暈敵 → 標記，遊俠下一擊必暴
    if(this._bondStunMark && caster&&caster.sprite==='warrior' && target.side==='enemy'){ this.heroes.forEach(h=>{ if(h.sprite==='ranger'&&h.alive) h.markCrit=true; }); this.floatLabel(target.baseX,target.baseY-72,'破綻!','#9fe8ff'); }
  }
  melee(c,target){
    const fx=c.baseX+(target.container.x-c.baseX)*0.55, fy=c.baseY+(target.container.y-c.baseY)*0.55;
    // 預備後拉 → 衝刺命中 → 回位
    this.tweens.add({targets:c.container,x:c.baseX-c.facing*7,duration:80,ease:'Quad.out',
      onComplete:()=>{ if(this.over) return;
        this.tweens.add({targets:c.container,x:fx,y:fy,duration:130,yoyo:true,ease:'Quad.in',
          onYoyo:()=>{ if(target.alive) this.damage(c,target); }}); }});
  }
  ranged(c,target,magic){
    this.tweens.add({targets:c.container,x:c.baseX-c.facing*10,duration:120,yoyo:true});
    const sx=c.container.x+c.facing*18, sy=c.container.y-4, tx=target.container.x, ty=target.container.y;
    const proj=this.add.rectangle(sx,sy, magic?6:18, magic?6:4, magic?0x9fe8ff:0xffe08a).setDepth(50);
    proj.rotation=Math.atan2(ty-sy,tx-sx); if(magic) proj.setStrokeStyle(2,0xffffff,0.7);
    // 投射物拖尾
    const trail=this.time.addEvent({delay:24,loop:true,callback:()=>{ const g=this.add.rectangle(proj.x,proj.y,magic?5:6,magic?5:3,magic?0x9fe8ff:0xffe08a,0.6).setDepth(49);
      g.rotation=proj.rotation; this.tweens.add({targets:g,alpha:0,scale:0.3,duration:200,onComplete:()=>g.destroy()}); }});
    this.tweens.add({targets:proj,x:tx,y:ty,duration:250,ease:'Quad.in',onComplete:()=>{ trail.remove(); proj.destroy(); if(target.alive) this.damage(c,target); }});
  }
  heal(c,target){
    const baseAmt=Phaser.Math.Between(c.heal, c.heal+CFG.battle.healVariance);
    const critLow=this.hasSkillType(c,'critHealLow');         // 被動・聖療：對半血以下治療翻倍
    const shieldOnHeal=this.getSkill(c,'shieldOnHeal');       // 被動・聖盾：被治療者得護盾
    const cleanse=this.hasSkillType(c,'cleanseOnHeal');       // 被動・神恩：治療解暈
    const sCritHeal=this.getSkill(c,'critHealLow'), sCleanse=this.getSkill(c,'cleanseOnHeal');
    const healOne=(a)=>{ let amt=baseAmt; if(critLow && a.hp/a.maxHp<0.5){ amt*=2; if(sCritHeal)this.skillProc(c,sCritHeal.name,{throttle:1500}); } amt=Math.round(amt);
      const over=Math.max(0,(a.hp+amt)-a.maxHp); a.hp=Math.min(a.maxHp,a.hp+amt); this.bar(a);
      pixelNum(this,a.container.x,a.container.y-34,'+'+amt,0x7dff9a);
      if(this._healToShield && over>0){ a.shield=(a.shield||0)+over; pixelNum(this,a.container.x,a.container.y-52,'🛡+'+over,0x9fd0ff); }   // 遺物・遺忘之鈴
      if(shieldOnHeal){ a.shield=(a.shield||0)+(shieldOnHeal.amt||12); this.skillProc(c,shieldOnHeal.name,{throttle:1500}); }
      if(cleanse && a.stunned){ a.stunUntil=0; a.stunned=false; if(a.stunStar){a.stunStar.destroy(); a.stunStar=null;} if(a.alive) a.spr.clearTint(); if(sCleanse)this.skillProc(c,sCleanse.name,{throttle:1200}); }
      if(this._bondHealInvuln && c.sprite==='priest' && a.sprite==='warrior'){ a.invulnUntil=this.time.now+1000; this.floatLabel(a.baseX,a.baseY-62,'無敵!','#9fe8ff'); }   // 羈絆・以信護盾
      const ring=this.add.circle(a.container.x,a.container.y,10,0x7dff9a,0.5).setDepth(40);
      this.tweens.add({targets:ring,radius:36,alpha:0,duration:450,onComplete:()=>ring.destroy()}); };
    if(this.trySkill(c,'groupHeal')){ this.aliveOf(c.side).forEach(healOne); }
    else healOne(target);
  }
  damage(c,target,opt){
    opt=opt||{};
    const seq=c.atkSeq&&c.atkSeq.length?c.atkSeq:[1];
    let atk=seq[c.atkI % seq.length]; c.atkI++;
    if(opt.weak) atk=Math.round(atk*opt.weak);
    let crit=false, mult=2;
    if(opt.crit!==undefined){ crit=opt.crit; mult=opt.mult||2; }            // 範圍攻擊：暴擊一次套全體
    else { const cs=this.trySkill(c,'crit'); if(cs){ crit=true; mult=cs.mult; } }
    // 條件型暴擊（我方）
    if(!crit && c.side==='hero'){
      if(c.killCrit){ crit=true; mult=2; c.killCrit=false; }                                       // 遺物・低語石板（殺意）
      else if(c.markCrit){ crit=true; mult=2; c.markCrit=false; }                                  // 羈絆・掩護射擊
      else if(this.hasSkillType(c,'critVsFull') && target.hp>=target.maxHp){ crit=true; mult=2; const _s=this.getSkill(c,'critVsFull'); if(_s)this.skillProc(c,_s.name,{throttle:1400}); }   // 被動・鷹眼
      else if(this.hasSkillType(c,'critVsStunned') && target.stunned){ crit=true; mult=2; const _s=this.getSkill(c,'critVsStunned'); if(_s)this.skillProc(c,_s.name,{throttle:1400}); }         // 被動・致命
      else if((this._firstHitCrit||this._cookFirstCrit) && !c.firstHitDone){ crit=true; mult=2; }   // 遺物・永燃聖燭／料理
    }
    if(c.side==='hero') c.firstHitDone=true;
    if(crit) atk=Math.round(atk*mult);
    // 有效防禦：破甲（武器特性）→ 低血 DEF 翻倍（遺物・枯骨王徽／被動・鐵骨）
    let tdef=target.def;
    if(c.weaponTrait&&c.weaponTrait.pierce) tdef=Math.round(tdef*(1-c.weaponTrait.pierce));
    if(target.side==='hero'){
      const _lowHp=this.hasSkillType(target,'lowHpDef') && target.hp/target.maxHp<0.30;
      const lowDef=(this._lastStand && target.hp/target.maxHp<0.25) || _lowHp;
      if(lowDef) tdef*=2;
      if(_lowHp){ const _s=this.getSkill(target,'lowHpDef'); if(_s)this.skillProc(target,_s.name,{throttle:2600}); }
    }
    const raw=Math.max(1, atk - tdef);
    // 羈絆・以信護盾：無敵時間內完全格擋
    if(target.invulnUntil && this.time.now < target.invulnUntil){
      this.floatLabel(target.baseX,target.baseY-40,'格擋','#9fe8ff'); this.spark(target.container.x,target.container.y,0x9fe8ff); return; }
    // 護盾吸收（守護／治療轉盾／裝備／升級／料理）
    let dmg=raw, absorbed=0;
    if(target.shield>0){ absorbed=Math.min(target.shield,dmg); target.shield-=absorbed; dmg-=absorbed; }
    // 免死（被動・護體罩）：每場第一次受致命傷殘留 1 HP
    if(target.side==='hero' && dmg>=target.hp && this.hasSkillType(target,'deathSave') && !target.deathSaveUsed){
      target.deathSaveUsed=true; dmg=Math.max(0,target.hp-1); const _s=this.getSkill(target,'deathSave'); if(_s)this.skillProc(target,_s.name); this.floatLabel(target.baseX,target.baseY-60,'免死!','#ffd24a'); this.screenFlash(0xffd24a,0.2,200); }
    target.hp=Math.max(0,target.hp-dmg); this.bar(target);
    const heavy = !!c.boss || dmg>=20;
    const base = target.boss?6:SCALE;
    if(absorbed>0 && dmg<=0){   // 完全被護盾擋下
      pixelNum(this,target.container.x,target.container.y-34,'🛡'+absorbed,0x9fd0ff); this.spark(target.container.x,target.container.y,0x9fd0ff);
    } else {
      if(absorbed>0) pixelNum(this,target.container.x,target.container.y-52,'🛡'+absorbed,0x9fd0ff);
      pixelNum(this,target.container.x,target.container.y-34,'-'+dmg, crit?0xffd24a:(heavy?0xff8a3a:0xff6b6b), crit||heavy);
      this.spark(target.container.x,target.container.y, crit?0xffd24a:0xffe08a);
      target.spr.setTintFill(crit?0xffe08a:0xffffff); this.time.delayedCall(crit?120:80,()=>{ if(target.alive&&!target.stunned) target.spr.clearTint(); });
      const kb=Math.min(14, 4+dmg*0.4);
      target.spr.setScale(base*1.18, base*0.84);
      this.tweens.add({targets:target.spr,scaleX:base,scaleY:base,duration:170,ease:'Back.out'});
      this.tweens.add({targets:target.container,x:target.container.x+c.facing*kb,duration:60,yoyo:true,ease:'Quad.out'});
    }
    if(crit){ this.floatLabel(c.baseX,c.baseY-58,'暴擊!','#ffd24a'); this.shake(180,0.012); this.screenFlash(0xffe08a,0.22,200); this.hitstop(70); }
    else if(heavy){ this.shake(120,0.007); this.hitstop(45); }
    else { this.shake(55,0.003); }
    // 吸血（遺物・虛空之心 ＋ 武器吸血特性）
    if(c.side==='hero' && dmg>0 && c.alive){ const ls=(this._lifesteal||0)+((c.weaponTrait&&c.weaponTrait.lifesteal)||0);
      if(ls>0 && c.hp<c.maxHp){ const hp=Math.max(1,Math.round(dmg*ls)); c.hp=Math.min(c.maxHp,c.hp+hp); this.bar(c); pixelNum(this,c.container.x,c.container.y-30,'+'+hp,0x7dff9a); } }
    // 反傷（被動・堅守 ＋ 防具反甲）：我方被敵攻擊時反彈
    if(target.side==='hero' && c.side==='enemy' && c.alive && dmg>0){
      let refl=0; const rs=(target.skills||[]).find(s=>s.type==='reflect'); if(rs) refl+=(rs.frac||0.25);
      if(target.armorTrait&&target.armorTrait.thorns) refl+=target.armorTrait.thorns;
      if(refl>0){ const rd=Math.max(1,Math.round(dmg*refl)); c.hp=Math.max(0,c.hp-rd); this.bar(c); pixelNum(this,c.container.x,c.container.y-30,'-'+rd,0xff9a3a); if(rs)this.skillProc(target,rs.name,{throttle:1500}); if(c.hp<=0) this.die(c); } }
    // 武器・週期暈（戰弓）
    if(c.alive && c.weaponTrait&&c.weaponTrait.stunCycle && target.hp>0 && c.atkI % c.weaponTrait.stunCycle===0){ this.stun(target,{name:'眩',dur:800},c); }
    // 濺射（遺物・破碎神像）：我方每第 3 擊對其他敵人造成 50% 濺射
    if(c.side==='hero' && this._splash && !opt.aoeHit && c.alive && c.atkI%3===0){
      const others=this.aliveOf('enemy').filter(f=>f!==target);
      if(others.length){ this.floatLabel(c.baseX,c.baseY-58,'濺射!','#ff8a3a');
        others.forEach(f=>{ const sd=Math.max(1,Math.round(raw*0.5)); f.hp=Math.max(0,f.hp-sd); this.bar(f); pixelNum(this,f.container.x,f.container.y-30,'-'+sd,0xff8a3a); if(f.hp<=0) this.die(f); }); } }
    // 一般暈（主動技能 stun）
    if(target.hp>0){ const ss=this.trySkill(c,'stun'); if(ss) this.stun(target,ss,c); }
    // 擊殺後處理
    if(target.hp<=0){ this.die(target);
      if(c.side==='hero' && this._killCrit && c.alive) c.killCrit=true;               // 遺物・低語石板：擊殺→下一擊必暴
      if(c.sprite==='ranger' && this._bondKillCdCut && c.alive) this.cutPriestCd();    // 羈絆・神諭指引
    }
  }
  bar(c){ c.barFill.width=50*(c.hp/c.maxHp); c.barFill.fillColor = (c.hp/c.maxHp)<0.3 ? 0xff5050 : (c.side==='hero'?0x5ad06a:0xd05a5a); }
  shake(dur,intensity){ this.cameras.main.shake(dur, intensity); }
  screenFlash(color,alpha,dur){ if(!this.fxFlash) return; this.fxFlash.setFillStyle(color,1).setAlpha(alpha);
    this.tweens.add({targets:this.fxFlash,alpha:0,duration:dur||180,ease:'Quad.out'}); }
  hitstop(ms){ this.hitstopUntil=Math.max(this.hitstopUntil, this.time.now+ms); }
  burst(x,y,color){ for(let i=0;i<10;i++){ const a=Math.random()*Math.PI*2, d=20+Math.random()*26;
    const p=this.add.rectangle(x,y,4,4,color).setDepth(60);
    this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d+12,alpha:0,angle:Math.random()*180,scale:0.2,duration:430+Math.random()*220,ease:'Quad.out',onComplete:()=>p.destroy()}); } }
  die(c){
    if(!c.alive) return;   // 防止濺射/反傷重複觸發死亡
    // 復活：遺物・時之沙漏（每場一次）＋ 料理・深海魚（復活充能）
    if(c.side==='hero' && ((this._reviveOnce && !this.reviveUsed) || (RUN && RUN.reviveCharge>0))){
      if(this._reviveOnce && !this.reviveUsed) this.reviveUsed=true; else RUN.reviveCharge--;
      c.hp=Math.max(1,Math.round(c.maxHp*0.5)); this.bar(c);
      this.floatLabel(c.baseX,c.baseY-58,'復活!','#7dff9a'); this.screenFlash(0x7dff9a,0.18,220);
      const ring=this.add.circle(c.container.x,c.container.y,12,0x7dff9a,0.6).setDepth(45);
      this.tweens.add({targets:ring,radius:60,alpha:0,duration:420,onComplete:()=>ring.destroy()});
      return;
    }
    c.alive=false;
    // 遺物・失落聖徽（聖庇）：每場首位成員陣亡 → 全隊回援
    if(c.side==='hero' && this._firstDeathHeal>0 && !this._firstDeathDone){ this._firstDeathDone=true;
      this.aliveOf('hero').forEach(a=>{ const h=Math.round(a.maxHp*this._firstDeathHeal); a.hp=Math.min(a.maxHp,a.hp+h); this.bar(a); pixelNum(this,a.container.x,a.container.y-34,'+'+h,0x7dff9a); });
      this.floatLabel(this.scale.width/2,this.scale.height/2-40,'聖庇！','#7dff9a'); }
    if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
    this.spark(c.container.x,c.container.y, c.side==='hero'?0xff6b6b:0xffe08a);
    this.burst(c.container.x,c.container.y, c.side==='hero'?0xff6b6b:0x9adf6a);
    this.shake(150,0.009);
    this.tweens.add({targets:c.container,alpha:0,angle:c.facing*80,y:c.baseY+16,duration:420,ease:'Quad.in'});
    if(this.aliveOf('hero').length===0){ this.finish(false); return; }
    if(this.aliveOf('enemy').length===0){
      if(this.waveIndex < this.totalWaves-1){       // 還有下一波
        if(this.waveClearing) return;
        this.waveClearing=true;
        this.floatLabel(this.scale.width/2, this.scale.height/2-40, '波次清空！', '#7dff9a');
        this.time.delayedCall(900,()=>{ this.waveClearing=false; this.waveIndex++; this.spawnWave(); });
      } else this.clearStep();                       // 最後一波 → 本場清空、推進探險%
    }
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
  encMeta(t){ return ({
    chest:{spr:'chest', title:'發現寶箱', icon:'🧰', glow:0xffe08a},
    camp :{spr:'campfire', title:'前方有營火', icon:'🔥', glow:0xff9a3a},
    shop :{spr:'merchant', title:'遇見商人', icon:'🧙', glow:0xffe08a},
    event:{spr:'mystery', title:'神秘事件', icon:'❓', glow:0x9fe8ff},
  })[t]; }
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
  openEncounter(t){ if(t==='chest') this.evChest(); else if(t==='camp') this.evCamp(); else if(t==='shop') this.evShop(); else if(t==='event') this.evEvent(); else this.advanceStep(); }
  togglePause(){ if(this._menuPaused) this.resumeGame(); else if(!this.infoUI) this.openPause(); }
  openPause(){ if(this._menuPaused) return; this._menuPaused=true; this.paused=true; this.tweens.pauseAll(); this.time.paused=true; this._renderPause(); }
  resumeGame(){ this._menuPaused=false; this.paused=false; this.tweens.resumeAll(); this.time.paused=false; if(this.pauseUI){ this.pauseUI.destroy(); this.pauseUI=null; } }
  _renderPause(){ const W=this.scale.width,H=this.scale.height;
    if(this.pauseUI){ this.pauseUI.destroy(); this.pauseUI=null; }
    const c=this.add.container(0,0).setDepth(130); this.pauseUI=c;
    c.add(this.add.rectangle(0,0,W,H,0x000000,0.62).setOrigin(0).setInteractive());
    c.add(panel(this,W/2,H/2,440,300,{accent:'gold'}));
    c.add(txt(this,W/2,H/2-112,'⏸ 暫停',24,TH.gold));
    c.add(txt(this,W/2,H/2-80,'遊戲暫停中 · 可調整設定',12,TH.dim));
    const on=!(GUILD.settings && GUILD.settings.autoSip===false);
    c.add(this.add.rectangle(W/2,H/2-4,392,66,0x241a30,0.6).setStrokeStyle(2,0x55476b));
    c.add(txt(this,W/2-176,H/2-16,'⚔ 戰鬥自動喝水',15,TH.text,0));
    c.add(txt(this,W/2-176,H/2+8,'最低血隊員 <30% 自動喝補血藥水',10,TH.dim,0));
    c.add(button(this,W/2+140,H/2-4,104,42, on?'開啟 ✓':'關閉', ()=>{ if(!GUILD.settings) GUILD.settings={}; GUILD.settings.autoSip=!on; saveGuild(); this._renderPause(); }, {variant:on?'go':'info', size:14}));
    c.add(button(this,W/2,H/2+96,220,46,'▶ 繼續遊戲',()=>this.resumeGame(),{variant:'go',size:17}));
  }
  mkOverlay(o){ o=o||{}; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } const W=this.scale.width,H=this.scale.height; const c=this.add.container(0,0).setDepth(96);
    c.add(this.add.rectangle(0,0,W,H,0x000000,0.55).setOrigin(0).setInteractive());
    c.add(panel(this,W/2,H/2,o.w||440,o.h||220,{accent:o.accent||'gold'})); this.overlay=c; return c; }
  evChest(){ const W=this.scale.width,H=this.scale.height; const di=RUN.destIndex||0, _r=Math.random();
    const it = _r<0.22 ? (makeIngredientItem(di)||rollItem(2,'武器')) : _r<0.40 ? (makeMaterialItem(di)||rollItem(2,'防具')) : rollItem(2, Math.random()<0.55?'武器':'防具');
    const o=this.mkOverlay({accent:'gold',h:180});
    let msg; if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(it); discover(it.name); if(it.gear) ownGear(it.name); msg='獲得 '+it.icon+' '+it.name+'（'+it.kind+'）'; } else msg='貨車已滿，放棄 '+it.icon+' '+it.name;
    o.add(txt(this,W/2,H/2-24,'🧰 發現寶箱！',20,TH.gold)); o.add(txt(this,W/2,H/2+14,msg,14,it.kind==='遺物'?TH.cyan:TH.text));
    this.time.delayedCall(1250,()=>this.advanceStep()); }
  evCamp(){ let n=0;
    RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; const b=h.hp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.5)); if(h.hp>b)n++; } });
    this.heroes.forEach(c=>{ if(c.ref){ c.hp=c.ref.hp; this.bar(c);} });
    this._campHealed=n; this._renderCamp(); }
  _renderCamp(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'ember',w:480,h:300});
    o.add(txt(this,W/2,H/2-116,'🔥 營火休息',20,'#f0975a'));
    o.add(txt(this,W/2,H/2-86,'存活成員回復 50% HP（'+(this._campHealed||0)+' 人）',13,TH.text));
    const nItem=RUN.cargo.filter(it=>it.kind==='道具').length, nGear=RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具').length;
    const nIng=RUN.cargo.filter(it=>it.kind==='食材').length, canCookHere=(hasLeader()||hasCampstove());
    o.add(button(this,W/2,H/2-44,330,38, canCookHere?('🍳 料理（食材 '+nIng+'）'):'🍳 料理（需領隊或隨車鍋）',()=>this.evCook(),{variant:canCookHere?'go':'info',size:14}));
    o.add(button(this,W/2-86,H/2+4,160,40,'整裝（'+nGear+'）',()=>this.evGear(),{variant:'info',size:13}));
    o.add(button(this,W/2+86,H/2+4,160,40,'用道具（'+nItem+'）',()=>this.evItems(),{variant:'go',size:13}));
    o.add(button(this,W/2-86,H/2+56,160,40,'繼續前進',()=>this.advanceStep(),{variant:'go',size:14}));
    o.add(button(this,W/2+86,H/2+56,160,40,'撤退收工',()=>{ this.scene.start('Result',{outcome:'retreat'}); },{variant:'danger',size:14})); }
  evCook(){ this._cookMsg=null; this._renderCook(); }
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
  evGear(){ this._gearSel=null; this._renderGear(); }
  _renderGear(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'blue', w:840, h:500});
    o.add(txt(this,W/2,H/2-228,'🎒 整裝 — 換上貨車裡的武器／防具',18,'#9fd0ff'));
    const cargoGear=RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具'), sel=this._gearSel;
    const n=RUN.heroes.length, step=Math.min(180,Math.floor(780/Math.max(1,n))), x0=W/2-(n-1)*step/2;
    RUN.heroes.forEach((h,i)=>{ const x=x0+i*step, y=H/2-118, s=heroStat(h), canRecv=sel!=null;
      const bg=this.add.rectangle(x,y,step-12,150,0x241a30).setStrokeStyle(2,canRecv?0x5ad06a:0x3a3150); o.add(bg);
      o.add(this.add.image(x,y-48,h.sprite).setScale(2.2));
      o.add(txt(this,x,y-8,h.name+' Lv'+s.level,12,TH.gold));
      o.add(txt(this,x,y+12,'⚔'+h.weapon.name,10,'#9fe8ff')); o.add(txt(this,x,y+28,'🛡'+h.armor.name,10,'#9fd0a0'));
      if(canRecv){ const item=cargoGear[sel], req=(item.gear&&item.gear.lvReq)||1, clsOK=gearClassOK(h.sprite,item), ok=s.level>=req&&clsOK;
        o.add(txt(this,x,y+50, ok?'▶ 換上':(clsOK?('需 Lv'+req):'職業不符'),11, ok?'#5ad06a':TH.red));
        if(ok) bg.setInteractive({useHandCursor:true}).on('pointerdown',()=>{ equipSwap(item,i); this._gearSel=null; this._renderGear(); }); } });
    o.add(txt(this,W/2,H/2+40,'貨車裝備（點選 → 再點隊員換上；換下的放回貨車）',12,TH.gold));
    if(!cargoGear.length) o.add(txt(this,W/2,H/2+68,'目前沒有可換的武器或防具',12,TH.dim));
    cargoGear.forEach((it,j)=>{ const x=W/2-330+(j%7)*95, y=H/2+96+Math.floor(j/7)*38;
      o.add(button(this,x,y,88,32,(it.icon||'')+it.name,()=>{ this._gearSel=j; this._renderGear(); },{size:9, fill:j===sel?0x3a6b3a:0x33283f, stroke:j===sel?0x5ad06a:0x55476b})); });
    o.add(button(this,W/2,H/2+210,160,38,'返回營火',()=>this._renderCamp(),{variant:'info',size:14})); }
  evItems(){ this._lastUse=null; this._renderItems(); }
  _renderItems(){ const W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'green', w:520, h:380});
    o.add(txt(this,W/2,H/2-160,'🧪 使用道具（回復／復活全隊）',18,'#9fe8a0'));
    const items=RUN.cargo.filter(it=>it.kind==='道具'); const seen={}; let row=0;
    if(!items.length) o.add(txt(this,W/2,H/2-120,'貨車裡沒有道具',13,TH.dim));
    items.forEach(it=>{ if(seen[it.name]) return; seen[it.name]=true; const cnt=items.filter(x=>x.name===it.name).length; const y=H/2-110+row*46; row++;
      o.add(button(this,W/2,y,440,38,(it.icon||'🧪')+it.name+' ×'+cnt+'　'+(CONSUM_INFO[it.name]||''),()=>{ const one=RUN.cargo.find(x=>x.kind==='道具'&&x.name===it.name); if(one){ this._lastUse=useConsumable(one); this.heroes.forEach(c=>{ if(c.ref){ c.hp=c.ref.hp; this.bar(c);} }); } this._renderItems(); },{size:11,fill:0x3a5f3a,stroke:0x5ad06a,hover:0x4c8c4c})); });
    if(this._lastUse) o.add(txt(this,W/2,H/2+130,this._lastUse,12,'#9fe8a0'));
    o.add(button(this,W/2,H/2+162,160,38,'返回營火',()=>this._renderCamp(),{variant:'info',size:14})); }
  evShop(){ const W=this.scale.width,H=this.scale.height; const o=this.mkOverlay({accent:'gold',w:560,h:320});
    o.add(txt(this,W/2,H/2-128,'🧙 商人',20,TH.gold)); const gt=txt(this,W/2,H/2-104,'💰 '+(RUN.gold||0),13,'#ffe08a'); o.add(gt);
    const buy=(label,cost,y,fn)=>{ const bb=button(this,W/2,y,380,38,label+'（💰'+cost+'）',()=>{ if((RUN.gold||0)<cost) return; spendGold(cost); fn(); gt.setText('💰 '+(RUN.gold||0)); },{size:13,fill:0x3a5f3a,stroke:0x5ad06a,hover:0x4c8c4c}); o.add(bb); };
    buy('治療藥水（回 30%）',20,H/2-58,()=>{ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); discover('治療藥水'); } });
    buy('聖水（回 50%）',40,H/2-14,()=>{ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'聖水',icon:'🧪',value:60}); discover('聖水'); } });
    buy('購入一件裝備',45,H/2+30,()=>{ const pool=(Math.random()<0.5?WEAPONS:ARMORS).filter(x=>!x.starter); if(pool.length&&RUN.cargo.length<RUN.slots){ const it=Phaser.Utils.Array.GetRandom(pool); const isW=!!it.atkSeq; RUN.cargo.push({kind:isW?'武器':'防具',name:it.name,icon:isW?'⚔':'🛡',value:60,gear:it}); discover(it.name);} });
    o.add(button(this,W/2,H/2+96,160,40,'離開',()=>this.advanceStep(),{variant:'info',size:14})); }
  evEvent(){ const W=this.scale.width,H=this.scale.height;
    const pool=[
      {t:'⛲ 治療之泉',d:'飲下清泉，全隊回復 40% 體力',b:'飲用',act:()=>{ RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; h.hp=Math.min(mx,h.hp+Math.round(mx*0.4)); } }); }},
      {t:'🧙 流浪商人',d:'花 💰60 購入 2 瓶治療藥水',b:'購買 💰60',cond:()=>(RUN.gold||0)>=60&&RUN.cargo.length<RUN.slots,act:()=>{ spendGold(60); for(let i=0;i<2;i++){ if(RUN.cargo.length<RUN.slots){ RUN.cargo.push({kind:'道具',name:'治療藥水',icon:'🧪',value:30}); discover('治療藥水'); } } }},
      {t:'🏛 古老祭壇',d:'供奉 💰120，換得本關一件未尋得的遺物',b:'供奉 💰120',cond:()=>(RUN.gold||0)>=120&&RUN.cargo.length<RUN.slots&&uncollectedRelicsForDest(RUN.destIndex||0).length>0,act:()=>{ spendGold(120); const it=rollRelicForDest(RUN.destIndex||0); if(it) RUN.cargo.push(it); }},
    ];
    const ev=Phaser.Utils.Array.GetRandom(pool.filter(e=>!e.cond||e.cond()))||pool[0];
    const o=this.mkOverlay({accent:'green',w:460,h:220});
    o.add(txt(this,W/2,H/2-64,ev.t,19,'#9fe8a0')); o.add(txt(this,W/2,H/2-28,ev.d,13,TH.text).setWordWrapWidth(400));
    o.add(button(this,W/2-92,H/2+40,156,40,ev.b,()=>{ ev.act(); this.advanceStep(); },{variant:'go',size:13}));
    o.add(button(this,W/2+92,H/2+40,156,40,'離開',()=>this.advanceStep(),{variant:'info',size:13})); }
  // 戰後升級三選一：三張並排直式卡片（逐一處理 RUN.pendingLevelups）
  showLevelups(){
    if(!RUN.pendingLevelups || !RUN.pendingLevelups.length){ this.advanceStep(); return; }
    const idx=RUN.pendingLevelups[0];
    if(idx==null){ RUN.pendingLevelups.shift(); this.showLevelups(); return; }
    const choices=rollLevelChoices(idx), hero=HERO_BASE[idx], W=this.scale.width,H=this.scale.height;
    const o=this.mkOverlay({accent:'gold', w:620, h:452});
    o.add(txt(this,W/2,H/2-196,'⬆ '+hero.name+' 升級！',22,TH.gold));
    const cur=((ROSTER[idx]&&ROSTER[idx].skills)||[]).join('、')||'（尚無技能）';
    o.add(txt(this,W/2,H/2-168,'選擇一項　·　目前技能：'+cur+'（最多 2 個）',12,TH.cyan));
    const cw=174, gap=18, n=choices.length, x0=W/2-((n-1)*(cw+gap))/2, cy=H/2+14;
    choices.forEach((c,i)=>{ this.levelCard(o, x0+i*(cw+gap), cy, cw, 250, c, ()=>{
      const eq=(ROSTER[idx]&&ROSTER[idx].skills)||[];
      if(c.type==='newSkill' && eq.length>=2 && !eq.includes(c.name)){ this.showReplace(idx,c); return; }
      applyLevelChoice(idx,c); this._nextLevelup();
    }); });
    if(RUN.pendingLevelups.length>1) o.add(txt(this,W/2,H/2+200,'尚有 '+(RUN.pendingLevelups.length-1)+' 次升級待選',11,TH.dim));
  }
  // 單張技能卡（圖示＋名稱＋說明＋習得/強化標籤；hover 浮起）
  levelCard(o, x, y, w, h, c, onPick){
    const sv=skillVisual(c.name), ac=accent(c.accentName||sv.accent), top=-h/2;
    const card=this.add.container(x,y); o.add(card);
    const g=this.add.graphics(); card.add(g);
    const draw=(hov)=>{ g.clear();
      g.fillStyle(0x000000,0.42); g.fillRoundedRect(-w/2,top+5,w,h,14);
      g.fillStyle(hov?UI.hoverN:UI.raisedN,1); g.fillRoundedRect(-w/2,top,w,h,14);
      g.fillStyle(ac.deep, hov?0.55:0.30); g.fillRoundedRect(-w/2,top,w,Math.round(h*0.32),14);
      g.lineStyle(hov?3:2, ac.num, hov?1:0.85); g.strokeRoundedRect(-w/2,top,w,h,14);
      g.fillStyle(ac.deep,0.55); g.fillCircle(0,top+64,27); g.lineStyle(2,ac.num,0.9); g.strokeCircle(0,top+64,27);
    };
    draw(false);
    card.add(txt(this,0,top+22,(c.tag||(c.type==='upgrade'?'強化':'習得')),12,ac.hex));
    card.add(icon(this,0,top+64,sv.icon,34,ac.num));
    card.add(txt(this,0,top+106,c.name,18,ac.hex));
    card.add(txt(this,0,top+138,c.desc||'',11.5,UI.text,0.5,0).setWordWrapWidth(w-26).setAlign('center'));
    const hit=this.add.rectangle(0,0,w,h,0xffffff,0.001).setInteractive({useHandCursor:true}); card.add(hit);
    hit.on('pointerover',()=>{ draw(true); this.tweens.add({targets:card,y:y-7,duration:110,ease:'Quad.out'}); });
    hit.on('pointerout',()=>{ draw(false); this.tweens.add({targets:card,y:y,duration:110,ease:'Quad.out'}); });
    hit.on('pointerdown',onPick);
    return card;
  }
  showReplace(idx,choice){
    const W=this.scale.width,H=this.scale.height, hero=HERO_BASE[idx], pool=(SKILLS[hero.sprite]||[]);
    const skills=((ROSTER[idx]&&ROSTER[idx].skills)||[]);
    const o=this.mkOverlay({accent:'red', w:580, h:430});
    o.add(txt(this,W/2,H/2-186,'技能槽已滿',20,'#ff8a8a'));
    o.add(txt(this,W/2,H/2-158,'學習「'+choice.name+'」要替換掉哪一個？',13,TH.cyan));
    const cw=180, gap=26, n=skills.length, x0=W/2-((n-1)*(cw+gap))/2, cy=H/2+2;
    skills.forEach((nm,i)=>{ const sk=pool.find(s=>s.name===nm)||{};
      this.levelCard(o, x0+i*(cw+gap), cy, cw, 240, {name:nm, desc:sk.desc||'', tag:'替換掉', accentName:'red'}, ()=>{ applyLevelChoice(idx,choice,nm); this._nextLevelup(); });
    });
    o.add(button(this,W/2,H/2+186,150,38,'取消',()=>this.showLevelups(),{variant:'info',size:13}));
  }
  _nextLevelup(){ RUN.pendingLevelups.shift(); this.showLevelups(); }
  spark(x,y,color){ color=color??0xffe08a;
    const ring=this.add.circle(x,y,5,0xffffff,0.9).setDepth(45);
    this.tweens.add({targets:ring,radius:18,alpha:0,duration:220,onComplete:()=>ring.destroy()});
    for(let i=0;i<6;i++){ const a=Math.random()*Math.PI*2, d=14+Math.random()*14;
      const p=this.add.rectangle(x,y,3,3,color).setDepth(46);
      this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,scale:0.2,duration:260+Math.random()*120,ease:'Quad.out',onComplete:()=>p.destroy()}); }
  }
}
