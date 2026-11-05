// ========================= 公會委託板（v156：素材委託＋懸賞委託；原 任務 / 懸賞）=========================
// 每條任務線共用一個累計擊殺，分 4 階；達標領取 → +聲望、解鎖該階稱號（解鎖即生效、可全部疊加）。
// 同一線只生效「最高已領階段」的稱號；數值跨線相加，震懾/增傷同族群取最高。
class QuestHall extends Phaser.Scene {
  constructor(){ super('QuestHall'); }
  create(){
    if(!RUN) initRun();
    sceneBg(this,{glow:0xf2c14e});
    sceneHeader(this,'公 會 委 託','公會需要的材料與懸賞都貼在這裡。冒險者完成委託，公會付聲望。',{accent:'gold'});
    if(!this._tab) this._tab='mat';
    button(this, 70, 20, 120, 28, '返回大廳', ()=>this.scene.start('GuildHall'), {variant:'info', size:12, icon:'home', iconSize:13});
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[]; const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const tabs=[['mat','📜 素材委託'],['bounty','⚔ 懸賞委託']];
    tabs.forEach((t,i)=>{ const on=this._tab===t[0]; add(button(this, W/2-90+i*180, 84, 170, 30, t[1], ()=>{ this._tab=t[0]; this.render(); }, {variant:on?'gold':'info', size:12})); });
    if(this._tab==='mat'){ this.renderMat(); return; }
    let doneStages=0, totalStages=0;
    QUEST_LINES.forEach(l=>{ totalStages+=l.stages.length; doneStages+=lineStageIdx(l.id); });
    const doneChip=chip(this,0,0,{label:'已完成階段 '+doneStages+' / '+totalStages, accent:'green', icon:'chest', size:12, h:26});
    doneChip.setX(W/2+360-doneChip.w/2); doneChip.setY(52); add(doneChip);
    const y0=128, pitch=48;
    QUEST_LINES.forEach((l,i)=> this.questRow(l, y0+i*pitch));
  }
  renderMat(){
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const list=ensureCommissions(), cap=commissionCap(), bonus=commissionRepBonus();
    add(txt(this, W/2, 130, '把素材放上貨車帶回來，回公會結算時勾選要交哪幾張。每趟最多交 '+cap+' 張'+(bonus?('，每張額外 ⭐+'+bonus+'（公會帳簿）'):'')+'。', 13, UI.text));
    add(txt(this, W/2, 152, '沒交出的素材會收進倉庫，給工坊用。全員倒下時，貨車上的素材會一起失去。', 11.5, UI.dim));
    const cw=270, gap=24, x0=W/2-(list.length*cw+(list.length-1)*gap)/2+cw/2;
    list.forEach((c,i)=>{ const m=MATERIAL_BY_ID[c.mat]||{icon:'🧱',name:c.mat}, cx=x0+i*(cw+gap), cy=290;
      add(panel(this, cx, cy, cw, 190, {accent:'gold', title:'委託 '+(i+1)}));
      add(txt(this, cx, cy-30, m.icon, 34, '#fff'));
      add(txt(this, cx, cy+14, '需要 '+m.name+' ×'+c.n, 16, UI.text));
      add(txt(this, cx, cy+42, '報酬 ⭐ +'+commissionRep(c), 15, UI.gold));
      add(txt(this, cx, cy+68, '倉庫存量 '+matCount(c.mat)+'（倉庫的不能交，要這趟帶回）', 10.5, UI.faint).setWordWrapWidth(cw-20)); });
    add(txt(this, W/2, 408, '委託板在每次回到公會後刷新。', 11.5, UI.dim));
    // v159：公會帳簿／旗幟從馬車工坊搬來（存檔與效果不變，只改購買入口）
    add(txt(this, W/2, 432, '── 公會建設（原馬車工坊・需師傅工匠）──', 12, UI.gold));
    const guildUps=UPGRADES.filter(u=>u.id==='spring'||u.id==='flag');
    guildUps.forEach((u,i)=>{
      const cx=W/2+(i?200:-200), cy=492;
      const lv=upgradeLv(u.id), maxed=lv>=(u.maxLv||1), ok=canBuyUpgrade(u);
      const ct=craftsmanTier(), need=ct<(u.craftReq||2);
      add(panel(this, cx, cy, 360, 78, {accent:maxed?'green':(ok?'gold':'slate'), title:u.name+'　Lv'+lv+'/'+(u.maxLv||1)}));
      add(txt(this, cx, cy-4, u.desc, 11, UI.text).setWordWrapWidth(320));
      const cost=maxed?'✓ 滿級':(need?'需師傅工匠':upgradeCostText(u));
      add(txt(this, cx, cy+22, cost, 11, maxed?'#5ad06a':(ok?UI.green:UI.dim)));
      if(!maxed && !need){
        const hit=this.add.rectangle(cx,cy,360,78,0xffffff,0.001).setInteractive({useHandCursor:true}); add(hit);
        hit.on('pointerdown',()=>{
          const nl=lv+1, m=u.cost.mats||{};
          for(const k in m){ if(matCount(k)<matCostAt(m[k],nl)){ this.flash('素材不足：'+(MATERIAL_BY_ID[k]?MATERIAL_BY_ID[k].name:k)+'×'+matCostAt(m[k],nl)); return; } }
          if(!buyUpgrade(u)){ this.flash('聲望不足'); return; }
          this.flash(u.name+' → Lv'+nl, '#9fe8a0'); this.render();
        });
      }
    });
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
