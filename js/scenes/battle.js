// ========================= 戰鬥 =========================
class Battle extends Phaser.Scene {
  constructor(){ super('Battle'); }
  create(){
    this.over=false; this.paused=false; this.infoUI=null; this.hitstopUntil=0; this.entering=false;
    const _re=relicEffects(); this._firstHitCrit=!!_re.firstHitCrit; this._reviveOnce=!!_re.reviveOnce; this.reviveUsed=false;
    // v0.8 規則型遺物旗標
    this._splash=!!_re.splash; this._regen=_re.regen||0; this._killCrit=!!_re.killCrit; this._healToShield=!!_re.healToShield;
    this._lastStand=!!_re.lastStand; this._firstDeathHeal=_re.firstDeathHeal||0; this._firstDeathDone=false;
    this._firstStrikeAoe=!!_re.firstStrikeAoe; this._lifesteal=_re.lifesteal||0; this._startShield=_re.startShield||0;
    this._cookFirstCrit=!!(RUN&&RUN.cookFirstCrit);   // 料理・異香料盛宴（本場首擊必暴）
    // 羈絆觸發（兩名成員都在出戰名單）
    this._bondHealInvuln=bondTriggerActive('healInvuln'); this._bondStunMark=bondTriggerActive('stunMark'); this._bondKillCdCut=bondTriggerActive('killCdCut');
    const W=this.scale.width, H=this.scale.height;
    this.add.tileSprite(0,0,W,360,'wall').setOrigin(0).setTileScale(2,2);
    this.add.tileSprite(0,360,W,H-360,'floor').setOrigin(0).setTileScale(2,2);
    this.add.rectangle(0,360,W,3,0x0a0710).setOrigin(0);
    const _hb=this.add.graphics().setDepth(59); _hb.fillStyle(UI.bg2,0.8); _hb.fillRoundedRect(8,8,W-16,62,10); _hb.lineStyle(1.5,UI.lineN,0.6); _hb.strokeRoundedRect(8,8,W-16,62,10);
    this.torch(120,150); this.torch(W-120,150);
    this.fxFlash=this.add.rectangle(0,0,W,H,0xffffff,1).setOrigin(0).setDepth(95).setAlpha(0); // 全螢幕閃光層

    // 環境（天氣/地形）＋ 料理加成
    const node=RUN.node||{}; const wx=WEATHER_BY_ID[node.weather], tx=TERRAIN_BY_ID[node.terrain]; const cb=RUN.cookBuff||{atk:0,def:0};
    this._heroAtkMod=(cb.atk||0)+((wx&&wx.eff&&wx.eff.allAtk)||0);
    this._heroDefMod=(cb.def||0)+((tx&&tx.eff&&tx.eff.heroDef)||0);
    this._enemyAtkMod=((wx&&wx.eff&&wx.eff.allAtk)||0);
    this._enemyDefMod=((wx&&wx.eff&&wx.eff.enemyDef)||0);
    const envParts=[]; if(wx&&wx.eff)envParts.push(wx.icon+wx.name); if(tx&&tx.eff)envParts.push(tx.icon+tx.name); if(cb.atk||cb.def)envParts.push('🍳料理');
    if(envParts.length) txt(this,W/2,57,'環境／加成　'+envParts.join('　'),11,UI.blue).setDepth(60);
    // 英雄
    this.heroes=RUN.heroes.map((h,idx)=>{ const s=heroStat(h), fs=formationSlot(h.sprite);
      const atkSeq=s.atkSeq.map(a=>Math.max(1,a+this._heroAtkMod)), def=s.def+this._heroDefMod;
      // v0.8 升級 perk（疾行/護身/熟練）＋ 占位者升階功能位
      const pk=heroPerks(h.idx), tp=tierPerk(h.idx);
      const interval=Math.max(350, Math.round(h.interval*(pk.intervalMul||1)));
      const useBonus=(pk.useBonus||0)+(tp.useBonus||0);
      const startShield=(this._startShield||0)+(pk.startShield||0)+(tp.startShield||0)+((s.armorTrait&&s.armorTrait.startShield)||0)+((RUN&&RUN.cookShield)||0);
      const c=this.makeCombatant({sprite:h.sprite,name:`${h.name} Lv${s.level}`,maxHp:s.maxHp,hp:Math.max(0,h.hp),atkSeq,def,heal:s.heal,interval,ranged:h.ranged,healer:h.healer,aoe:h.aoe,skills:s.skills,row:fs.row,ref:h, weaponTrait:s.weaponTrait, armorTrait:s.armorTrait, useBonus}, 'hero', fs.x, fs.y);
      c.shield=startShield;
      return c;
    });
    // 敵人（多波次）：RUN.encounter = 波次陣列
    this.waves = RUN.encounter;
    this.totalWaves = this.waves.length;
    this.waveIndex = 0;
    this.waveClearing = false;
    this.enemies = [];
    this.all = [...this.heroes];
    // 死亡英雄這場躺著（hp0）
    this.heroes.forEach(c=>{ if(c.hp<=0){ c.alive=false; c.container.setAlpha(0.25); c.spr.setTint(0x555555);} });
    if(RUN){ RUN.cookShield=0; RUN.cookFirstCrit=false; }   // 料理一次性效果讀取後即清

    txt(this,W/2,20,'點擊任一角色可查看明細（會暫停戰鬥）',12,UI.dim).setDepth(60);
    // 戰鬥速度（跨場記住）
    this.speed = BATTLE_SPEED || 1;
    this.tweens.timeScale = this.speed; this.time.timeScale = this.speed;
    this.speedBtn = button(this, W-64, 20, 100, 28, `速度 x${this.speed}`, ()=>{
      this.speed = this.speed>=4 ? 1 : this.speed*2; BATTLE_SPEED=this.speed;
      this.tweens.timeScale=this.speed; this.time.timeScale=this.speed;
      this.speedBtn.label.setText(`速度 x${this.speed}`);
    }, {size:12,fill:0x33486b,stroke:0x5a8cd0,hover:0x466a9c});
    this.speedBtn.setDepth(60);
    this.waveText = txt(this,W/2,39,'',13,UI.gold).setDepth(60);
    this.banner = txt(this,W/2,H/2,'',34,'#fff').setStroke('#000',6).setDepth(100);
    this.spawnWave();
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
    this.banner.setText(msg).setAlpha(1);
    this.tweens.add({targets:this.banner,alpha:0,delay:850,duration:450,onComplete:()=>this.banner.setText('')});
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
    const obj={...d,side,container:cont,spr,barFill,alive:true,facing,baseX:x,baseY:y,lastAttack:-Math.random()*800,atkI:0,shield:0};
    obj.skillCD={};
    (obj.skills||[]).forEach(s=>{ if(s.cd!==undefined) obj.skillCD[s.name]={last:-1e9,left:s.uses+(d.useBonus||0)}; });
    spr.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.showInfo(obj));
    return obj;
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
    if(this.over||this.paused) return;
    if(this.entering) return;              // 敵人走位進場中，雙方都先不出手
    if(this.time.now < this.hitstopUntil) return;   // 命中停頓（用場景時鐘，與速度一致）
    for(const c of this.all){ if(!c.alive) continue; if(this.time.now < (c.stunUntil||0)) continue;
      if(time>c.lastAttack+c.interval/this.speed){ c.lastAttack=time; this.act(c); } }
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
    if(cs) this.floatLabel(c.baseX,c.baseY-58,'炎爆!','#c9a0ff');
    this.tweens.add({targets:orb,x:cx,y:cy,duration:240,ease:'Quad.in',onComplete:()=>{ orb.destroy();
      const ring=this.add.circle(cx,cy,12,0xc9a0ff,0.5).setDepth(45); this.tweens.add({targets:ring,radius:95,alpha:0,duration:320,onComplete:()=>ring.destroy()});
      this.shake(120,0.008);
      const tg=this.aliveOf(c.side==='hero'?'enemy':'hero'); tg.forEach(f=>{ if(f.alive) this.damage(c,f,Object.assign({aoeHit:true},opt)); });
      // 被動・奧術精通（aoeBonus）：命中 2+ 敵時追加一輪較弱全體傷害
      if(this.hasSkillType(c,'aoeBonus') && tg.length>=2){ this.floatLabel(c.baseX,c.baseY-58,'奧術連鎖!','#c9a0ff');
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
    st.last=this.time.now; st.left--; return s;
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
    if(this.trySkill(c,'doubleHit')){ this.floatLabel(c.baseX,c.baseY-52, c.aoe?'連環施法!':'連射!','#9fe8ff');
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
    const healOne=(a)=>{ let amt=baseAmt; if(critLow && a.hp/a.maxHp<0.5) amt*=2; amt=Math.round(amt);
      const over=Math.max(0,(a.hp+amt)-a.maxHp); a.hp=Math.min(a.maxHp,a.hp+amt); this.bar(a);
      pixelNum(this,a.container.x,a.container.y-34,'+'+amt,0x7dff9a);
      if(this._healToShield && over>0){ a.shield=(a.shield||0)+over; pixelNum(this,a.container.x,a.container.y-52,'🛡+'+over,0x9fd0ff); }   // 遺物・遺忘之鈴
      if(shieldOnHeal){ a.shield=(a.shield||0)+(shieldOnHeal.amt||12); }
      if(cleanse && a.stunned){ a.stunUntil=0; a.stunned=false; if(a.stunStar){a.stunStar.destroy(); a.stunStar=null;} if(a.alive) a.spr.clearTint(); }
      if(this._bondHealInvuln && c.sprite==='priest' && a.sprite==='warrior'){ a.invulnUntil=this.time.now+1000; this.floatLabel(a.baseX,a.baseY-62,'無敵!','#9fe8ff'); }   // 羈絆・以信護盾
      const ring=this.add.circle(a.container.x,a.container.y,10,0x7dff9a,0.5).setDepth(40);
      this.tweens.add({targets:ring,radius:36,alpha:0,duration:450,onComplete:()=>ring.destroy()}); };
    if(this.trySkill(c,'groupHeal')){ this.floatLabel(c.baseX,c.baseY-52,'群體治療!','#7dff9a'); this.aliveOf(c.side).forEach(healOne); }
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
      else if(this.hasSkillType(c,'critVsFull') && target.hp>=target.maxHp){ crit=true; mult=2; }   // 被動・鷹眼
      else if(this.hasSkillType(c,'critVsStunned') && target.stunned){ crit=true; mult=2; }         // 被動・致命
      else if((this._firstHitCrit||this._cookFirstCrit) && !c.firstHitDone){ crit=true; mult=2; }   // 遺物・永燃聖燭／料理
    }
    if(c.side==='hero') c.firstHitDone=true;
    if(crit) atk=Math.round(atk*mult);
    // 有效防禦：破甲（武器特性）→ 低血 DEF 翻倍（遺物・枯骨王徽／被動・鐵骨）
    let tdef=target.def;
    if(c.weaponTrait&&c.weaponTrait.pierce) tdef=Math.round(tdef*(1-c.weaponTrait.pierce));
    if(target.side==='hero'){
      const lowDef=(this._lastStand && target.hp/target.maxHp<0.25) || (this.hasSkillType(target,'lowHpDef') && target.hp/target.maxHp<0.30);
      if(lowDef) tdef*=2;
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
      target.deathSaveUsed=true; dmg=Math.max(0,target.hp-1); this.floatLabel(target.baseX,target.baseY-60,'免死!','#ffd24a'); this.screenFlash(0xffd24a,0.2,200); }
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
      if(refl>0){ const rd=Math.max(1,Math.round(dmg*refl)); c.hp=Math.max(0,c.hp-rd); this.bar(c); pixelNum(this,c.container.x,c.container.y-30,'-'+rd,0xff9a3a); if(c.hp<=0) this.die(c); } }
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
      } else this.finish(true);                      // 最後一波 → 勝利
    }
  }
  finish(win){
    if(this.over) return; this.over=true;
    // 回存英雄 HP
    this.heroes.forEach(c=>{ c.ref.hp = c.alive? c.hp : 0; });
    this.time.delayedCall(700,()=>{
      if(!win){ RUN.wiped=true; this.scene.start('Result',{outcome:'wipe'}); return; }
      // 勝利：取得經驗（可能升級），再用升級後上限恢復
      const node=RUN.node;
      const xp = RUN.isBoss?CFG.battleXp.boss:(CFG.battleXp.base+(node?node.risk:1)*CFG.battleXp.perRisk);
      const ups = gainXP(xp); saveGuild();
      // 戰後回復：遺物・永恆之輪 → 全隊完全回復；否則小幅回復（消耗戰）
      const re=relicEffects();
      RUN.heroes.forEach(h=>{ const mx=heroStat(h).maxHp;
        if(re.fullHealAfterBattle){ h.hp=mx; }
        else { h.hp = h.hp>0? Math.min(mx,h.hp+Math.round(mx*CFG.battle.postHealAlive)) : Math.round(mx*CFG.battle.postHealRevive); } });
      if(RUN.isBoss){
        const rel=rollRelicForDest(RUN.destIndex||0);
        if(rel) RUN.cargo.push(rel);
        else RUN.cargo.push({kind:'貴重物品',name:'守護者寶藏',icon:'💎',value:CFG.battle.bossRelicValue});
        this.scene.start('Result',{outcome:'clear'});
      }
      else {
        // 工匠・貨車第二層（deck2）：清掉精英戰後開啟，貨格 +3
        if(node&&node.type==='elite' && hasDeck2() && !RUN.deckExpanded){ RUN.slots+=3; RUN.deckExpanded=true; RUN.itemToast='📦 貨車第二層開啟！貨格 +3'; }
        const count = (node&&node.type==='elite'?2:1) + (re.extraLoot||0);   // 古神之眼／創世殘頁：額外掉落
        const got=[], full=[];
        for(let k=0;k<count;k++){ const it=rollItem(node?node.risk:1);
          if(RUN.cargo.length<RUN.slots){ RUN.cargo.push(it); got.push(it); } else full.push(it); }
        RUN.pendingReward={got,full,xp,levelups:ups};
        this.scene.start('Map');
      }
    });
  }
  spark(x,y,color){ color=color??0xffe08a;
    const ring=this.add.circle(x,y,5,0xffffff,0.9).setDepth(45);
    this.tweens.add({targets:ring,radius:18,alpha:0,duration:220,onComplete:()=>ring.destroy()});
    for(let i=0;i<6;i++){ const a=Math.random()*Math.PI*2, d=14+Math.random()*14;
      const p=this.add.rectangle(x,y,3,3,color).setDepth(46);
      this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,scale:0.2,duration:260+Math.random()*120,ease:'Quad.out',onComplete:()=>p.destroy()}); }
  }
}
