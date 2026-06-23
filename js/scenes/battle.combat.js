// ========================= 戰鬥 · 戰鬥結算（擴充 Battle.prototype） =========================
Object.assign(Battle.prototype, {
  aoeCast(c){
    const foes=this.aliveOf(c.side==='hero'?'enemy':'hero'); if(!foes.length) return;
    this.tweens.add({targets:c.container,x:c.baseX-c.facing*8,duration:140,yoyo:true});
    const cx=foes.reduce((a,b)=>a+b.container.x,0)/foes.length, cy=foes.reduce((a,b)=>a+b.container.y,0)/foes.length;
    const orb=this.add.circle(c.container.x+c.facing*18, c.container.y-4, 7, 0x9a7fd0).setDepth(50).setStrokeStyle(2,0xffffff,0.7);
    const cs=this.trySkill(c,'crit'); let opt = cs? {crit:true, mult:cs.mult} : {crit:false};
    if(!cs){ const nk=this.trySkill(c,'nuke'); if(nk){ opt={crit:true, mult:nk.mult||2.5}; this.floatLabel(c.baseX,c.baseY-58,(nk.name||'魔力轟擊')+'!','#c46bff'); this.castBurst(c,0xc46bff); } }   // 範圍職(法師)的 nuke 大招＋奧術爆發特效
    this.tweens.add({targets:orb,x:cx,y:cy,duration:240,ease:'Quad.in',onComplete:()=>{ orb.destroy();
      const ring=this.add.circle(cx,cy,12,0xc9a0ff,0.5).setDepth(45); this.tweens.add({targets:ring,radius:95,alpha:0,duration:320,onComplete:()=>ring.destroy()});
      this.shake(120,0.008);
      const tg=this.aliveOf(c.side==='hero'?'enemy':'hero'); tg.forEach(f=>{ if(f.alive) this.damage(c,f,Object.assign({aoeHit:true},opt)); });
      // 被動・奧術精通（aoeBonus）：命中 2+ 敵時追加一輪較弱全體傷害
      if(this.hasSkillType(c,'aoeBonus') && tg.length>=2){ const _s=this.getSkill(c,'aoeBonus'); if(_s)this.skillProc(c,_s.name,{throttle:1200}); this.floatLabel(c.baseX,c.baseY-58,'奧術連鎖!','#c9a0ff');
        this.time.delayedCall(160,()=>{ if(this.over||!c.alive) return; this.aliveOf(c.side==='hero'?'enemy':'hero').forEach(f=>{ if(f.alive) this.damage(c,f,{aoeHit:true,weak:0.5}); }); }); }
    }});
  }
,
  floatLabel(x,y,s,color){ const t=txt(this,x,y,s,16,color).setDepth(82).setStroke('#000',4); this.tweens.add({targets:t,y:y-28,alpha:0,duration:850,onComplete:()=>t.destroy()}); }
,
  stun(target,sk,caster){
    // 遺物・枯骨王徽（不倒）：我方低血免疫暈眩
    if(target.side==='hero' && this._lastStand && target.hp/target.maxHp<0.25){ this.floatLabel(target.baseX,target.baseY-52,'免疫','#9fe8ff'); return; }
    // 大改版・霸體／熊人變身：免疫暈眩
    if(target.side==='hero' && (this.getSkill(target,'hyperarmor') || (target.formUntil&&this.time.now<target.formUntil&&target.form==='bearman'))){ this.floatLabel(target.baseX,target.baseY-52,'免疫','#9fe8ff'); return; }
    target.stunUntil=this.time.now+sk.dur/this.speed; target.stunSpeed=this.speed;   // v2.2：場景時鐘為原始時間，需依倍率縮短才會「與速度一致」
    this.floatLabel(target.baseX,target.baseY-52, (sk.name||'暈眩')+'!','#ffd24a');
    this.screenFlash(0xffd24a,0.10,140);
    target.stunned=true; target.spr.setTint(0x9a9ad0);   // 被暈：偏紫灰
    if(!target.stunStar){ target.stunStar=txt(this,target.baseX,target.baseY-60,'★',16,'#ffd24a').setDepth(70).setStroke('#000',3);
      this.tweens.add({targets:target.stunStar,angle:360,duration:700,repeat:-1}); }
    // v2.0 震懾狀態文字：持續顯示狀態名＋剩餘秒數（每幀由 updateStunLabels 更新、跟隨單位）
    target.stunName=(sk.name||'暈眩');
    if(!target.stunLabel){ target.stunLabel=txt(this,target.container.x,target.baseY-80, target.stunName+' '+(sk.dur/1000).toFixed(1)+'s', 12, '#ffd24a').setDepth(71).setStroke('#000',3); }
    this.time.delayedCall(sk.dur,()=>{ if(target.stunStar){ target.stunStar.destroy(); target.stunStar=null; } if(target.stunLabel){ target.stunLabel.destroy(); target.stunLabel=null; } target.stunned=false; if(target.alive) target.spr.clearTint(); });
    // 羈絆・掩護射擊：戰士暈敵 → 標記，遊俠下一擊必暴
    if(this._bondStunMark && caster&&caster.sprite==='warrior' && target.side==='enemy'){ this.heroes.forEach(h=>{ if(h.sprite==='ranger'&&h.alive) h.markCrit=true; }); this.floatLabel(target.baseX,target.baseY-72,'破綻!','#9fe8ff'); }
  }
,
  melee(c,target){
    const fx=c.baseX+(target.container.x-c.baseX)*0.55, fy=c.baseY+(target.container.y-c.baseY)*0.55;
    // 預備後拉 → 衝刺命中 → 回位
    this.tweens.add({targets:c.container,x:c.baseX-c.facing*7,duration:80,ease:'Quad.out',
      onComplete:()=>{ if(this.over) return;
        this.tweens.add({targets:c.container,x:fx,y:fy,duration:130,yoyo:true,ease:'Quad.in',
          onYoyo:()=>{ if(target.alive) this.damage(c,target); }}); }});
  }
,
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
,
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
      if((this._healToShield&&over>0)||shieldOnHeal) this.bar(a);   // 護盾增減即時反映到血條
      if(cleanse && a.stunned){ a.stunUntil=0; a.stunned=false; if(a.stunStar){a.stunStar.destroy(); a.stunStar=null;} if(a.alive) a.spr.clearTint(); if(sCleanse)this.skillProc(c,sCleanse.name,{throttle:1200}); }
      if(this._bondHealInvuln && c.sprite==='priest' && a.sprite==='warrior'){ a.invulnUntil=this.time.now+1000/this.speed; this.floatLabel(a.baseX,a.baseY-62,'無敵!','#9fe8ff'); }   // 羈絆・以信護盾
      const ring=this.add.circle(a.container.x,a.container.y,10,0x7dff9a,0.5).setDepth(40);
      this.tweens.add({targets:ring,radius:36,alpha:0,duration:450,onComplete:()=>ring.destroy()}); };
    if(this.trySkill(c,'groupHeal')){ this.aliveOf(c.side).forEach(healOne); }
    else healOne(target);
  }
,
  damage(c,target,opt){
    opt=opt||{};
    const seq=c.atkSeq&&c.atkSeq.length?c.atkSeq:[1];
    let atk=seq[c.atkI % seq.length]; c.atkI++;
    if(opt.weak) atk=Math.round(atk*opt.weak);
    const _now=this.time.now;
    if(c.atkBuffUntil && _now<c.atkBuffUntil) atk+=(c.atkBuffAmt||0);              // 大改版・戰吼：限時加攻
    if(c.formUntil && _now<c.formUntil && c.formAtk) atk+=c.formAtk;               // 大改版・牛頭人變身：加攻
    if(c.buffUntil && _now<c.buffUntil) atk=Math.max(1, atk+(c.buffAtk||0));        // 牧師強化(我方+ATK)/弱化(敵-ATK)
    let crit=false, mult=2;
    if(opt.crit!==undefined){ crit=opt.crit; mult=opt.mult||2; }            // 範圍攻擊：暴擊一次套全體
    else { const cs=this.trySkill(c,'crit'); if(cs){ crit=true; mult=cs.mult; }
      else { const nk=this.trySkill(c,'nuke'); if(nk){ crit=true; mult=nk.mult||2.5; this.floatLabel(c.baseX,c.baseY-58,(nk.name||'重擊')+'!','#ff8a3a'); if(c.sprite==='mage') this.castBurst(c,0xc46bff); } } }   // 大改版・重擊類大招
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
    // v2.1 稱號・對族群增傷（取所有生效稱號中最高的比例）
    if(c.side==='hero' && this._title){ const _p=titleDmgVsFor(target.sprite,this._title); if(_p>0) atk=Math.round(atk*(1+_p)); }
    if(c.side==='hero'){ const ex=this.getSkill(c,'execute'); if(ex && target.maxHp>0 && target.hp/target.maxHp<0.30){ atk=Math.round(atk*(1+(ex.frac||0.5))); this.skillProc(c,ex.name,{throttle:1500}); } }   // 大改版・處決：低血增傷
    // 有效防禦：破甲（技能）→ 低血 DEF 翻倍（遺物・枯骨王徽／被動・鐵骨）
    let tdef=target.def;
    { let sp=0; const psk=this.getSkill(c,'pierce'); if(psk) sp+=(psk.frac||0.4); if(c.formUntil&&_now<c.formUntil&&c.formPierce) sp+=c.formPierce; if(sp>0) tdef=Math.round(tdef*(1-Math.min(0.9,sp))); }   // 大改版・破甲/牛頭人變身
    if(target.side==='hero'){
      const _lowHp=this.hasSkillType(target,'lowHpDef') && target.hp/target.maxHp<0.30;
      const lowDef=(this._lastStand && target.hp/target.maxHp<0.25) || _lowHp;
      if(lowDef) tdef*=2;
      if(target.formUntil&&_now<target.formUntil&&target.formDef) tdef+=target.formDef;   // 大改版・熊人變身：加防
      if(_lowHp){ const _s=this.getSkill(target,'lowHpDef'); if(_s)this.skillProc(target,_s.name,{throttle:2600}); }
    }
    if(target.buffUntil && _now<target.buffUntil) tdef=Math.max(0, tdef+(target.buffDef||0));   // 牧師強化(我方+DEF)/弱化(敵-DEF)
    let raw=Math.max(1, atk - tdef);
    if(target.side==='hero'){ let red=0; const ha=this.getSkill(target,'hyperarmor'); if(ha) red+=(ha.frac||0.15); if(target.formUntil&&_now<target.formUntil&&target.formReduce) red+=target.formReduce; if(red>0){ raw=Math.max(1,Math.round(raw*(1-Math.min(0.85,red)))); if(ha)this.skillProc(target,ha.name,{throttle:2600}); } }   // 大改版・霸體/熊人變身：受傷減免
    // 羈絆・以信護盾：無敵時間內完全格擋
    if(target.invulnUntil && this.time.now < target.invulnUntil){
      this.floatLabel(target.baseX,target.baseY-40,'格擋','#9fe8ff'); this.spark(target.container.x,target.container.y,0x9fe8ff); return; }
    // 遺物・古神之眼（洞察）：每位成員本場第一次受到的攻擊無效
    if(target.side==='hero' && this._firstHitBlock && !target.firstBlockUsed){
      target.firstBlockUsed=true; this.floatLabel(target.baseX,target.baseY-46,'洞察!','#9fe8ff'); this.spark(target.container.x,target.container.y,0x9fe8ff); return; }
    // 護盾吸收（守護／治療轉盾／裝備／升級／料理）
    let dmg=raw, absorbed=0;
    if(target.shield>0){ absorbed=Math.min(target.shield,dmg); target.shield-=absorbed; dmg-=absorbed; }
    // 大改版・掩護：部分傷害轉由持「掩護」的隊友承受（不遞迴、不雙重結算）
    if(target.side==='hero' && dmg>1){ const cov=(this.heroes||[]).find(h=>h.alive&&h!==target&&this.getSkill(h,'cover'));
      if(cov){ const cv=this.getSkill(cov,'cover'); const redir=Math.min(dmg-1, Math.round(dmg*(cv.frac||0.20)));
        if(redir>0){ dmg-=redir; cov.hp=Math.max(0,cov.hp-redir); this.bar(cov); pixelNum(this,cov.container.x,cov.container.y-30,'-'+redir,0x9fd0ff); this.skillProc(cov,cv.name,{throttle:1500}); if(cov.hp<=0) this.die(cov); } } }
    // 免死（被動・護體罩）：每場第一次受致命傷殘留 1 HP
    if(target.side==='hero' && dmg>=target.hp && this.hasSkillType(target,'deathSave') && !target.deathSaveUsed){
      target.deathSaveUsed=true; dmg=Math.max(0,target.hp-1); const _s=this.getSkill(target,'deathSave'); if(_s)this.skillProc(target,_s.name); this.floatLabel(target.baseX,target.baseY-60,'免死!','#ffd24a'); this.screenFlash(0xffd24a,0.2,200); }
    const _hpBefore=target.hp;
    target.hp=Math.max(0,target.hp-dmg); this.bar(target);
    if(c.side==='hero' && target.side==='enemy' && dmg>0){ const cr=c.ref||c.ownerRef; if(cr) cr.dmgDealt=(cr.dmgDealt||0)+Math.min(dmg,_hpBefore); }   // DPS：累計有效輸出（不灌水溢殺）；召喚精靈的傷害計入召喚者
    if(c.side==='hero') c._aimUntil=0;   // 防溢殺：這一擊已落地，解除預定
    const heavy = !!c.boss || dmg>=20;
    const base = target.baseScale || (target.boss?6:SCALE);
    if(absorbed>0 && dmg<=0){   // 完全被護盾擋下
      pixelNum(this,target.container.x,target.container.y-34,'🛡'+absorbed,0x9fd0ff); this.spark(target.container.x,target.container.y,0x9fd0ff);
    } else {
      if(absorbed>0) pixelNum(this,target.container.x,target.container.y-52,'🛡'+absorbed,0x9fd0ff);
      pixelNum(this,target.container.x,target.container.y-34,'-'+dmg, crit?0xffd24a:(heavy?0xff8a3a:0xff6b6b), crit);
      this.spark(target.container.x,target.container.y, crit?0xffd24a:0xffe08a);
      target.spr.setTintFill(crit?0xffe08a:0xffffff); this.time.delayedCall(crit?120:80,()=>{ if(target.alive&&!target.stunned){ if(target.berserkUntil&&this.time.now<target.berserkUntil) target.spr.setTint(0xff5050); else target.spr.clearTint(); } });
      const kb=Math.min(14, 4+dmg*0.4);
      target.spr.setScale(base*1.18, base*0.84);
      this.tweens.add({targets:target.spr,scaleX:base,scaleY:base,duration:170,ease:'Back.out'});
      this.tweens.add({targets:target.container,x:target.container.x+c.facing*kb,duration:60,yoyo:true,ease:'Quad.out'});
    }
    if(crit){ this.floatLabel(c.baseX,c.baseY-58,'暴擊!','#ffd24a'); this.shake(180,0.012); this.screenFlash(0xffe08a,0.22,200); this.hitstop(70); }
    else if(heavy){ this.shake(120,0.007); this.hitstop(45); }
    else { this.shake(55,0.003); }
    // 吸血（遺物・虛空之心 ＋ 技能・嗜血）
    if(c.side==='hero' && dmg>0 && c.alive){ const lsk=this.getSkill(c,'lifesteal'); const ls=(this._lifesteal||0)+(lsk?(lsk.frac||0.2):0);
      if(ls>0 && c.hp<c.maxHp){ const hp=Math.max(1,Math.round(dmg*ls)); c.hp=Math.min(c.maxHp,c.hp+hp); this.bar(c); pixelNum(this,c.container.x,c.container.y-30,'+'+hp,0x7dff9a); } }
    // 反傷（被動・堅守）：我方被敵攻擊時反彈
    if(target.side==='hero' && c.side==='enemy' && c.alive && dmg>0){
      let refl=0; const rs=(target.skills||[]).find(s=>s.type==='reflect'); if(rs) refl+=(rs.frac||0.25);
      if(refl>0){ const rd=Math.max(1,Math.round(dmg*refl)); c.hp=Math.max(0,c.hp-rd); this.bar(c); pixelNum(this,c.container.x,c.container.y-30,'-'+rd,0xff9a3a); if(rs)this.skillProc(target,rs.name,{throttle:1500}); if(c.hp<=0) this.die(c); } }
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
,
  bar(c){
    const W=50, hp=Math.max(0,c.hp), sh=Math.max(0,c.shield||0);
    const effMaxSh=Math.max(c.maxShield||0, sh);            // 容許臨時溢盾，刻度仍不爆框
    const denom=(c.maxHp||0)+effMaxSh;                      // 同一條：HP + 護盾 共用刻度
    const hpW=denom>0 ? W*(hp/denom) : 0;
    const shW=denom>0 ? W*(sh/denom) : 0;
    c.barFill.width=hpW;
    c.barFill.fillColor=(c.maxHp>0 && hp/c.maxHp<0.3) ? 0xff5050 : (c.side==='hero'?0x5ad06a:0xd05a5a);   // HP 低於 30% 轉紅
    if(c.shieldFill){ c.shieldFill.width=shW; c.shieldFill.x=-25+hpW; c.shieldFill.setVisible(sh>0); }     // 護盾段緊接 HP 右側，青色
    // v2.3：同步更新上方隊員卡片的 HP 條與數值
    if(c.card){ const fw=c.card.hpBarW, hw=denom>0?fw*(hp/denom):0, sw=denom>0?fw*(sh/denom):0;
      c.card.hpFill.width=hw; c.card.hpFill.fillColor=(c.maxHp>0&&hp/c.maxHp<0.3)?0xff5050:0x5ad06a;
      if(c.card.shFill){ c.card.shFill.width=sw; c.card.shFill.x=9+hw; c.card.shFill.setVisible(sh>0); }
      if(c.card.hpText) c.card.hpText.setText('HP '+Math.round(hp)+'/'+c.maxHp);
    }
  }
,
  shake(dur,intensity){ this.cameras.main.shake(dur, intensity); }
,
  screenFlash(color,alpha,dur){ if(!this.fxFlash) return; this.fxFlash.setFillStyle(color,1).setAlpha(alpha);
    this.tweens.add({targets:this.fxFlash,alpha:0,duration:dur||180,ease:'Quad.out'}); }
,
  hitstop(ms){ this.hitstopUntil=Math.max(this.hitstopUntil, this.time.now+ms/this.speed); }   // v2.2：依倍率縮放
,
  burst(x,y,color){ for(let i=0;i<10;i++){ const a=Math.random()*Math.PI*2, d=20+Math.random()*26;
    const p=this.add.rectangle(x,y,4,4,color).setDepth(60);
    this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d+12,alpha:0,angle:Math.random()*180,scale:0.2,duration:430+Math.random()*220,ease:'Quad.out',onComplete:()=>p.destroy()}); } }
,
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
    if(c.side==='enemy') creditEnemyKill(c);   // v2.0：敵人死亡 → 累計任務擊殺數
    // 遺物・失落聖徽（聖庇）：每場首位成員陣亡 → 全隊回援
    if(c.side==='hero' && this._firstDeathHeal>0 && !this._firstDeathDone){ this._firstDeathDone=true;
      this.aliveOf('hero').forEach(a=>{ const h=Math.round(a.maxHp*this._firstDeathHeal); a.hp=Math.min(a.maxHp,a.hp+h); this.bar(a); pixelNum(this,a.container.x,a.container.y-34,'+'+h,0x7dff9a); });
      this.floatLabel(this.scale.width/2,this.scale.height/2-40,'聖庇！','#7dff9a'); }
    if(c.stunStar){ c.stunStar.destroy(); c.stunStar=null; }
    if(c.stunLabel){ c.stunLabel.destroy(); c.stunLabel=null; }
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
,
  spark(x,y,color){ color=color??0xffe08a;
    const ring=this.add.circle(x,y,5,0xffffff,0.9).setDepth(45);
    this.tweens.add({targets:ring,radius:18,alpha:0,duration:220,onComplete:()=>ring.destroy()});
    for(let i=0;i<6;i++){ const a=Math.random()*Math.PI*2, d=14+Math.random()*14;
      const p=this.add.rectangle(x,y,3,3,color).setDepth(46);
      this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,scale:0.2,duration:260+Math.random()*120,ease:'Quad.out',onComplete:()=>p.destroy()}); }
  }
});
