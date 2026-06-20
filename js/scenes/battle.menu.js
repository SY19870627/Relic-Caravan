// ========================= 戰鬥 · 暫停與升級（擴充 Battle.prototype） =========================
Object.assign(Battle.prototype, {
  togglePause(){ if(this._menuPaused) this.resumeGame(); else if(!this.infoUI) this.openPause(); }
,
  openPause(){ if(this._menuPaused) return; this._menuPaused=true; this.paused=true; this.tweens.pauseAll(); this.time.paused=true; if(this.banner) this.banner.setText('').setAlpha(0); this._renderPause(); }
,
  resumeGame(){ this._menuPaused=false; this.paused=false; this.tweens.resumeAll(); this.time.paused=false; if(this.pauseUI){ this.pauseUI.destroy(); this.pauseUI=null; } if(this._gearFrom==='pause'){ this._gearFrom=null; if(this.overlay){ this.overlay.destroy(); this.overlay=null; } } }
,
  _renderPause(){ const W=this.scale.width,H=this.scale.height;
    if(this.pauseUI){ this.pauseUI.destroy(); this.pauseUI=null; }
    const c=this.add.container(0,0).setDepth(130); this.pauseUI=c;
    c.add(this.add.rectangle(0,0,W,H,0x000000,0.62).setOrigin(0).setInteractive());
    c.add(panel(this,W/2,H/2,440,340,{accent:'gold'}));
    c.add(txt(this,W/2,H/2-134,'⏸ 暫停',24,TH.gold));
    c.add(txt(this,W/2,H/2-104,'遊戲暫停中 · 可調整設定',12,TH.dim));
    const on=!(GUILD.settings && GUILD.settings.autoSip===false);
    c.add(this.add.rectangle(W/2,H/2-54,392,60,0x241a30,0.6).setStrokeStyle(2,0x55476b));
    c.add(txt(this,W/2-176,H/2-64,'⚔ 戰鬥自動喝水',15,TH.text,0));
    c.add(txt(this,W/2-176,H/2-42,'最低血隊員 <30% 自動喝補血藥水',10,TH.dim,0));
    c.add(button(this,W/2+140,H/2-54,104,42, on?'開啟 ✓':'關閉', ()=>{ if(!GUILD.settings) GUILD.settings={}; GUILD.settings.autoSip=!on; saveGuild(); this._renderPause(); }, {variant:on?'go':'info', size:14}));
    if(!this.overlay){ const nG=(RUN&&RUN.cargo)?RUN.cargo.filter(it=>it.kind==='武器'||it.kind==='防具').length:0;
      c.add(button(this,W/2,H/2+18,240,42,'🎒 整裝（換裝備 '+nG+'）',()=>{ this._gearFrom='pause'; if(this.pauseUI){ this.pauseUI.destroy(); this.pauseUI=null; } this.evGear(); },{variant:'info',size:15})); }
    c.add(button(this,W/2,H/2+96,240,46,'▶ 繼續遊戲',()=>this.resumeGame(),{variant:'go',size:17}));
  }
,
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
    o.add(txt(this,W/2,H/2-150,'🟢 綠卡＝習得新技能　·　🟡 金卡＝強化現有技能',11,TH.dim));
    const cw=174, gap=18, n=choices.length, x0=W/2-((n-1)*(cw+gap))/2, cy=H/2+14;
    choices.forEach((c,i)=>{ this.levelCard(o, x0+i*(cw+gap), cy, cw, 250, c, ()=>{
      const eq=(ROSTER[idx]&&ROSTER[idx].skills)||[];
      if(c.type==='newSkill' && eq.length>=2 && !eq.includes(c.name)){ this.showReplace(idx,c); return; }
      applyLevelChoice(idx,c); this._nextLevelup();
    }); });
    if(RUN.pendingLevelups.length>1) o.add(txt(this,W/2,H/2+200,'尚有 '+(RUN.pendingLevelups.length-1)+' 次升級待選',11,TH.dim));
  }
,
  // 單張技能卡（圖示＋名稱＋說明＋習得/強化標籤；hover 浮起）
  levelCard(o, x, y, w, h, c, onPick){
    // 配色一眼區分：習得新技能＝綠、強化現有技能＝金；替換卡沿用紅（accentName）
    const sv=skillVisual(c.name), ac=accent(c.accentName || (c.type==='upgrade'?'gold':'green')), top=-h/2;
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
    card.add(txt(this,0,top+22,(c.tag||(c.type==='upgrade'?'▲ 強化技能':'＋ 習得新技能')),13,ac.hex));
    card.add(icon(this,0,top+64,sv.icon,34,ac.num));
    card.add(txt(this,0,top+106,c.name,18,ac.hex));
    card.add(txt(this,0,top+138,c.desc||'',11.5,UI.text,0.5,0).setWordWrapWidth(w-26).setAlign('center'));
    const hit=this.add.rectangle(0,0,w,h,0xffffff,0.001).setInteractive({useHandCursor:true}); card.add(hit);
    hit.on('pointerover',()=>{ draw(true); this.tweens.add({targets:card,y:y-7,duration:110,ease:'Quad.out'}); });
    hit.on('pointerout',()=>{ draw(false); this.tweens.add({targets:card,y:y,duration:110,ease:'Quad.out'}); });
    hit.on('pointerdown',onPick);
    return card;
  }
,
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
,
  _nextLevelup(){ RUN.pendingLevelups.shift(); this.showLevelups(); }
,
  // 🎯 鎖定優先順序：開啟可重排的覆蓋層（戰鬥暫停）
  openTargetOrder(){ if(this.over||this._targetUI||this._menuPaused||this.infoUI) return;
    this.paused=true; this.tweens.pauseAll(); this.time.paused=true;
    if(this.banner) this.banner.setText('').setAlpha(0);
    this._renderTargetOrder(); }
,
  _renderTargetOrder(){ const W=this.scale.width,H=this.scale.height;
    if(this._targetUI){ this._targetUI.destroy(); this._targetUI=null; }
    const DEF=['lowHp','healer','back','front','lowDef','status'];
    if(typeof TARGET_ORDER==='undefined'||!TARGET_ORDER||!TARGET_ORDER.length) TARGET_ORDER=DEF.slice();
    const NAME={ lowHp:['🩸 低血優先','目前血量最低的敵人優先'],
      lowDef:['🗡 低防優先','防禦最低者（對其輸出最高）'],
      status:['💫 狀態優先','優先攻擊被暈眩等狀態的敵人'],
      healer:['✚ 治療者優先','先解決敵方補師'],
      back:['🏹 後排優先','先拆後排弓手／法師／術士'],
      front:['🛡 前排優先','先打最前線的敵人'] };
    const n=TARGET_ORDER.length, rowH=46, panelH=Math.max(300,150+n*rowH);
    const c=this.add.container(0,0).setDepth(130); this._targetUI=c;
    c.add(this.add.rectangle(0,0,W,H,0x000000,0.62).setOrigin(0).setInteractive());
    c.add(panel(this,W/2,H/2,480,panelH,{accent:'gold'}));
    const tT=H/2-panelH/2+26;
    c.add(txt(this,W/2,tT,'🎯 鎖定優先順序',22,TH.gold));
    c.add(txt(this,W/2,tT+25,'由上到下：英雄會優先攻擊排在前面的目標',11,TH.dim));
    const top=tT+58, x0=W/2-218;
    TARGET_ORDER.forEach((k,i)=>{ const y=top+i*rowH; const info=NAME[k]||[k,''];
      c.add(this.add.rectangle(W/2,y,438,rowH-6,0x241a30,0.6).setStrokeStyle(2,0x55476b));
      c.add(txt(this,x0+10,y-9,(i+1)+'.  '+info[0],14,TH.text,0));
      c.add(txt(this,x0+10,y+11,info[1],10,TH.dim,0));
      if(i>0) c.add(button(this,W/2+158,y,34,34,'▲',()=>{ const t=TARGET_ORDER[i-1]; TARGET_ORDER[i-1]=TARGET_ORDER[i]; TARGET_ORDER[i]=t; this._renderTargetOrder(); },{size:15,variant:'info'}));
      if(i<n-1) c.add(button(this,W/2+196,y,34,34,'▼',()=>{ const t=TARGET_ORDER[i+1]; TARGET_ORDER[i+1]=TARGET_ORDER[i]; TARGET_ORDER[i]=t; this._renderTargetOrder(); },{size:15,variant:'info'}));
    });
    c.add(button(this,W/2,H/2+panelH/2-28,150,38,'完成',()=>this.closeTargetOrder(),{variant:'go',size:15})); }
,
  closeTargetOrder(){ if(this._targetUI){ this._targetUI.destroy(); this._targetUI=null; }
    this.paused=false; this.tweens.resumeAll(); this.time.paused=false;
    if(this.targetBtn&&this.targetBtn.label) this.targetBtn.label.setText(this._targetTopLabel()); }
,
  _targetTopLabel(){ const S={lowHp:'低血',lowDef:'低防',status:'狀態',healer:'治療',back:'後排',front:'前排'}; const k=(typeof TARGET_ORDER!=='undefined'&&TARGET_ORDER&&TARGET_ORDER[0])||'lowHp'; return '🎯 '+(S[k]||'鎖定'); }
});
