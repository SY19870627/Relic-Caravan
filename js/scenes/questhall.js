// ========================= 任務 / 懸賞（v2.1 分階段任務鏈）=========================
// 每條任務線共用一個累計擊殺，分 4 階；達標領取 → +聲望、解鎖該階稱號（解鎖即生效、可全部疊加）。
// 同一線只生效「最高已領階段」的稱號；數值跨線相加，震懾/增傷同族群取最高。
class QuestHall extends Phaser.Scene {
  constructor(){ super('QuestHall'); }
  create(){
    if(!RUN) initRun();
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'任 務 ・ 懸 賞','擊殺累計跨階保留；達標領取 → 聲望＋稱號。稱號全部解鎖即生效、可疊加（同族群取最高階）',{accent:'gold'});
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[]; const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    let activeN=0, doneStages=0, totalStages=0;
    QUEST_LINES.forEach(l=>{ totalStages+=l.stages.length; doneStages+=lineStageIdx(l.id); if(lineActiveTitle(l)) activeN++; });
    const specs=[
      {label:'⭐ 聲望 '+reputation(), accent:'gold', icon:'star', size:12, h:26},
      {label:'生效稱號 '+activeN+' 條線（全開）', accent:'violet', icon:'star', size:12, h:26},
      {label:'已完成階段 '+doneStages+' / '+totalStages, accent:'green', icon:'chest', size:12, h:26},
    ];
    const chips=specs.map(s=>chip(this,0,0,s)); const gap=10; let tot=chips.reduce((a,c)=>a+c.w,0)+gap*(chips.length-1);
    let cx=W/2-tot/2; chips.forEach(c=>{ c.setX(cx); c.setY(58); add(c); cx+=c.w+gap; });
    const y0=104, pitch=53;
    QUEST_LINES.forEach((l,i)=> this.questRow(l, y0+i*pitch));
  }
  questRow(line, y){
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const L=W/2-432, w=864, h=47, top=y-h/2;
    const kills=lineKills(line.id), st=lineCurrentStage(line), claimable=lineStageClaimable(line), allDone=lineAllDone(line), active=lineActiveTitle(line);
    const sIdx=lineStageIdx(line.id), nS=line.stages.length;
    const ac = claimable? accent('gold') : (allDone? accent('violet') : (active? accent('teal') : accent('slate')));
    const g=this.add.graphics(); add(g);
    g.fillStyle(0x000000,0.28); g.fillRoundedRect(L,top+3,w,h,10);
    g.fillStyle(UI.raisedN,1); g.fillRoundedRect(L,top,w,h,10);
    if(claimable||active){ g.fillStyle(ac.deep,0.2); g.fillRoundedRect(L,top,w,h,10); }
    g.lineStyle(1.5, ac.num, (claimable||allDone)?0.95:0.55); g.strokeRoundedRect(L,top,w,h,10);
    add(txt(this, L+24, y, line.icon||'⚔', 20, '#fff'));
    const stageTag = allDone? '★ 全數完成' : ('第 '+(sIdx+1)+' / '+nS+' 階');
    add(txt(this, L+48, y-12, line.name+'　['+stageTag+']'+(active?'　·　生效中：'+active.name:''), 13.5, ac.hex, 0));
    const reward = st? st.title : active;   // 未完成→下一階目標；已全完成→最高階稱號
    add(txt(this, L+48, y+9, reward? ((st?'下一階 ':'最高階 ')+reward.name+'：'+reward.desc) : '—', 10.5, UI.dim, 0).setWordWrapWidth(470));
    const tgt = st? st.target : line.stages[nS-1].target, px=L+540, capK=Math.min(kills,tgt);
    add(txt(this, px, y-11, allDone? ('擊殺 '+kills+'（封頂）') : ('擊殺 '+capK+' / '+tgt), 11, claimable?UI.green:UI.text, 0));
    add(statBar(this, px, y+8, 150, 8, capK, tgt, {accent: claimable?'green':(allDone?'violet':'gold')}));
    const bx=L+w-76;
    if(claimable){ add(button(this, bx, y, 132, 34, '領取獎勵', ()=>{ const got=claimLineStage(line.id);
      if(got) this.flash('解鎖稱號「'+got.title.name+'」(生效中) ＋'+(got.rep||1)+' 聲望', '#ffe08a'); this.render(); }, {variant:'go', size:13, icon:'star', iconSize:13})); }
    else if(allDone){ add(txt(this, bx, y, '✓ 已達最高階', 12, accent('violet').hex)); }
    else { add(txt(this, bx, y, '進行中', 12, UI.dim)); }
  }
  flash(msg,color){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2, 540, msg, 14, color||'#ffe08a').setDepth(99).setStroke('#000',4);
    this.tweens.add({targets:this._f, alpha:0, delay:1400, duration:600, onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
