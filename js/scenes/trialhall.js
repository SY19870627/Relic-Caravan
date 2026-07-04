// ========================= v4.1 試煉之間（單人晉升試煉）=========================
// 選職業 → 4 關卡（通過關卡 N ＝ 晉升 R(N)）。進關前「簡報面板」充分告知用途/獎勵/環境/規則（定案需求）。
class TrialHall extends Phaser.Scene {
  constructor(){ super('TrialHall'); }
  // v4.2.1：「已招募」的正確判定＝職業序位 < 隊伍格數（v0.9 後 ROSTER.unlocked 恆為 true，不可用）
  recruited(sp){ return CLASS_ORDER.indexOf(sp) < partySizeCap(); }
  create(data){
    const want=(data&&data.sprite)||'warrior';
    this.sprite=this.recruited(want)? want : 'warrior';   // 戰士永遠是第一格，必為已招募
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'試 煉 之 間','單人晉升試煉：通關晉升職業階級、解鎖新技能',{accent:'gold'});
    button(this, 86, 30, 150, 30, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:13, icon:'home', iconSize:13});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const add=o=>{ this._ui.push(o); return o; }, W=this.scale.width;
    // 職業分頁（五職業皆可試煉；試煉不受出戰隊伍限制）
    const tw=92, tg=8, ttot=CLASS_ORDER.length*tw+(CLASS_ORDER.length-1)*tg, tx=W/2-ttot/2+tw/2;
    CLASS_ORDER.forEach((sp,i)=>{ const on=sp===this.sprite, rec=this.recruited(sp);   // v4.2.1：未招募（超出隊伍格）職業鎖住
      add(button(this, tx+i*(tw+tg), 76, tw, 26, (rec?'':'🔒')+CLASS_LABEL[sp],
        ()=>{ if(!rec){ this.flashMsg('尚未招募「'+CLASS_LABEL[sp]+'」——請先至招募所解鎖隊員'); return; } this.sprite=sp; this.render(); },
        {accent:on?'gold':'slate', size:12, color:rec?undefined:UI.faint})); });
    const def=TRIAL_DEFS[this.sprite], rank=classRankOf(this.sprite);
    const rc=chip(this, 0, 104, {label:CLASS_LABEL[this.sprite]+'・現階：'+classRankName(this.sprite)+'（R'+rank+'）', accent:'gold', icon:'star', size:12, h:26, filled:true, textColor:UI.white});
    rc.setX(W/2-rc.w/2); add(rc);
    // 4 關卡列
    def.stages.forEach((sd,i)=>{ const st=i+1, y=158+i*92;
      const cleared=trialCleared(this.sprite,st), open=rank>=st-1;
      const ac=cleared?accent('green'):(open?accent('gold'):accent('slate'));
      const L=W/2-380, ww=760, h=82, top=y-h/2, g=this.add.graphics(); add(g);
      g.fillStyle(0x000000,0.34); g.fillRoundedRect(L,top+4,ww,h,12);
      g.fillStyle(open?UI.raisedN:UI.panelN, open?1:0.6); g.fillRoundedRect(L,top,ww,h,12);
      g.lineStyle(2, ac.num, open?0.9:0.35); g.strokeRoundedRect(L,top,ww,h,12);
      g.fillStyle(ac.num, open?1:0.35); g.fillRoundedRect(L,top,5,h,{tl:12,bl:12,tr:0,br:0});
      add(txt(this, L+24, top+20, '關卡'+'ⅠⅡⅢⅣ'[i]+'・'+sd.title+(cleared?'　✓ 已通過':''), 16, open?ac.hex:UI.faint, 0));
      const sk=trialStageSkills(this.sprite,st).map(s=>s.name).join('、');
      add(txt(this, L+24, top+44, '晉升「'+CFG.ranks.names[st]+'」　解鎖：'+(sk||'—'), 11.5, open?UI.text:UI.faint, 0).setWordWrapWidth(500));
      const wx=WEATHER_BY_ID[sd.weather];
      add(txt(this, L+24, top+64, '環境 '+(wx?wx.icon+wx.name:'')+'　地物 '+[...new Set((sd.objs[0]||[]).map(o=>BATTLE_OBJECTS[o.type]?BATTLE_OBJECTS[o.type].icon:''))].join(' ')+'　敵人：'+(DESTINATIONS[def.dest]?DESTINATIONS[def.dest].name:''), 10.5, UI.dim, 0));
      if(open) add(button(this, L+ww-84, y, 136, 42, cleared?'再次挑戰':'查看簡報', ()=>this.brief(st), {variant:cleared?'info':'go', size:14}));
      else { const cc=chip(this, 0, y, {label:'🔒 需先通過關卡'+'ⅠⅡⅢ'[i-1], accent:'red', size:11, h:26}); cc.setX(L+ww-84-cc.w/2); add(cc); }
    });
  }
  // 試煉簡報（定案：進關前充分告知 用途／通關獲得／環境／規則）
  brief(st){
    const W=this.scale.width, H=this.scale.height, def=TRIAL_DEFS[this.sprite], sd=def.stages[st-1];
    if(this._ov) this._ov.destroy();
    const o=this.add.container(0,0).setDepth(60); this._ov=o;
    o.add(this.add.rectangle(0,0,W,H,0x000000,0.66).setOrigin(0).setInteractive());
    o.add(panel(this, W/2, H/2, 660, 470, {accent:'gold', title:'晉升試煉'+'ⅠⅡⅢⅣ'[st-1]+' — '+sd.title, icon:'star', titleSize:17}));
    let y=H/2-160;
    o.add(txt(this, W/2, y, '【用途】由「'+CLASS_LABEL[this.sprite]+'」單獨出戰；通關即晉升為「'+CFG.ranks.names[st]+'」', 13, UI.text)); y+=30;
    o.add(txt(this, W/2, y, '── 通關獲得 ──', 12, UI.gold)); y+=24;
    const sks=trialStageSkills(this.sprite, st);
    sks.forEach(s=>{ o.add(txt(this, W/2, y, '🎓 '+s.name+'（'+({ultimate:'大招',active:'主動',passive:'被動'}[s.role]||'')+'）— '+(s.desc||''), 11, '#9fe8a0').setWordWrapWidth(600)); y+=22; });
    const pts=(CFG.trial.pointsByStage||[])[st-1]||0, first=!trialCleared(this.sprite,st);
    o.add(txt(this, W/2, y, '✨ 該職業 HP +'+((CFG.ranks.perks.hp||[])[st]||0)+(pts?('　·　職業點數上限 +'+pts):'')+(first?('　·　首通 ⭐聲望 +'+CFG.trial.firstClearRep):''), 11, '#ffe08a')); y+=30;
    const wx=WEATHER_BY_ID[sd.weather];
    o.add(txt(this, W/2, y, '── 試煉環境 ──', 12, UI.gold)); y+=24;
    o.add(txt(this, W/2, y, '天氣 '+(wx?wx.icon+wx.name:'')+'（整場固定）　·　地物 '+[...new Set((sd.objs[0]||[]).map(x=>BATTLE_OBJECTS[x.type]?(BATTLE_OBJECTS[x.type].icon+BATTLE_OBJECTS[x.type].name):''))].join('、')+'　·　敵人來自：'+(DESTINATIONS[def.dest]?DESTINATIONS[def.dest].name:''), 11, UI.text).setWordWrapWidth(600)); y+=26;
    o.add(txt(this, W/2, y, '本關環境是為這批新技能佈置的舞台——通關後到「職業規劃」自行配置 build。', 10.5, UI.dim)); y+=28;
    o.add(txt(this, W/2, y, '【規則】單人出戰・每趟 Lv1 免洗・戰利品不帶回・失敗無任何懲罰，可隨時再挑戰', 10.5, UI.cyan||'#56d6c6'));
    o.add(button(this, W/2-92, H/2+186, 160, 42, '⚔ 出發', ()=>{ initTrialRun(this.sprite, st); this.scene.start('Battle'); }, {variant:'go', size:15}));
    o.add(button(this, W/2+92, H/2+186, 160, 42, '返回', ()=>{ this._ov.destroy(); this._ov=null; }, {variant:'info', size:14}));
  }
  flashMsg(msg){ if(this._f) this._f.destroy();
    this._f=txt(this, this.scale.width/2, 540, msg, 13, UI.red).setDepth(99).setStroke('#000',3);
    this.tweens.add({targets:this._f, alpha:0, delay:1100, duration:500, onComplete:()=>{ if(this._f){ this._f.destroy(); this._f=null; } }}); }
}
